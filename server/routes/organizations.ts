import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all verified organizations
router.get('/', (_req, res: Response) => {
  try {
    const orgs = db.getUsers()
      .filter(u => u.organizationDetails && u.organizationDetails.isVerified)
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        city: u.city,
        avatarUrl: u.avatarUrl,
        mealsRescued: u.mealsRescued,
        kgCO2Saved: u.kgCO2Saved,
        orgDetails: u.organizationDetails,
      }));

    return res.json({ organizations: orgs });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return res.status(500).json({ error: 'Failed to retrieve organizations' });
  }
});

// POST submit organization verification application
router.post('/apply-verification', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { orgName, registrationNumber, mission, website } = req.body;

    if (!orgName || !registrationNumber || !mission) {
      return res.status(400).json({
        error: 'Please provide organization name, registration/tax number, and mission statement',
      });
    }

    const updated = db.updateUser(user.id, {
      role: 'organization',
      organizationDetails: {
        orgName,
        registrationNumber,
        mission,
        website: website || '',
        isVerified: false,
        verificationRequestedAt: new Date().toISOString(),
      },
    });

    // Notify admins
    const admins = db.getUsers().filter(u => u.role === 'admin');
    admins.forEach(admin => {
      db.createNotification({
        userId: admin.id,
        title: 'New Org Verification Request',
        message: `${orgName} (${user.name}) requested organization verification.`,
        type: 'system',
        link: '/admin',
      });
    });

    return res.json({
      success: true,
      message: 'Verification request submitted successfully. Our team will review within 24 hours.',
      user: updated,
    });
  } catch (error) {
    console.error('Error applying for verification:', error);
    return res.status(500).json({ error: 'Failed to submit verification request' });
  }
});

export default router;
