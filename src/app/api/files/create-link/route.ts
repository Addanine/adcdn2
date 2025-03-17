import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '~/lib/auth';
import { createShareableLink } from '~/lib/db';

export async function POST(request: NextRequest) {
  // Check authentication
  const token = request.cookies.get('auth')?.value;
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get file ID from request
    const { fileId } = await request.json();
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }
    
    // Create shareable link
    const link = await createShareableLink(fileId);
    
    if (!link) {
      return NextResponse.json({ error: 'Failed to create shareable link' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      linkId: link.id,
      shareCode: link.share_code,
      shareLink: `/share/${link.share_code}`
    });
  } catch (error) {
    console.error('Error creating shareable link:', error);
    return NextResponse.json({ error: 'Failed to create shareable link' }, { status: 500 });
  }
}