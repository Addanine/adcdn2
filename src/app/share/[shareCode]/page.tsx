'use client';
/* eslint-disable */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { isViewableInBrowser } from '~/lib/utils';

export default function SharePage() {
  // Get params using Next.js hooks instead of props
  const params = useParams();
  const shareCode = params.shareCode as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchFileInfo() {
      try {
        // First get file metadata
        const response = await fetch('/api/file-share', {
          method: 'OPTIONS',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shareCode }),
        });

        if (!response.ok) {
          throw new Error('File not found or no longer available');
        }

        const data = await response.json();
        
        setFileInfo({
          fileName: data.fileName,
          contentType: data.mimeType,
          sizeBytes: data.sizeBytes
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFileInfo();
  }, [shareCode]);

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/file-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareCode }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-catppuccin-base p-4">
      <div className="w-full max-w-md border-2 border-catppuccin-mauve bg-catppuccin-mantle p-8 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-black text-catppuccin-mauve tracking-tight">adcdn</h1>
        <h2 className="mb-6 text-center text-xl font-bold text-catppuccin-text">Shared File</h2>

        {loading ? (
          <div className="text-center">
            <p className="text-catppuccin-subtext1">Loading file information...</p>
          </div>
        ) : error ? (
          <div className="border-2 border-catppuccin-red bg-catppuccin-surface0 p-4 text-center text-catppuccin-red">
            <p>{error}</p>
            <Link href="/" className="mt-4 inline-block text-catppuccin-blue hover:text-catppuccin-lavender">
              Go to Home
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-1 text-lg font-medium text-catppuccin-text">{fileInfo.fileName}</p>
            <p className="mb-4 text-sm text-catppuccin-subtext1">
              {fileInfo.contentType} · {formatFileSize(fileInfo.sizeBytes)}
            </p>

            <div className="mb-6 flex flex-col h-auto min-h-40 items-center justify-center border-2 border-catppuccin-surface2 bg-catppuccin-surface0 overflow-hidden">
              {fileInfo.contentType && isViewableInBrowser(fileInfo.contentType) ? (
                <>
                  {fileInfo.contentType.startsWith('image/') && (
                    <img 
                      src={`/api/file-share?shareCode=${shareCode}`}
                      alt={fileInfo.fileName}
                      className="max-h-[240px] max-w-full object-contain"
                      onError={() => {
                        // Fallback if image fails to load
                        const imgElement = document.querySelector('img');
                        if (imgElement) {
                          (imgElement as HTMLElement).style.display = 'none';
                          const fallbackElement = document.getElementById('file-preview-fallback');
                          if (fallbackElement) (fallbackElement as HTMLElement).style.display = 'block';
                        }
                      }}
                    />
                  )}
                  
                  {fileInfo.contentType.startsWith('video/') && (
                    <video 
                      src={`/api/file-share?shareCode=${shareCode}`}
                      controls
                      className="max-h-[240px] max-w-full"
                      onError={() => {
                        // Fallback if video fails to load
                        const videoElement = document.querySelector('video');
                        if (videoElement) {
                          (videoElement as HTMLElement).style.display = 'none';
                          const fallbackElement = document.getElementById('file-preview-fallback');
                          if (fallbackElement) (fallbackElement as HTMLElement).style.display = 'block';
                        }
                      }}
                    />
                  )}
                  
                  {fileInfo.contentType.startsWith('audio/') && (
                    <div className="w-full p-4 flex flex-col items-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-16 w-16 text-catppuccin-overlay0 mb-4" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" 
                        />
                      </svg>
                      <audio 
                        src={`/api/file-share?shareCode=${shareCode}`}
                        controls
                        className="w-full max-w-[300px]"
                        onError={() => {
                          // Fallback if audio fails to load
                          const audioElement = document.querySelector('audio');
                          if (audioElement) {
                            (audioElement as HTMLElement).style.display = 'none';
                            const audioIconElement = audioElement.previousElementSibling;
                            if (audioIconElement) (audioIconElement as HTMLElement).style.display = 'none';
                            const fallbackElement = document.getElementById('file-preview-fallback');
                            if (fallbackElement) (fallbackElement as HTMLElement).style.display = 'block';
                          }
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <svg
                  id="file-preview-fallback"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-catppuccin-overlay0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )}
            </div>

            <div className="flex flex-col space-y-4">
              <button
                onClick={handleDownload}
                className="inline-block border-2 border-catppuccin-lavender bg-catppuccin-surface0 px-6 py-2 text-catppuccin-text transition hover:bg-catppuccin-surface1"
              >
                Download File
              </button>
              
              <button
                onClick={() => {
                  try {
                    const directLink = `${window.location.origin}/api/file-share?shareCode=${shareCode}`;
                    
                    // Use a fallback method that works in more browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = directLink;
                    textArea.style.position = 'fixed';  // Avoid scrolling to bottom
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    let successful = false;
                    try {
                      successful = document.execCommand('copy');
                    } catch (err) {
                      console.error('Fallback: Could not copy text: ', err);
                    } finally {
                      document.body.removeChild(textArea);
                    }
                    
                    // Show a temporary "Copied!" message
                    const button = document.getElementById('copy-link-button');
                    if (button) {
                      const originalText = button.textContent;
                      button.textContent = successful ? 'Copied!' : 'Copy failed';
                      setTimeout(() => {
                        button.textContent = originalText;
                      }, 2000);
                    }
                  } catch (err) {
                    console.error('Failed to copy link:', err);
                  }
                }}
                id="copy-link-button"
                className="inline-block border-2 border-catppuccin-peach bg-catppuccin-surface0 px-6 py-2 text-catppuccin-text transition hover:bg-catppuccin-surface1"
              >
                Copy Direct Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}