import { NextRequest, NextResponse } from 'next/server';
import { getFileById } from '~/lib/db';
import { verifyToken } from '~/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('auth')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get file ID from request
    const { fileId } = await request.json();
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }
    
    // Get file
    const file = await getFileById(fileId);
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Create response with file data
    const response = new NextResponse(file.file_data);
    
    // Set appropriate headers
    response.headers.set('Content-Type', file.mime_type);
    response.headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_filename)}"`);
    response.headers.set('Content-Length', file.size_bytes.toString());
    
    return response;
  } catch (error) {
    console.error('Error retrieving file:', error);
    return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 });
  }
}