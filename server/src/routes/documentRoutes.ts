import { Router } from 'express';
import { upload, uploadDocument, getDocuments, signDocument } from '../controllers/documentController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/upload', upload.single('document'), uploadDocument);
router.get('/', getDocuments);
router.post('/:id/sign', signDocument);

export default router;
