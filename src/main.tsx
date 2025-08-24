import logger from '@/lib/logger';
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/globals.css';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element not found');
}
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker 등록 (개발/프로덕션)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(registration => {
        logger.info('main', 'SW registered', registration);
      })
      .catch(registrationError => {
        logger.error('main', 'SW registration failed', registrationError);
      });
  });
}
