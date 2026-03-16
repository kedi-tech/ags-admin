import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import Dashboard from './Dashboard';
import Products from './Products';
import Categories from './Categories';
import SubCategoriesPage from './SubCategories';
import Orders from './Orders';
import Customers from './Customers';
import Credit from './Credit';
import Payments from './Payments';
import Users from './Users';
import Reports from './Reports';
import StockLog from './StockLog';

const ERPLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;

  const currentPage =
    path === '/' ? 'dashboard'
    : path === '/products' ? 'produits'
    : path === '/categories' ? 'categories'
    : path === '/subcategories' ? 'subcategories'
    : path === '/orders' ? 'commandes'
    : path === '/customers' ? 'clients'
    : path === '/credit' ? 'credit'
    : path === '/payments' ? 'paiements'
    : path === '/users' ? 'utilisateurs'
    : path === '/reports' ? 'rapports'
    : path === '/stock' ? 'stock'
    : 'dashboard';

  const handleNavigate = (page: string) => {
    switch (page) {
      case 'dashboard':
        navigate('/');
        break;
      case 'produits':
        navigate('/products');
        break;
      case 'categories':
        navigate('/categories');
        break;
      case 'subcategories':
        navigate('/subcategories');
        break;
      case 'commandes':
        navigate('/orders');
        break;
      case 'clients':
        navigate('/customers');
        break;
      case 'credit':
        navigate('/credit');
        break;
      case 'paiements':
        navigate('/payments');
        break;
      case 'utilisateurs':
        navigate('/users');
        break;
      case 'rapports':
        navigate('/reports');
        break;
      case 'stock':
        navigate('/stock');
        break;
      default:
        navigate('/');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'produits':
        return <Products />;
      case 'categories':
        return <Categories />;
      case 'subcategories':
        return <SubCategoriesPage />;
      case 'commandes':
        return <Orders onNavigate={handleNavigate} />;
      case 'clients':
        return <Customers onNavigate={handleNavigate} />;
      case 'credit':
        return <Credit />;
      case 'paiements':
        return <Payments />;
      case 'utilisateurs':
        return <Users />;
      case 'rapports':
        return <Reports />;
      case 'stock':
        return <StockLog />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#101922] flex">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64 min-h-screen flex flex-col overflow-hidden">
        <TopHeader currentPage={currentPage} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default ERPLayout;
