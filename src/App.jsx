import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout/AppLayout';
import Loader from './components/Loader/Loader';
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions/Transactions'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const Calendar = lazy(() => import('./pages/Calendar/Calendar'));
const Goals = lazy(() => import('./pages/Goals/Goals'));
const FriendSplits = lazy(() => import('./pages/FriendSplits/FriendSplits'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const InfoPage = lazy(() => import('./pages/InfoPage/InfoPage'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

export default function App() { return (
    <AuthProvider>
      <Suspense fallback={<Loader />}><Routes><Route element={<AppLayout />}><Route path="/" element={<Dashboard />} /><Route path="/transactions" element={<Transactions />} /><Route path="/analytics" element={<Analytics />} /><Route path="/reports" element={<Reports />} /><Route path="/calendar" element={<Calendar />} /><Route path="/goals" element={<Goals />} /><Route path="/friend-splits" element={<FriendSplits />} /><Route path="/settings" element={<Settings />} /><Route path="/help" element={<InfoPage type="help" />} /><Route path="/about" element={<InfoPage type="about" />} /></Route><Route path="/404" element={<NotFound />} /><Route path="*" element={<Navigate replace to="/404" />} /></Routes></Suspense>; }
