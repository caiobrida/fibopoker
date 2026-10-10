import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiProvider } from './shared/api/index.ts';
import { App } from './App.tsx';
import './shared/ui/tokens.css';
import './shared/ui/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiProvider>
      <App />
    </ApiProvider>
  </StrictMode>,
);
