import express from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount 
} from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

export default router;
