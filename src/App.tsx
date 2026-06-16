import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Purchase from '@/pages/Purchase';
import Templates from '@/pages/Templates';
import Orders from '@/pages/Orders';
import Stats from '@/pages/Stats';
import Reconciliation from '@/pages/Reconciliation';

const pageMap: Record<string, string> = {
  '/': 'home',
  '/purchase': 'purchase',
  '/templates': 'bouquet',
  '/orders': 'order',
  '/stats': 'stats',
  '/reconciliation': 'reconciliation',
};

const titleMap: Record<string, string> = {
  '/': '库存总览',
  '/purchase': '进货管理',
  '/templates': '花束模板',
  '/orders': '订单销售',
  '/stats': '月度统计',
  '/reconciliation': '订单对账',
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = pageMap[location.pathname] || 'home';
  const title = titleMap[location.pathname] || '花小筑';

  const handleNavigate = (page: string) => {
    const pathMap: Record<string, string> = {
      home: '/',
      purchase: '/purchase',
      bouquet: '/templates',
      order: '/orders',
      stats: '/stats',
      reconciliation: '/reconciliation',
    };
    navigate(pathMap[page] || '/');
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate} title={title}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/reconciliation" element={<Reconciliation />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
