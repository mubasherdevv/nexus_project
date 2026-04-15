import { Router } from 'express';
import { 
  getWalletInfo, 
  depositFunds, 
  withdrawFunds, 
  transferFunds, 
  getTransactions 
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/wallet', getWalletInfo);
router.post('/deposit', depositFunds);
router.post('/withdraw', withdrawFunds);
router.post('/transfer', transferFunds);
router.get('/history', getTransactions);

export default router;
