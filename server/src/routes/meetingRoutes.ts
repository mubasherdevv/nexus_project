import { Router } from 'express';
import { scheduleMeeting, getUserMeetings, updateMeetingStatus } from '../controllers/meetingController.js';
import { protect } from '../middleware/auth.js';
import { DocumentModel } from '../models/Document.js';
import { User } from '../models/User.js';

const router = Router();

router.use(protect); // All meeting routes are protected

router.post('/', scheduleMeeting);
router.get('/', getUserMeetings);
router.patch('/:id/status', updateMeetingStatus);

export default router;
