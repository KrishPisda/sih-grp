import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, Database, CheckCircle2, Server } from 'lucide-react';

const Analytics = () => {
  // Scatter data: Predicted vs Actual
  const scatterData = Array.from({ length: 50 }, () => {
    const actual = 10000 + Math.random() * 8000;
    const error = (Math.random() - 0.5) * 1500;
    return { actual: Math.round(actual), predicted: Math.round(actual + error) };
  });

  const seasonalityData = [
    { month: 'Jan', rate: 12500 }, { month: 'Feb', rate: 11000 }, { month: 'Mar', rate: 13500 },
    { month: 'Apr', rate: 15000 }, { month: 'May', rate: 16500 }, { month: 'Jun', rate: 14000 },
    { month: 'Jul', rate: 13000 }, { month: 'Aug', rate: 14500 }, { month: 'Sep', rate: 17000 },
    { month: 'Oct', rate: 18500 }, { month: 'Nov', rate: 19000 }, { month: 'Dec', rate: 16000 },
  ];

  return (
    <div>
      <h1 className="page-title">ML Model Analytics & Data Pipeline</h1>

      <div className="grid grid-cols-4">
        <div className="card">
          <div className="kpi-title">Model RMSE (Panamax)</div>
          <div className="kpi-value">$542</div>
          <div className="kpi-change change-up">Excellent accuracy (&lt; 5% error)</div>
        </div>
        <div className="card">
          <div className="kpi-title">R² Score</div>
          <div className="kpi-value">0.89</div>
          <div className="kpi-change change-up">High explanatory power</div>
        </div>
        <div className="card">
          <div className="kpi-title">MAPE</div>
          <div className="kpi-value">4.2%</div>
          <div className="kpi-change change-up">Mean Absolute Pct Error</div>
        </div>
        <div className="card">
          <div className="kpi-title">Last Training Run</div>
          <div className="kpi-value" style={{ fontSize: '1.5rem' }}>2 Hrs Ago</div>
          <div className="kpi-change" style={{ color: 'var(--text-secondary)' }}>Automated pipeline</div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginTop: '20px' }}>
        <div className="card">
          <h3>Model Validation: Predicted vs Actual Rates</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" dataKey="actual" name="Actual Rate" stroke="var(--text-secondary)" domain={['auto', 'auto']} tickFormatter={(val) => `$${val/1000}k`} />
                <YAxis type="number" dataKey="predicted" name="Predicted Rate" stroke="var(--text-secondary)" domain={['auto', 'auto']} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} formatter={(value) => `$${value}`} />
                <Scatter name="Validation Set" data={scatterData} fill="#00d4ff" fillOpacity={0.6} />
                {/* Perfect prediction line */}
                <Line type="linear" dataKey="actual" stroke="#ff6b35" strokeDasharray="5 5" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '10px' }}>Points closer to the diagonal represent higher prediction accuracy.</p>
        </div>

        <div className="card">
          <h3>Seasonality Analysis (Historical Averages)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonalityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
                <Bar dataKey="rate" fill="#ff6b35" radius={[4, 4, 0, 0]} name="Avg Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={18} /> Data Integration Pipeline Status</h3>
        <div className="grid grid-cols-4" style={{ marginTop: '16px', gap: '16px' }}>
          
          <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>Baltic Exchange API</span>
              <CheckCircle2 size={16} color="var(--success)" />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Indices & FFA Data</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Last sync: 5 mins ago</div>
          </div>

          <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>AIS Vessel Tracking</span>
              <CheckCircle2 size={16} color="var(--success)" />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Live positions & speed</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Last sync: 2 mins ago</div>
          </div>

          <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>Port Authority Data</span>
              <CheckCircle2 size={16} color="var(--success)" />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Berth status & queues</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Last sync: 15 mins ago</div>
          </div>

          <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>Commodity Markets</span>
              <CheckCircle2 size={16} color="var(--success)" />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Coal, Iron Ore, Bunker</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Last sync: 1 hour ago</div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Analytics;
