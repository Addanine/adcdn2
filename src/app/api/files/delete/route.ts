import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '~/lib/auth';
import { deleteFile } from '~/lib/db';

export async function DELETE(request: NextRequest) {
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
    
    // Delete the file
    const deleted = await deleteFile(fileId, user.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'File not found or you do not have permission to delete this file' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}