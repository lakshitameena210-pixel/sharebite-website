import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET notifications for current user
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const notifs = db.getNotifications(user.id);
    return res.json({
      notifications: notifs,
      unreadCount: notifs.filter(n => !n.read).length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// PATCH mark single notification as read
router.patch('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const success = db.markNotificationAsRead(req.params.id, user.id);
    return res.json({ success });
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST mark all notifications as read
router.post('/mark-all-read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    db.markAllNotificationsAsRead(user.id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

export default router;
