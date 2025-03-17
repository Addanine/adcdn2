'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

      // Redirect to dashboard on success
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-catppuccin-base p-4">
      <div className="w-full max-w-md border-2 border-catppuccin-mauve bg-catppuccin-mantle p-8 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-black text-catppuccin-mauve tracking-tight">adcdn</h1>
        <h2 className="mb-6 text-center text-xl font-bold text-catppuccin-text">Log In</h2>
        
        {error && (
          <div className="mb-4 border-2 border-catppuccin-red bg-catppuccin-surface0 p-4 text-catppuccin-red">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-catppuccin-subtext0">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-catppuccin-surface2 bg-catppuccin-base p-2 text-catppuccin-text focus:border-catppuccin-mauve focus:outline-none"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-catppuccin-subtext0">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-catppuccin-surface2 bg-catppuccin-base p-2 text-catppuccin-text focus:border-catppuccin-mauve focus:outline-none"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full border-2 border-catppuccin-blue bg-catppuccin-surface0 py-2 text-catppuccin-text transition hover:bg-catppuccin-surface1 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Log In'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-catppuccin-subtext1">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-catppuccin-blue hover:text-catppuccin-lavender">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}