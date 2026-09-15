import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './ai-chat-fullscreen.css';
import Phase00App from './Phase00App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Phase00App />
  </React.StrictMode>,
);
