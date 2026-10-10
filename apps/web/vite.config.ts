import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function deployedWithoutApiUrl(command: string): boolean {
  return (
    command === 'build' &&
    process.env.VERCEL !== undefined &&
    process.env.VITE_API_URL === undefined
  );
}

export default defineConfig(({ command }) => {
  if (deployedWithoutApiUrl(command)) {
    throw new Error('VITE_API_URL must name the deployed API, or this build would call localhost.');
  }

  return { plugins: [react()] };
});
