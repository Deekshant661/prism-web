import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Spinner from './components/ui/Spinner';
import { listFunds } from './api/funds';

// Lazy-loaded pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const RankingsPage = React.lazy(() => import('./pages/RankingsPage'));
const FundDetailPage = React.lazy(() => import('./pages/FundDetailPage'));
const ComparePage = React.lazy(() => import('./pages/ComparePage'));
const SIPCalculatorPage = React.lazy(() => import('./pages/SIPCalculatorPage'));
const UploadPage = React.lazy(() => import('./pages/UploadPage'));
const WatchlistPage = React.lazy(() => import('./pages/WatchlistPage'));
const DataManagementPage = React.lazy(() => import('./pages/DataManagementPage'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Preloads fund list into React Query cache for instant global search */
function FundListPreloader() {
  useQuery({
    queryKey: ['funds'],
    queryFn: listFunds,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <FundListPreloader />
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Suspense fallback={<Spinner size="lg" />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/rankings" element={<RankingsPage />} />
              <Route path="/rankings/:category" element={<RankingsPage />} />
              <Route path="/fund/:id" element={<FundDetailPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/calculator" element={<SIPCalculatorPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/data-management" element={<DataManagementPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#1f2937',
              color: '#fff',
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
