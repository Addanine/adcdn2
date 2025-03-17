import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear auth cookie
  response.cookies.set({
    name: 'auth',
    value: '',
    expires: new Date(0),
    path: '/',
  });
  
  return response;
}