# CLAUDE.md - Development Guide

## Build and Development Commands
- Build: `npm run build` 
- Dev server: `npm run dev`
- Start production: `npm run start`
- Preview: `npm run preview`

## Lint and Testing
- Lint check: `npm run lint`
- Lint and fix: `npm run lint:fix`
- Type check: `npm run typecheck`
- Format check: `npm run format:check`
- Format code: `npm run format:write`
- Run all checks: `npm run check`

## Code Style Guidelines
- Use TypeScript with strict type checking
- Use path alias: `~/*` maps to `./src/*`
- Prefer type imports: `import type { Type } from 'module'`
- Prefix unused variables with underscore: `_unusedVar`
- Follow Next.js conventions for page/component structure
- Use Tailwind CSS for styling
- Run prettier before committing changes
- Format with Prettier using the project's configuration

## Error Handling
- Use try/catch blocks for async operations
- Handle promise rejections explicitly