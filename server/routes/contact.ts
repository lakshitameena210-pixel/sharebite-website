import { Router, Response, Request } from 'express';
import { db } from '../db';

const router = Router();

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
  createdAt: string;
}

// In-memory contact messages storage
const contactMessages: ContactMessage[] = [];

// POST submit contact message
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, email, phone, category = 'General Inquiry', subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const newMessage: ContactMessage = {
      id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      category: category.trim(),
      subject: subject?.trim() || 'General Inquiry',
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    contactMessages.unshift(newMessage);

    // Notify administrators
    const admins = db.getUsers().filter(u => u.role === 'admin');
    admins.forEach(admin => {
      db.createNotification({
        userId: admin.id,
        title: `New Contact Inquiry: ${newMessage.subject}`,
        message: `From ${newMessage.name} (${newMessage.email}) regarding ${newMessage.category}.`,
        type: 'system',
        link: '/admin',
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! A ShareBite community coordinator will respond within 24 hours.',
      id: newMessage.id,
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return res.status(500).json({ error: 'Failed to submit contact message' });
  }
});

// GET contact messages (admin view)
router.get('/', (_req: Request, res: Response) => {
  return res.json({ messages: contactMessages });
});

export default router;
