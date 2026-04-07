import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { DocumentModel } from '../models/Document';
import fs from 'fs';

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|png|jpg|jpeg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only documents and images are allowed'));
  },
});

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const { name } = req.body;
    const owner = (req as any).user?._id;

    const document = await DocumentModel.create({
      name: name || req.file.originalname,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      owner,
      fileType: req.file.mimetype,
      size: req.file.size,
      status: 'pending_signature',
    });

    res.status(201).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading document', error });
  }
};

export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const documents = await DocumentModel.find({
      $or: [{ owner: userId }, { 'signatures.userId': userId }]
    }).populate('owner', 'name email role');

    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error });
  }
};

export const signDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { signatureImage } = req.body;
    const userId = (req as any).user?._id;

    const document = await DocumentModel.findById(id);
    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    // Find the signature entry for this user
    let sigIndex = document.signatures.findIndex(sig => sig.userId.toString() === userId.toString());
    
    if (sigIndex === -1) {
      // If not specifically requested to sign, add them as a signer
      document.signatures.push({
        userId,
        signatureImage,
        signedAt: new Date()
      });
    } else {
      document.signatures[sigIndex].signatureImage = signatureImage;
      document.signatures[sigIndex].signedAt = new Date();
    }

    // Check if all signers have signed
    const allSigned = document.signatures.every(sig => sig.signatureImage);
    if (allSigned) {
      document.status = 'signed';
    }

    await document.save();
    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ message: 'Error signing document', error });
  }
};
