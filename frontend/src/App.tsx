import { useEffect } from 'react';
import AppRouter from './routes/AppRouter.tsx';
import useAuthStore from './store/authStore.ts';
import ErrorBoundary from './components/ErrorBoundary.tsx';

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}
