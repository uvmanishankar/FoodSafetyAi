import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import Layout from '@/components/layout/Layout';

const HomePage = lazy(() => import('@/pages/HomePage'));
const AlertsPage = lazy(() => import('@/pages/AlertsPage'));
const AnalyzePage = lazy(() => import('@/pages/AnalyzePage'));
const FoodTestingPage = lazy(() => import('@/pages/FoodTestingPage'));
const EducationPage = lazy(() => import('@/pages/EducationPage'));
const ComplaintPage = lazy(() => import('@/pages/ComplaintPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Layout>
        <Suspense
          fallback={
            <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">
              Loading page...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/testing-guide" element={<FoodTestingPage />} />
            <Route path="/education" element={<EducationPage />} />
            <Route path="/nutrition" element={<EducationPage />} />
            <Route path="/awareness" element={<EducationPage />} />
            <Route path="/foodborne" element={<EducationPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/complaint" element={<ComplaintPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}
