import { Router } from 'express';
import { 
  getWalletInfo, 
  depositFunds, 
  withdrawFunds, 
  transferFunds, 
  getTransactions 
} from '../controllers/paymentController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/wallet', getWalletInfo);
router.post('/deposit', depositFunds);
router.post('/withdraw', withdrawFunds);
router.post('/transfer', transferFunds);
router.get('/history', getTransactions);

export default router;
