import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><BrowserRouter><FinanceProvider><App /></FinanceProvider></BrowserRouter></ErrorBoundary></React.StrictMode>);
