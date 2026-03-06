import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import Dashboard from './Dashboard';
import Products from './Products';
import Categories from './Categories';
import Orders from './Orders';
import Credit from './Credit';
import Payments from './Payments';
import Users from './Users';
import Reports from './Reports';
import StockLog from './StockLog';

const ERPLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'produits':
        return <Products />;
      case 'categories':
        return <Categories />;
      case 'commandes':
        return <Orders />;
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
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#101922] flex">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 ml-64 min-h-screen flex flex-col overflow-hidden">
        <TopHeader currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default ERPLayout;
