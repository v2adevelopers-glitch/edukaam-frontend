import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { DProvider } from './context/DContext';
import { installNumberInputGuard } from './helper/numberInputGuard';

installNumberInputGuard();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <DProvider>
        <App />
      </DProvider>
    </BrowserRouter>
  </React.StrictMode>
);
