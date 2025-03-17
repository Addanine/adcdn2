'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { formatFileSize, getFileIcon } from '~/lib/utils';

interface File {
  id: string;
  fileName: string;
  mimeType?: string;
  sizeBytes: number;
  uploadTimestamp?: string;
  shareCode: string | null;
  shareLink: string | null;
}

interface FileListProps {
  files: File[];
  onDeleteFile: (fileId: string) => void;
  onRenameFile?: (fileId: string, newFilename: string) => Promise<boolean>;
}

export function FileList({ files, onDeleteFile, onRenameFile }: FileListProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedDirectLink, setCopiedDirectLink] = useState<string | null>(null);
  const [creatingShareLink, setCreatingShareLink] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>('');
  const [renameError, setRenameError] = useState<string>('');

  // Copy text to clipboard helper
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Check if the clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback method for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';  // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (!successful) throw new Error('Copy command was unsuccessful');
        } catch (err) {
          console.error('Fallback: Could not copy text: ', err);
          throw err;
        } finally {
          document.body.removeChild(textArea);
        }
      }
      return true;
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy text. Please copy it manually.');
      return false;
    }
  };

  // Copy share link to clipboard
  const copyToClipboard = async (link: string, fileId: string) => {
    try {
      // Ensure full URL with origin
      const fullUrl = `${window.location.origin}${link}`;
      
      const success = await copyTextToClipboard(fullUrl);
      if (success) {
        setCopiedLink(fileId);
        
        // Reset the "Copied" text after 3 seconds
        setTimeout(() => {
          setCopiedLink(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };
  
  

  // Create shareable link
  const createShareableLink = async (fileId: string) => {
    setCreatingShareLink(fileId);
    try {
      const response = await fetch('/api/files/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create shareable link');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating link:', error);
      return null;
    } finally {
      setCreatingShareLink(null);
    }
  };
  
  // Start editing a filename
  const startEditingFile = (fileId: string, currentName: string) => {
    setEditingFile(fileId);
    setNewFileName(currentName);
    setRenameError('');
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingFile(null);
    setNewFileName('');
    setRenameError('');
  };
  
  // Save the new filename
  const saveNewFilename = async (fileId: string) => {
    if (!newFileName.trim()) {
      setRenameError('Filename cannot be empty');
      return;
    }
    
    if (!onRenameFile) {
      setRenameError('Rename functionality not available');
      return;
    }
    
    try {
      const success = await onRenameFile(fileId, newFileName);
      if (success) {
        setEditingFile(null);
        setRenameError('');
      } else {
        setRenameError('Failed to rename file');
      }
    } catch (error) {
      console.error('Error renaming file:', error);
      setRenameError('Failed to rename file');
    }
  };

  // Get icon based on file type
  const getFileTypeIcon = (mimeType?: string) => {
    const iconType = getFileIcon(mimeType);
    
    let iconPath = '';
    switch(iconType) {
      case 'image':
        iconPath = 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z';
        break;
      case 'pdf':
        iconPath = 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z';
        break;
      case 'video':
        iconPath = 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z';
        break;
      case 'audio':
        iconPath = 'M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z';
        break;
      case 'text':
        iconPath = 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z';
        break;
      default:
        iconPath = 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z';
    }
    
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className="h-5 w-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-catppuccin-surface0">
        <thead className="bg-catppuccin-surface0">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-catppuccin-subtext0">
              File Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-catppuccin-subtext0">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-catppuccin-subtext0">
              Size
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-catppuccin-subtext0">
              Uploaded
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-catppuccin-subtext0">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-catppuccin-surface0 bg-catppuccin-base">
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-catppuccin-surface0">
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <div className="flex items-center">
                  <span className="mr-2 text-catppuccin-blue">
                    {getFileTypeIcon(file.mimeType)}
                  </span>
                  {editingFile === file.id ? (
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveNewFilename(file.id)}
                          className="mr-2 border border-catppuccin-surface2 bg-catppuccin-mantle px-2 py-1 text-sm text-catppuccin-text"
                          autoFocus
                        />
                        <button
                          onClick={() => saveNewFilename(file.id)}
                          className="mr-1 text-catppuccin-green hover:text-catppuccin-teal"
                          title="Save new filename"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-catppuccin-red hover:text-catppuccin-maroon"
                          title="Cancel"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {renameError && (
                        <span className="text-xs text-catppuccin-red">{renameError}</span>
                      )}
                    </div>
                  ) : (
                    <span className="font-medium text-catppuccin-text">{file.fileName}</span>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-catppuccin-subtext1">
                {file.mimeType ? (file.mimeType.split('/')[1]?.toUpperCase() || file.mimeType) : 'Unknown'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-catppuccin-subtext1">
                {formatFileSize(file.sizeBytes)}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-catppuccin-subtext1">
                {file.uploadTimestamp ? formatDistanceToNow(new Date(file.uploadTimestamp), { addSuffix: true }) : 'Just now'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <div className="flex flex-col space-y-3">
                  {/* Main Action Row */}
                  <div className="flex items-center flex-wrap gap-2">
                    {editingFile !== file.id && (
                      <button
                        onClick={() => startEditingFile(file.id, file.fileName)}
                        className="flex items-center text-catppuccin-lavender hover:text-catppuccin-mauve"
                        title="Rename file"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          strokeWidth={1.5} 
                          stroke="currentColor" 
                          className="mr-1 h-4 w-4"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" 
                          />
                        </svg>
                        Rename
                      </button>
                    )}
                    
                    {file.shareLink ? (
                      <>
                        <a
                          href={file.shareLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-catppuccin-blue hover:text-catppuccin-sapphire"
                          title="Open share page in new tab"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={1.5} 
                            stroke="currentColor" 
                            className="mr-1 h-4 w-4"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" 
                            />
                          </svg>
                          Share File
                        </a>
                        
                        <button
                          onClick={() => {
                            const directLink = `${window.location.origin}/api/file-share?shareCode=${file.shareCode}`;
                            copyTextToClipboard(directLink);
                            setCopiedDirectLink(file.id);
                            setTimeout(() => setCopiedDirectLink(null), 3000);
                          }}
                          className="flex items-center text-catppuccin-peach hover:text-catppuccin-yellow"
                          title="Copy direct link for Discord, Slack, etc."
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={1.5} 
                            stroke="currentColor" 
                            className="mr-1 h-4 w-4"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" 
                            />
                          </svg>
                          {copiedDirectLink === file.id ? 'Copied!' : 'Copy Link'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => createShareableLink(file.id)}
                        disabled={creatingShareLink === file.id || editingFile === file.id}
                        className="flex items-center text-catppuccin-green hover:text-catppuccin-teal disabled:opacity-50"
                        title="Generate shareable link"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          strokeWidth={1.5} 
                          stroke="currentColor" 
                          className="mr-1 h-4 w-4"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" 
                          />
                        </svg>
                        {creatingShareLink === file.id ? 'Creating...' : 'Create Link'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => onDeleteFile(file.id)}
                      disabled={editingFile === file.id}
                      className="flex items-center text-catppuccin-red hover:text-catppuccin-maroon disabled:opacity-50"
                      title="Delete file"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="currentColor" 
                        className="mr-1 h-4 w-4"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" 
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                  
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {files.length === 0 && (
        <div className="py-8 text-center text-catppuccin-subtext1">
          <p>No files uploaded yet.</p>
        </div>
      )}
    </div>
  );
}