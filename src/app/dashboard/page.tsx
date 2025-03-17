'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { formatFileSize } from '~/lib/utils';

interface File {
  id: string;
  fileName: string;
  mimeType?: string;
  sizeBytes: number;
  uploadTimestamp?: string;
  shareCode: string | null;
  shareLink: string | null;
}

export default function DashboardPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [storageLimit, setStorageLimit] = useState<number | null>(null);
  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);
  const router = useRouter();

  // Fetch user's files
  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files/list');
      
      if (response.status === 401) {
        // Redirect to login if unauthorized
        router.replace('/login');
        return;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files');
      }
      
      setFiles(data.files || []);
      if (data.user) {
        setUserEmail(data.user.email);
        setUserRole(data.user.role);
        setStorageLimit(data.user.storageLimit);
        setStorageUsed(data.user.storageUsed);
        setIsUnlimited(data.user.isUnlimited);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete a file
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete file');
      }
      
      // Remove the deleted file from the list
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle successful file upload
  const handleFileUploaded = (newFile: File) => {
    setFiles((prevFiles) => [newFile, ...prevFiles]);
  };

  // Create a new shareable link for a file
  const handleCreateShareLink = async (fileId: string) => {
    try {
      const response = await fetch('/api/files/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create shareable link');
      }
      
      // Update the file in the list with the new share link
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                shareCode: data.shareCode,
                shareLink: data.shareLink,
              }
            : file
        )
      );
      
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Fetch files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Log out handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Format storage metrics
  const formatStorageUsed = () => {
    if (storageUsed === null) return '0 B';
    return formatFileSize(storageUsed);
  };
  
  const formatStorageLimit = () => {
    if (isUnlimited) return 'Unlimited';
    if (storageLimit === null) return '100 MB'; // Default
    return formatFileSize(storageLimit);
  };
  
  // Calculate storage percentage for progress bar
  const storagePercentage = () => {
    if (isUnlimited || !storageLimit || storageLimit <= 0 || !storageUsed) return 0;
    const percentage = (storageUsed / storageLimit) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  return (
    <div className="min-h-screen bg-catppuccin-base">
      <header className="bg-catppuccin-mantle border-b-2 border-catppuccin-surface0">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-black text-catppuccin-mauve tracking-tight">adcdn</h1>
            {userEmail && (
              <p className="text-sm text-catppuccin-subtext1">{userEmail}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="border-2 border-catppuccin-red bg-catppuccin-surface0 px-4 py-2 text-sm text-catppuccin-text hover:bg-catppuccin-surface1"
          >
            Log Out
          </button>
        </div>
      </header>
      
      <main className="mx-auto max-w-6xl p-4">
        {error && (
          <div className="mb-4 border-2 border-catppuccin-red bg-catppuccin-surface0 p-4 text-catppuccin-red">
            {error}
            <button 
              className="ml-2 text-catppuccin-peach"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}
        
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border-2 border-catppuccin-blue bg-catppuccin-mantle p-4 shadow-lg">
            <h3 className="text-lg font-medium text-catppuccin-subtext0">Files</h3>
            <p className="text-2xl font-bold text-catppuccin-blue">{files.length}</p>
          </div>
          
          <div className="border-2 border-catppuccin-green bg-catppuccin-mantle p-4 shadow-lg">
            <h3 className="text-lg font-medium text-catppuccin-subtext0">Storage Used</h3>
            <p className="text-2xl font-bold text-catppuccin-green">
              {formatStorageUsed()} / {formatStorageLimit()}
            </p>
            {!isUnlimited && storageLimit && storageLimit > 0 && storageUsed !== null && (
              <div className="mt-2 h-2 w-full bg-catppuccin-surface0">
                <div 
                  className="h-full bg-catppuccin-green" 
                  style={{ width: `${storagePercentage()}%` }}
                ></div>
              </div>
            )}
            {userRole && (
              <p className="mt-2 text-xs text-catppuccin-subtext1">
                Account type: {userRole === 'unlimited' ? 'Unlimited' : userRole === 'admin' ? 'Admin' : 'Standard'}
              </p>
            )}
          </div>
          
          <div className="border-2 border-catppuccin-lavender bg-catppuccin-mantle p-4 shadow-lg">
            <h3 className="text-lg font-medium text-catppuccin-subtext0">Shared Links</h3>
            <p className="text-2xl font-bold text-catppuccin-lavender">
              {files.filter(file => file.shareCode).length}
            </p>
          </div>
        </div>
        
        <section className="mb-8 border-2 border-catppuccin-mauve bg-catppuccin-mantle p-6 shadow-lg">
          <h2 className="mb-4 flex items-center text-lg font-semibold text-catppuccin-text">
            <svg 
              className="mr-2 h-5 w-5 text-catppuccin-mauve" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            Upload New File
          </h2>
          <FileUpload onFileUploaded={handleFileUploaded} />
        </section>
        
        <section className="border-2 border-catppuccin-sapphire bg-catppuccin-mantle p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-catppuccin-text">My Files</h2>
            {files.length > 0 && (
              <div className="text-sm text-catppuccin-subtext1">
                {files.length} file{files.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin border-4 border-catppuccin-blue border-t-transparent"></div>
            </div>
          ) : (
            <FileList 
              files={files} 
              onDeleteFile={handleDeleteFile}
              onRenameFile={async (fileId, newFilename) => {
                try {
                  const response = await fetch('/api/files/rename', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fileId, newFilename }),
                  });
                  
                  const data = await response.json();
                  
                  if (!response.ok) {
                    throw new Error(data.error || 'Failed to rename file');
                  }
                  
                  // Update the file in the list with the new name
                  setFiles((prevFiles) =>
                    prevFiles.map((file) =>
                      file.id === fileId
                        ? {
                            ...file,
                            fileName: newFilename,
                          }
                        : file
                    )
                  );
                  
                  return true;
                } catch (err) {
                  console.error('Error renaming file:', err);
                  setError(err instanceof Error ? err.message : 'Failed to rename file');
                  return false;
                }
              }}
            />
          )}
        </section>
      </main>
    </div>
  );
}