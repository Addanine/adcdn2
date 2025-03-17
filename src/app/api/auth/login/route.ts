import { NextResponse } from 'next/server';
import { verifyUser } from '~/lib/db';
import { generateToken } from '~/lib/auth';

export async function POST(request: Request) {
  try {
    // First try to parse the JSON body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Attempt user verification with better error handling
    let user;
    try {
      user = await verifyUser(email, password);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    } catch (dbError: any) {
      console.error('Database error during login:', dbError);
      
      // Handle database connection issues
      if (dbError.code === 'ECONNREFUSED' || dbError.code === 'ETIMEDOUT' || dbError.code === '08006') {
        return NextResponse.json(
          { error: 'Database connection error. Please try again later.' },
          { status: 503 } // Service Unavailable
        );
      }
      
      return NextResponse.json(
        { error: 'Authentication error. Please try again later.' },
        { status: 500 }
      );
    }
    
    // Generate token with error handling
    let token;
    try {
      token = generateToken(user);
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
    
    // Ensure we have defaults for missing properties
    const role = user.role || 'user';
    const storageLimit = user.storageLimit || 104857600;
    
    // Create response with cookie
    try {
      const response = NextResponse.json({ 
        success: true,
        role: role,
        storageLimit: storageLimit,
        isUnlimited: role === 'unlimited' || role === 'admin'
      });
      
      response.cookies.set({
        name: 'auth',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
        sameSite: 'strict',
      });
      
      return response;
    } catch (responseError) {
      console.error('Response creation error:', responseError);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    // Detailed error logging
    console.error('Login error:', error);
    console.error('Stack trace:', error.stack || 'No stack trace available');
    
    return NextResponse.json(
      { error: 'Failed to log in. Please try again later.' },
      { status: 500 }
    );
  }
}
