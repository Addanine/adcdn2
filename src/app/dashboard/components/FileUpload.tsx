'use client';

import { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
  onFileUploaded: (file: any) => void;
}

export function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file: File | null) => {
    if (!file) return;
    
    // No max file size limit - just set the file
    setSelectedFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle storage limit errors specifically
        if (response.status === 400 && data.limit && data.available !== undefined) {
          const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
          const availableMB = (data.available / (1024 * 1024)).toFixed(2);
          
          throw new Error(
            `Storage limit exceeded: This file is ${fileSizeMB}MB but you only have ${availableMB}MB available.`
          );
        }
        
        throw new Error(data.error || 'Failed to upload file');
      }
      
      // Clear selected file
      setSelectedFile(null);
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }
      
      // Notify parent component
      onFileUploaded({
        id: data.fileId,
        fileName: data.fileName,
        mimeType: selectedFile.type,
        sizeBytes: selectedFile.size,
        uploadTimestamp: new Date().toISOString(),
        shareCode: data.shareCode,
        shareLink: data.shareLink
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle click on the upload area
  const handleUploadAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 border-2 border-catppuccin-red bg-catppuccin-surface0 p-3 text-catppuccin-red">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div 
          className={`mb-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors
            ${dragActive ? 'border-catppuccin-mauve bg-catppuccin-surface0/50' : 'border-catppuccin-surface1 bg-catppuccin-base'}
            ${!uploading ? 'cursor-pointer hover:border-catppuccin-mauve hover:bg-catppuccin-surface0/30' : ''}
          `}
          onClick={!uploading ? handleUploadAreaClick : undefined}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            required
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            <svg 
              className={`mb-3 h-10 w-10 ${dragActive ? 'text-catppuccin-mauve' : 'text-catppuccin-subtext0'}`} 
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
            <p className="mb-2 text-sm text-catppuccin-text">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-catppuccin-subtext1">
              Upload any size file (must fit in available storage)
            </p>
          </div>
          
          {selectedFile && (
            <div className="mt-4 flex w-full max-w-md items-center justify-between rounded border border-catppuccin-surface1 bg-catppuccin-surface0 p-2">
              <div className="flex items-center overflow-hidden">
                <svg 
                  className="mr-2 h-5 w-5 flex-shrink-0 text-catppuccin-blue" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
                <span className="truncate text-sm font-medium text-catppuccin-text">
                  {selectedFile.name}
                </span>
              </div>
              <span className="ml-2 text-xs text-catppuccin-subtext1">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={uploading || !selectedFile}
          className={`flex w-full items-center justify-center rounded border-2 px-5 py-2.5 text-sm font-medium transition-all
            ${uploading 
              ? 'border-catppuccin-yellow bg-catppuccin-surface0 text-catppuccin-text'
              : selectedFile 
                ? 'border-catppuccin-mauve bg-catppuccin-mauve text-catppuccin-base hover:bg-catppuccin-surface0 hover:text-catppuccin-mauve'
                : 'border-catppuccin-surface1 bg-catppuccin-surface0 text-catppuccin-subtext0 opacity-50'
            }
          `}
        >
          {uploading ? (
            <>
              <svg 
                className="mr-2 h-4 w-4 animate-spin text-catppuccin-yellow" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg 
                className="mr-2 h-4 w-4" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
              Upload File
            </>
          )}
        </button>
      </form>
    </div>
  );
}