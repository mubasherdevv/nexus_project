import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as documentController from '../controllers/documentController.js';

const router = Router();

router.use(protect);

router.post('/upload', documentController.upload.single('document'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.post('/:id/sign', documentController.signDocument);

export default router;
