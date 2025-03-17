import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '~/lib/auth';
import { saveFile, createShareableLink, getUserStorageUsed } from '~/lib/db';

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
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Get file metadata
    const originalFilename = file.name;
    const mimeType = file.type;
    const sizeBytes = file.size;
    
    // Get current storage used by the user
    const currentUsedBytes = await getUserStorageUsed(user.id);
    
    // Check storage limit for all users except unlimited/admin
    if (user.role !== 'unlimited' && user.role !== 'admin') {
      const userLimit = user.storageLimit || 104857600; // Default to 100MB if not specified
      
      if (currentUsedBytes + sizeBytes > userLimit) {
        // Calculate available space
        const availableBytes = Math.max(0, userLimit - currentUsedBytes);
        const availableMB = (availableBytes / 1048576).toFixed(2);
        
        return NextResponse.json({ 
          error: `Not enough storage space. This file is ${(sizeBytes/1048576).toFixed(2)}MB but you only have ${availableMB}MB available.`,
          currentUsed: currentUsedBytes,
          limit: userLimit,
          available: availableBytes,
          fileSize: sizeBytes
        }, { status: 400 });
      }
    }
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Save file to database
    const fileId = await saveFile(user.id, originalFilename, mimeType, fileBuffer, sizeBytes);
    
    // Create shareable link
    const link = await createShareableLink(fileId);
    
    return NextResponse.json({ 
      success: true,
      fileId,
      fileName: originalFilename,
      shareCode: link.share_code,
      shareLink: `/share/${link.share_code}`
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// Set large request body size limit - practically limited by server resources and browser limits
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4gb', // Up to 4GB per file (theoretical maximum)
    },
    responseLimit: '4gb',
  },
};