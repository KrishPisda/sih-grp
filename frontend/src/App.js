import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Ship, LayoutDashboard, LineChart, Anchor, MapPin, Compass, BarChart2, Activity } from 'lucide-react';

import Dashboard from './components/Dashboard';
import ForecastPage from './components/ForecastPage';
import VesselRecommendation from './components/VesselRecommendation';
import PortStatus from './components/PortStatus';
import ChartStrategy from './components/ChartStrategy';
import MarketData from './components/MarketData';
import Analytics from './components/Analytics';

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/forecast', icon: <LineChart size={20} />, label: 'Forecast' },
    { path: '/vessels', icon: <Ship size={20} />, label: 'Vessel Match' },
    { path: '/ports', icon: <Anchor size={20} />, label: 'Port Status' },
    { path: '/strategy', icon: <Compass size={20} />, label: 'Strategy' },
    { path: '/market', icon: <Activity size={20} />, label: 'Market Data' },
    { path: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Ship size={28} />
        <h2>FreightAI</h2>
      </div>
      <div className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

const Header = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="top-header">
      <div className="header-left">
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Intelligent Freight Forecasting Model</h3>
        <span className="badge">SIH26006</span>
        <span className="badge" style={{ background: 'rgba(0, 212, 255, 0.1)', color: 'var(--accent-cyan)', borderColor: 'rgba(0, 212, 255, 0.3)' }}>
          Ministry of Steel
        </span>
      </div>
      <div className="header-right">
        <span>{time.toLocaleTimeString()} UTC</span>
        <span>
          <span className="status-dot"></span>
          Live Data
        </span>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Header />
          <div className="page-container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="/vessels" element={<VesselRecommendation />} />
              <Route path="/ports" element={<PortStatus />} />
              <Route path="/strategy" element={<ChartStrategy />} />
              <Route path="/market" element={<MarketData />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
