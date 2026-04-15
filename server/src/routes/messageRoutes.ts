import express from 'express';
import { getMessages, getConversations } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Ensure all messaging routes are protected

router.get('/conversations', getConversations);
router.get('/:userId', getMessages);

export default router;
