import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { env } from '~/env';

// JWT token configuration
const JWT_SECRET = env.JWT_SECRET;
const TOKEN_EXPIRY = '24h';

// User type definition
export type User = {
  id: string;
  email: string;
  role?: string;
  storageLimit?: number;
};

// Generate JWT token
export function generateToken(user: User) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role || 'user',
      storageLimit: user.storageLimit
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// Verify JWT token
export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return { 
      id: decoded.id, 
      email: decoded.email,
      role: decoded.role,
      storageLimit: decoded.storageLimit
    };
  } catch (error) {
    return null;
  }
}

// Set auth cookie in response
export function setAuthCookie(res: NextApiResponse, token: string) {
  res.setHeader('Set-Cookie', `auth=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24};`);
}

// Get user from request (API Routes)
export function getUserFromRequest(req: NextApiRequest): User | null {
  const token = req.cookies.auth;
  if (!token) return null;
  return verifyToken(token);
}

// Auth middleware for API routes
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: User) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handler(req, res, user);
  };
}

// Auth middleware for App Router
export async function getServerUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Middleware for App Router protected routes
export async function protectedRoute(request: NextRequest) {
  const token = request.cookies.get('auth')?.value;
  
  if (!token || !verifyToken(token)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}