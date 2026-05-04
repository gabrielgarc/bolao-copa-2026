import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { AdminScreen } from './components/AdminScreen';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const isAdminRoute = window.location.pathname === '/bolao-adm';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isAdminRoute ? <AdminScreen /> : <App />}
  </React.StrictMode>
);