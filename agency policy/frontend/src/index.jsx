import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AutoProvider } from './contexts/AutoContext';
import App from './App.jsx';
import './index.css';
import './App.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AutoProvider>
        <App />
      </AutoProvider>
    </BrowserRouter>
  </React.StrictMode>
);
