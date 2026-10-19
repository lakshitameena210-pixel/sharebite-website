import { Router, Response, Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { aiService } from '../services/aiService';
import { db } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sharebite_super_secret_jwt_key_2026';

// Registered standalone AI tokens
const activeAiTokens = new Map<string, { donorName: string; createdAt: string; expiresAt: string }>();

// Seed default master AI token for easy API / automation testing
const DEFAULT_AI_TOKEN = 'sb_ai_donor_master_token_2026';
activeAiTokens.set(DEFAULT_AI_TOKEN, {
  donorName: 'Master Donor Service',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
});

interface AiAuthRequest extends Request {
  aiUser?: {
    id?: string;
    email?: string;
    name?: string;
    tokenType: 'user_jwt' | 'ai_donor_token';
  };
}

// Middleware: Authenticate AI Donor Assistant Token
function requireAiAssistantAuth(req: AiAuthRequest, res: Response, next: NextFunction) {
  // Check authorization header or dedicated x-ai-auth-token header
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-ai-auth-token'] as string | undefined;

  let token = customHeader;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication token required for AI Donor Assistant. Please include "Authorization: Bearer <token>" or an "x-ai-auth-token" header.',
      hint: 'You can generate an instant AI Donor Token via POST /api/ai/token or sign in to ShareBite.',
    });
  }

  // Case 1: Standalone AI Donor Token (e.g. sb_ai_donor_...)
  if (token.startsWith('sb_ai_donor_') || activeAiTokens.has(token)) {
    const tokenData = activeAiTokens.get(token);
    if (!tokenData || new Date(tokenData.expiresAt) < new Date()) {
      return res.status(401).json({ error: 'AI Donor Assistant token has expired or is invalid.' });
    }

    req.aiUser = {
      name: tokenData.donorName,
      tokenType: 'ai_donor_token',
    };
    return next();
  }

  // Case 2: Standard JWT User Token
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email?: string; name?: string };
    const user = db.getUserById(decoded.id);

    req.aiUser = {
      id: decoded.id,
      email: user?.email || decoded.email,
      name: user?.name || decoded.name,
      tokenType: 'user_jwt',
    };
    return next();
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired AI Donor Assistant authentication token.',
      hint: 'Please refresh your session or generate a new AI Assistant Token.',
    });
  }
}

// POST /api/ai/token - Issue a dedicated AI Donor Assistant authentication token
router.post('/token', (req: Request, res: Response) => {
  try {
    const { donorName = 'Kitchen Donor Staff', expiresInDays = 30 } = req.body;

    const token = 'sb_ai_donor_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    const expiresAt = new Date(Date.now() + Number(expiresInDays) * 24 * 3600 * 1000).toISOString();

    activeAiTokens.set(token, {
      donorName,
      createdAt: new Date().toISOString(),
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      token,
      type: 'Bearer',
      scope: 'ai:donor_assistant',
      donorName,
      expiresAt,
      usage: 'Include as "Authorization: Bearer ' + token + '" or "x-ai-auth-token: ' + token + '"',
    });
  } catch (error) {
    console.error('Error generating AI token:', error);
    return res.status(500).json({ error: 'Failed to issue AI donor assistant token' });
  }
});

// GET /api/ai/token/verify - Check current token validity
router.get('/token/verify', requireAiAssistantAuth, (req: AiAuthRequest, res: Response) => {
  return res.json({
    valid: true,
    user: req.aiUser,
    message: 'AI Donor Assistant authentication token is active and authorized.',
  });
});

// POST /api/ai/suggest-listing - AI food listing generation protected by AI token
router.post('/suggest-listing', requireAiAssistantAuth, async (req: AiAuthRequest, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt text is required for AI suggestions' });
    }

    const suggestion = await aiService.suggestListing(prompt);

    return res.json({
      suggestion,
      auth: {
        authenticated: true,
        authenticatedAs: req.aiUser?.name || 'Authorized Donor',
        tokenType: req.aiUser?.tokenType,
      },
    });
  } catch (error) {
    console.error('Error in AI suggestion endpoint:', error);
    return res.status(500).json({ error: 'Failed to process AI food suggestion' });
  }
});

export default router;
