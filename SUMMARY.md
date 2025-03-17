# adcdn Project Summary

## Project Overview

**adcdn** is a minimalist file hosting/CDN service with the following key features:
- User authentication (register/login)
- File upload, storage, and management
- Shareable file links with direct embedding capabilities
- Media file preview (images, video, audio)
- Interactive dashboard for file management

## Technical Architecture

### Stack
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes (serverless functions)
- **Database**: PostgreSQL for storing user data, file content, and share links
- **Authentication**: Custom JWT-based auth with HttpOnly cookies
- **Styling**: Catppuccin color scheme for a modern, aesthetic UI

### Database Schema
The PostgreSQL database contains three main tables:
1. **users** - User account information
   - UUID primary key
   - Email (unique)
   - Password hash (bcrypt)
   - Creation timestamp
   - Role (user, admin, unlimited)
   - Storage limit (100MB default, -1 for unlimited)

2. **files** - File storage
   - UUID primary key
   - Foreign key to user
   - Original filename
   - MIME type
   - File data (stored as binary in the database)
   - File size
   - Upload timestamp

3. **links** - Shareable links
   - UUID primary key
   - Foreign key to file
   - Unique share code
   - Creation timestamp

### API Endpoints

#### Authentication
- `/api/auth/register` - User registration
- `/api/auth/login` - User login with JWT creation
- `/api/auth/logout` - User logout (clears cookie)
- `/api/auth/set-admin` - Set a user as admin (admin only)

#### File Management
- `/api/files/upload` - File upload endpoint
- `/api/files/list` - Get user's files
- `/api/files/delete` - Delete file
- `/api/files/download` - Download file
- `/api/files/create-link` - Create shareable link
- `/api/files/rename` - Rename file

#### Sharing
- `/api/file-share` - Access shared file (with proper HTTP Range support for media streaming)

### Pages and Routes
- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard for file management
- `/share/[shareCode]` - Public share page for accessing shared files

## Key Features and Implementations

### User Authentication
- Secure registration and login system
- Password hashing using bcrypt
- JWT tokens stored in HttpOnly cookies
- Protected routes with middleware
- Session management

### File Storage and Retrieval
- Files stored directly in the PostgreSQL database as binary data
- File metadata includes original name, size, MIME type
- Support for various file types (up to 500MB per file)
- Storage limits: 100MB per regular user, unlimited for special accounts
- File deletion with proper permission checks

### File Sharing
- Generation of unique share codes
- Public share pages with appropriate content-type headers
- Direct linking capabilities for embedding in other platforms
- Support for multiple share links per file

### Media Preview and Playback
- In-browser preview for images, videos, and audio files
- Video seeking implemented with HTTP Range request support
- Fallback to generic file icon for non-previewable file types
- Responsive design for different screen sizes

### Dashboard
- Interactive file management interface
- File upload with drag-and-drop support
- File rename functionality
- File sharing and deletion
- Copy direct links for embedding

## Implementation Details and Challenges

### Database Connection
Connection to PostgreSQL using the `pg` library with a connection pool for efficient query management.

### HTTP Range Support
Custom implementation of HTTP Range requests (RFC 7233) to support proper video and audio seeking. This required:
- Parsing the `Range` header
- Extracting specific byte ranges from binary data
- Returning partial content with appropriate status codes (206)
- Setting correct headers (Content-Range, Accept-Ranges, etc.)

### Permission Management
- Database-level permissions were set to allow the application user to access all required tables
- Application-level checks ensure users can only access their own files
- Share links provide controlled access to specific files

### Error Handling
- Proper error handling for database operations
- User-friendly error messages for authentication issues
- Fallbacks for missing or invalid content
- Form validation for user input

### UI/UX Improvements
- Interactive buttons with visual feedback
- Clean, responsive design using Tailwind CSS
- Fallback mechanisms for browsers with different levels of feature support
- Clipboard operations with multiple fallback methods

## Notable Issues and Solutions

### Database Permission Issue
- Initial problem: "permission denied for table users" during registration
- Solution: Granted proper PostgreSQL permissions to the database user for all tables and sequences

### Missing Database Columns Issue
- Problem: "column 'role' of relation 'users' does not exist" during registration
- Root cause: Database schema was missing required columns on some installations
- Solution: 
  - Created schema update script that safely adds missing columns
  - Modified code to detect missing columns and use fallback logic
  - Added graceful handling in API routes with meaningful error messages
  - Updated documentation with instructions for running schema updates
  - Added automatic schema validation on application startup

### Video Seeking Issue
- Problem: Unable to seek in videos when streaming
- Solution: Implemented proper HTTP Range request handling to serve partial content

### Clipboard API Compatibility
- Problem: Clipboard operations failing on some browsers that don't support navigator.clipboard
- Solution: Created fallback mechanisms using document.execCommand for broader browser support

### Type Safety Issues
- Problem: TypeScript errors with nullable/undefined values
- Solution: Added proper type checking and null guards throughout the codebase

### File Type Handling
- Problem: Error when handling undefined MIME types
- Solution: Made MIME type parameters optional and added fallback logic

## Additional Features

### File Embedding
- Ability to generate direct links for embedding in platforms like Discord
- Automatic in-line preview of media files when shared in supporting platforms

### File Renaming
- Interactive UI for renaming files
- Real-time updates in the file list

### Storage Usage Display
- Storage metrics for user awareness
- Storage limits visualization with progress bar
- Account type indication (Standard, Admin, Unlimited)
- Proper formatting of file sizes (B, KB, MB, GB, TB)

## Recent Improvements

### 1. Enhanced File Upload Experience

The file upload interface has been completely redesigned with the following improvements:

- **Modern Drag-and-Drop Interface**:
  - Implemented a stylish drop zone with visual feedback
  - Added drag-and-drop functionality for easy file uploads
  - Made the file input hidden and replaced with a custom designed UI
  - Added hover and active states for better user interaction

- **Improved File Selection Experience**:
  - Added click-to-select functionality on the entire drop zone
  - Enhanced file preview with better formatting and icons
  - Show file size in a more readable format

- **Enhanced Upload Button**:
  - Color-coded buttons matching Catppuccin theme
  - Added loading animation during upload
  - Improved disabled state styling for better UX
  - Added icons to buttons for better visual communication

- **Removed Arbitrary File Size Limits**:
  - Eliminated the 500MB per-file upload restriction
  - Now allows files of any size (up to 4GB theoretical maximum)
  - Files only limited by user's available storage space
  - Added clear messaging about storage limitations
  - Enhanced error handling for better user feedback

### 2. Database Schema Robustness

The application's database connectivity has been enhanced to better handle schema changes:

- **Schema Validation & Update**:
  - Added automatic schema validation on application startup
  - Created schema update script to safely add missing columns
  - Added detection for missing or outdated schema

- **Enhanced Error Handling**:
  - Implemented graceful handling of missing database columns
  - Added fallback logic for backward compatibility
  - Improved error messages with clear instructions
  - Better API error responses with meaningful details

- **Improved User Experience During Schema Issues**:
  - Dynamic SQL queries that adapt to available columns
  - Fallback values for missing database fields
  - Guided error recovery for administrators
  - Detailed documentation for database management

## Future Improvement Opportunities

1. **S3 Integration**: Store files in S3 or similar object storage rather than directly in the database for better scalability
2. **Expiring Links**: Add ability to create temporary links that expire after a certain time
3. **File Folders/Organization**: Implement folder structure for better file organization
4. **Password Protection**: Allow setting passwords on shared links
5. **Analytics**: Track link visits and download counts
6. **Preview Enhancements**: Add support for previewing more file types (PDFs, documents)
7. **Multi-file Upload**: Support uploading multiple files at once
8. **Access Control**: More granular permissions for shared files
9. **Mobile App**: Develop a dedicated mobile application

## Development Guidelines

1. Always validate user input
2. Check permissions before file operations
3. Use proper error handling
4. Follow TypeScript best practices
5. Maintain consistent API responses
6. Document new features thoroughly
7. Follow the existing naming conventions and code style
8. Use the Tailwind CSS classes consistently for UI elements
9. Handle edge cases for file operations
10. Test the application thoroughly before deployment

## Administrative Features

1. **Special User Types**
   - Regular users: 100MB storage limit
   - Admin users: Unlimited storage with admin privileges
   - Unlimited users: Unlimited storage (harry.oltmans@gmail.com, emily@adenine.xyz)

2. **Admin Script**
   - CLI utility to set a user as admin: `node scripts/set-admin.js user@example.com`
   - Updates user role and removes storage limitations

## Deployment Considerations

1. Set appropriate database connection pool size
2. Configure proper file size limits based on database capacity
3. Set up CORS properly for production
4. Use HTTPS for production deployment
5. Configure appropriate cache headers for static assets
6. Set up database backups for file data
7. Monitor disk usage and database size
8. Consider connection pooling optimizations
9. Set up proper logging for debugging issues
10. Implement rate limiting for API endpoints

This summary provides a comprehensive overview of the adcdn project, its architecture, features, and the improvements made. It should serve as a useful guide for any developer or AI system that needs to understand or work with this codebase in the future.