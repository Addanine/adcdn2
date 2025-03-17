import { NextRequest, NextResponse } from 'next/server';
import { getFileByShareCode } from '~/lib/db';

export async function POST(request: Request) {
  try {
    // Get share code from request
    const { shareCode } = await request.json();
    
    if (!shareCode) {
      return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
    }
    
    // Get file by share code
    const file = await getFileByShareCode(shareCode);
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Create response with file data
    const response = new NextResponse(file.file_data);
    
    // Set appropriate headers
    response.headers.set('Content-Type', file.mime_type);
    response.headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_filename)}"`);
    response.headers.set('Content-Length', file.size_bytes.toString());
    
    return response;
  } catch (error) {
    console.error('Error retrieving shared file:', error);
    return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 });
  }
}

// For file info without downloading
// GET request for when displaying image preview
export async function GET(request: NextRequest) {
  try {
    // Get share code from query params
    const shareCode = request.nextUrl.searchParams.get('shareCode');
    
    if (!shareCode) {
      return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
    }
    
    // Get file by share code
    const file = await getFileByShareCode(shareCode);
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    const fileData = file.file_data;
    const totalSize = file.size_bytes;
    
    // Handle Range requests for video/audio seeking
    const rangeHeader = request.headers.get('range');
    
    if (rangeHeader && (file.mime_type.startsWith('video/') || file.mime_type.startsWith('audio/'))) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0] || '0', 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      
      // Ensure valid ranges
      const chunkSize = Math.min(end - start + 1, totalSize);
      if (start >= 0 && end < totalSize) {
        // Extract the requested chunk from the buffer
        let chunk;
        if (Buffer.isBuffer(fileData)) {
          chunk = fileData.slice(start, end + 1);
        } else {
          chunk = Buffer.from(fileData).slice(start, end + 1);
        }
        
        // Create a partial response
        const response = new NextResponse(chunk);
        
        // Set range-specific headers
        response.headers.set('Content-Range', `bytes ${start}-${end}/${totalSize}`);
        response.headers.set('Accept-Ranges', 'bytes');
        response.headers.set('Content-Length', chunkSize.toString());
        response.headers.set('Content-Type', file.mime_type);
        response.headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_filename)}"`);
        
        // Create a 206 Partial Content response
        return new Response(chunk, {
          status: 206,
          headers: response.headers
        });
      }
    }
    
    // If no range requested or not a video/audio file, return the full file
    const response = new NextResponse(fileData);
    
    // Set appropriate headers
    response.headers.set('Accept-Ranges', 'bytes');
    response.headers.set('Content-Type', file.mime_type);
    response.headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_filename)}"`);
    response.headers.set('Content-Length', totalSize.toString());
    
    return response;
  } catch (error) {
    console.error('Error retrieving shared file:', error);
    return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  try {
    // Get share code from request
    const body = await request.json();
    const { shareCode } = body;
    
    if (!shareCode) {
      return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
    }
    
    // Get file by share code (without returning the actual file data)
    const file = await getFileByShareCode(shareCode);
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Return file metadata
    return NextResponse.json({
      fileName: file.original_filename,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes
    });
  } catch (error) {
    console.error('Error retrieving file info:', error);
    return NextResponse.json({ error: 'Failed to retrieve file info' }, { status: 500 });
  }
}