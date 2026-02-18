import express from 'express';
import { User } from '../models/User';
import { auth } from '../middleware/auth.middleware';

const router = express.Router();

// Update FCM token
router.post('/fcm-token', auth, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ message: 'FCM token updated successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error updating FCM token' });
  }
});

// Update notification settings
router.patch('/notification-settings', auth, async (req, res) => {
  try {
    const { measurements, photos, reminders } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      notificationSettings: {
        measurements,
        photos,
        reminders
      }
    });
    res.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error updating notification settings' });
  }
});

// Get notification settings
router.get('/notification-settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationSettings');
    res.json(user?.notificationSettings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification settings' });
  }
});

export const userRoutes = router; 