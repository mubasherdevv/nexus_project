import { Router, Request, Response } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as profileController from '../controllers/authController.js';
import { User } from '../models/User.js';

const router = Router();

router.get('/entrepreneurs', async (req: Request, res: Response) => {
  try {
    const entrepreneurs = await User.find({ role: 'entrepreneur' });
    res.json({ success: true, users: entrepreneurs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching entrepreneurs', error });
  }
});

router.get('/investors', async (req: Request, res: Response) => {
  try {
    const investors = await User.find({ role: 'investor' });
    res.json({ success: true, users: investors });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching investors', error });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
});

router.put('/:id', protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    if (userId !== req.params.id) {
      res.status(403).json({ message: 'Not authorized to update this profile' });
      return;
    }

    const allowedFields = [
      'name', 'bio', 'avatarUrl',
      'startupName', 'pitchSummary', 'fundingNeeded', 'industry', 'location', 'foundedYear', 'teamSize',
      'investmentInterests', 'investmentStage', 'portfolioCompanies', 'totalInvestments', 'minimumInvestment', 'maximumInvestment'
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
});

export default router;
