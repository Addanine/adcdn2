import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-catppuccin-base p-4">
      <div className="w-full max-w-md border-2 border-catppuccin-mauve bg-catppuccin-mantle p-8 shadow-xl">
        <div className="text-center mb-12">
          <h1 className="mb-6 text-5xl font-black text-catppuccin-mauve tracking-tight">adcdn</h1>
          
          <div className="flex flex-col gap-4">
            <Link
              href="/login"
              className="block border-2 border-catppuccin-blue bg-catppuccin-surface0 px-6 py-3 text-lg font-medium text-catppuccin-text transition-colors hover:bg-catppuccin-surface1"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="block border-2 border-catppuccin-pink bg-catppuccin-surface0 px-6 py-3 text-lg font-medium text-catppuccin-text transition-colors hover:bg-catppuccin-surface1"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
