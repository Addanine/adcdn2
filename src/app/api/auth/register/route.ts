import { NextResponse } from 'next/server';
import { createUser } from '~/lib/db';
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
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Create user in database - with timeout for better error handling
    let user;
    try {
      user = await createUser(email, password);
      
      // Verify returned user has required properties
      if (!user || !user.id || !user.email) {
        throw new Error('Invalid user data returned from database');
      }
    } catch (dbError: any) {
      console.error('Database error during user creation:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message || 'Unknown database error'}` },
        { status: 500 }
      );
    }
    
    // Generate JWT token with role and storage limit
    // Handle missing properties gracefully (in case DB schema is missing columns)
    const role = user.role || 'user';
    const storageLimit = user.storage_limit_bytes || 104857600;
    
    let token;
    try {
      token = generateToken({ 
        id: user.id, 
        email: user.email,
        role: role,
        storageLimit: storageLimit
      });
    } catch (tokenError: any) {
      console.error('Token generation error:', tokenError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
    
    // Set the cookie
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
  } catch (error: any) {
    // Detailed error logging
    console.error('Registration error:', error);
    console.error('Stack trace:', error.stack || 'No stack trace available');
    
    // Check for duplicate email
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    
    // Database column issues
    if (error.code === '42703') { // Column does not exist
      console.error('Database schema error:', error);
      return NextResponse.json(
        { error: 'Database configuration issue. Please try again later or contact support.' },
        { status: 500 }
      );
    }
    
    // Database connection issues
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '08006') {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 503 } // Service Unavailable
      );
    }
    
    // Fallback for other errors
    return NextResponse.json(
      { error: 'Failed to register user. Please try again later.' },
      { status: 500 }
    );
  }
}