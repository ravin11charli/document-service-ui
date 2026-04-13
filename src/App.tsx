import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import FoldersPage from './pages/FoldersPage';
import FolderDetailPage from './pages/FolderDetailPage';
import DocumentsPage from './pages/DocumentsPage';
import UploadPage from './pages/UploadPage';
import FolderTypesPage from './pages/FolderTypesPage';
import DocumentTypesPage from './pages/DocumentTypesPage';
import SearchPage from './pages/SearchPage';
import BucketManagerPage from './pages/BucketManagerPage';
import TrashPage from './pages/TrashPage';
import TagsPage from './pages/TagsPage';
import SettingsPage from './pages/SettingsPage';
import { useConfigStore } from './stores/configStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function ThemeApplier() {
  const theme = useConfigStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/folders" element={<FoldersPage />} />
            <Route path="/folders/:folderId" element={<FolderDetailPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/folder-types" element={<FolderTypesPage />} />
            <Route path="/document-types" element={<DocumentTypesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/bucket-manager" element={<BucketManagerPage />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
