// src/main.jsx (or index.jsx)

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
