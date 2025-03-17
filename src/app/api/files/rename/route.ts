import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '~/lib/auth';
import { renameFile } from '~/lib/db';

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
    // Parse request body
    const body = await request.json();
    const { fileId, newFilename } = body;
    
    if (!fileId || !newFilename) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Rename the file
    const result = await renameFile(fileId, user.id, newFilename);
    
    if (!result) {
      return NextResponse.json({ error: 'File not found or you do not have permission to rename it' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      fileId: result.id,
      fileName: result.original_filename
    });
  } catch (error) {
    console.error('File rename error:', error);
    return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 });
  }
}