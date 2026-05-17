import { Routes, Route } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import AlertsPage from '@/pages/AlertsPage';
import AnalyzePage from '@/pages/AnalyzePage';
import FoodTestingPage from '@/pages/FoodTestingPage';
import EducationPage from '@/pages/EducationPage';
import ComplaintPage from '@/pages/ComplaintPage';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Layout>
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
    </Layout>
    </>
  );
}
