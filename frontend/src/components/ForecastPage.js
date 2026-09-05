import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, Loader2, Info } from 'lucide-react';

const ForecastPage = () => {
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const mockForecastData = [
    { date: 'Today', rate: 14200, lower: 14000, upper: 14400 },
    { date: 'Day 7', rate: 14500, lower: 14100, upper: 14900 },
    { date: 'Day 14', rate: 15100, lower: 14300, upper: 15900 },
    { date: 'Day 21', rate: 14800, lower: 13800, upper: 15800 },
    { date: 'Day 30', rate: 15600, lower: 14200, upper: 17000 },
  ];

  const featureImportance = [
    { name: 'Bunker Prices', value: 85 },
    { name: 'Port Congestion', value: 72 },
    { name: 'Commodity Demand', value: 68 },
    { name: 'Vessel Availability', value: 65 },
    { name: 'Seasonality', value: 45 },
    { name: 'Weather Events', value: 30 },
  ];

  const handleForecast = (e) => {
    e.preventDefault();
    setLoading(true);
    setShowResults(false);
    setTimeout(() => {
      setLoading(false);
      setShowResults(true);
    }, 1500);
  };

  return (
    <div>
      <h1 className="page-title">Rate Forecast Engine</h1>
      
      <div className="grid grid-cols-3" style={{ gap: '20px' }}>
        <div className="card">
          <h3>Forecast Parameters</h3>
          <form onSubmit={handleForecast} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label className="form-label">Vessel Type</label>
              <select className="form-select">
                <option>Panamax (60-80k DWT)</option>
                <option>Capesize (150k+ DWT)</option>
                <option>Supramax (50-60k DWT)</option>
                <option>Handysize (15-50k DWT)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Origin Port</label>
              <select className="form-select">
                <option>Newcastle, Australia</option>
                <option>Samarinda, Indonesia</option>
                <option>Richards Bay, South Africa</option>
                <option>Baltimore, USA</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination Port</label>
              <select className="form-select">
                <option>Visakhapatnam, India</option>
                <option>Paradip, India</option>
                <option>Ennore, India</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Forecast Horizon</label>
              <select className="form-select">
                <option>30 Days</option>
                <option>60 Days</option>
                <option>90 Days</option>
              </select>
            </div>
            <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Calendar size={18} />}
              Generate Forecast
            </button>
          </form>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          {!showResults && !loading && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Info size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Enter parameters and click Generate Forecast to see AI predictions.</p>
            </div>
          )}

          {loading && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <Loader2 className="animate-spin" size={48} style={{ marginBottom: '16px' }} />
              <p>Running ML inference models...</p>
            </div>
          )}

          {showResults && (
            <div>
              <h3>Predicted Freight Rates (Time Charter Equivalent)</h3>
              <div className="chart-container" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockForecastData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" domain={['dataMin - 1000', 'dataMax + 1000']} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
                    <Legend />
                    <Area type="monotone" dataKey="upper" name="Upper Confidence Bounds (95%)" stroke="none" fill="#00d4ff" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="lower" name="Lower Confidence Bounds" stroke="none" fill="var(--bg-card)" fillOpacity={1} />
                    <Area type="monotone" dataKey="rate" name="Predicted Rate ($/day)" stroke="#00d4ff" strokeWidth={3} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2" style={{ marginTop: '20px' }}>
                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--success)', marginBottom: '8px' }}>Optimal Charter Window</h4>
                  <p style={{ fontSize: '0.9rem' }}>Days 1-7 offer the lowest predicted rates before an expected market rally in Week 3.</p>
                </div>
                <div>
                  <h4 style={{ marginBottom: '8px' }}>Feature Importance</h4>
                  <div style={{ height: '120px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={featureImportance} margin={{ top: 0, right: 0, bottom: 0, left: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} width={80} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', fontSize: '12px' }} />
                        <Bar dataKey="value" fill="#ff6b35" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastPage;
