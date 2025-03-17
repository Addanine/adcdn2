import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '~/lib/auth';
import { setUserAdmin } from '~/lib/db';

export async function POST(request: NextRequest) {
  // Check if the requester is an admin
  const token = request.cookies.get('auth')?.value;
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Only admins can create other admins
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Access denied. Only admins can create other admins.' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    const updatedUser = await setUserAdmin(email);
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: `User ${email} has been set as admin with unlimited storage`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Set admin error:', error);
    return NextResponse.json({ error: 'Failed to set user as admin' }, { status: 500 });
  }
}