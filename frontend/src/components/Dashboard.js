import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Ship, AlertCircle, Anchor, Map } from 'lucide-react';

const mockChartData = [
  { date: 'Oct 01', capesize: 18500, panamax: 12200, supramax: 10500, handysize: 8200 },
  { date: 'Oct 15', capesize: 19200, panamax: 12500, supramax: 10800, handysize: 8400 },
  { date: 'Nov 01', capesize: 21000, panamax: 13100, supramax: 11200, handysize: 8600 },
  { date: 'Nov 15', capesize: 20500, panamax: 12800, supramax: 11000, handysize: 8500 },
  { date: 'Dec 01', capesize: 22300, panamax: 13500, supramax: 11500, handysize: 8800 },
  { date: 'Dec 15', capesize: 24100, panamax: 14200, supramax: 12100, handysize: 9100 },
];

const mockRoutes = [
  { route: 'Australia (Newcastle) -> Vizag', cargo: 'Coal', rate: '$14.50/t', trend: 'up' },
  { route: 'Indonesia (Samarinda) -> Paradip', cargo: 'Coal', rate: '$9.20/t', trend: 'down' },
  { route: 'Russia (Vladivostok) -> Ennore', cargo: 'Coal', rate: '$18.80/t', trend: 'up' },
  { route: 'USA (Baltimore) -> Vizag', cargo: 'Coal', rate: '$42.10/t', trend: 'up' },
];

const Dashboard = () => {
  return (
    <div>
      <div className="ticker">
        <div className="ticker-content">
          <span className="ticker-item"><span style={{ color: 'var(--accent-cyan)' }}>BDI:</span> 2,145 (+2.4%)</span>
          <span className="ticker-item"><span style={{ color: 'var(--accent-cyan)' }}>BCI:</span> 3,421 (+3.1%)</span>
          <span className="ticker-item"><span style={{ color: 'var(--accent-cyan)' }}>BPI:</span> 1,892 (-0.5%)</span>
          <span className="ticker-item"><span style={{ color: 'var(--accent-cyan)' }}>BSI:</span> 1,245 (+1.2%)</span>
          <span className="ticker-item"><span style={{ color: 'var(--accent-cyan)' }}>BHSI:</span> 780 (+0.8%)</span>
        </div>
      </div>

      <h1 className="page-title" style={{ marginTop: '20px' }}>Market Overview</h1>

      <div className="grid grid-cols-4">
        <div className="card">
          <div className="kpi-title"><TrendingUp size={16} /> Baltic Dry Index</div>
          <div className="kpi-value">2,145</div>
          <div className="kpi-change change-up"><TrendingUp size={14} /> +51 pts (2.4%)</div>
        </div>
        <div className="card">
          <div className="kpi-title"><Ship size={16} /> Avg Panamax Rate</div>
          <div className="kpi-value">$14,200<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/day</span></div>
          <div className="kpi-change change-down"><TrendingDown size={14} /> -$150 (-1.0%)</div>
        </div>
        <div className="card">
          <div className="kpi-title"><Map size={16} /> Active Voyages tracked</div>
          <div className="kpi-value">142</div>
          <div className="kpi-change change-up" style={{ color: 'var(--text-secondary)' }}>Live updates</div>
        </div>
        <div className="card">
          <div className="kpi-title"><Anchor size={16} /> Avg Port Congestion (India East)</div>
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>4.2 Days</div>
          <div className="kpi-change change-up"><TrendingUp size={14} /> +0.5 days</div>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ marginTop: '20px' }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>Historical Freight Rates (90 Days)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'white' }} />
                <Legend />
                <Line type="monotone" dataKey="capesize" name="Capesize" stroke="#00d4ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="panamax" name="Panamax" stroke="#ff6b35" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="supramax" name="Supramax" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="handysize" name="Handysize" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <AlertCircle size={18} color="var(--accent-orange)" />
            AI Market Insights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(255, 107, 53, 0.1)', borderLeft: '3px solid var(--accent-orange)', borderRadius: '4px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-primary)' }}>Panamax Rates Surging</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rates expected to rise 8% next 2 weeks due to high coal demand in China and low vessel availability.</p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid var(--success)', borderRadius: '4px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-primary)' }}>Favorable Charter Window</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Indonesia to Paradip route showing optimal conditions for Supramax booking this week.</p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid var(--danger)', borderRadius: '4px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-primary)' }}>Port Congestion Warning</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vizag experiencing severe delays (avg 6 days). Recommend factoring demurrage into voyage estimates.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Key Route Heatmap</h3>
        <div style={{ marginTop: '16px', overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Route</th>
                <th>Main Cargo</th>
                <th>Current Rate</th>
                <th>Trend (7d)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockRoutes.map((route, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{route.route}</td>
                  <td>{route.cargo}</td>
                  <td>{route.rate}</td>
                  <td className={route.trend === 'up' ? 'change-up' : 'change-down'}>
                    {route.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: 'rgba(0, 212, 255, 0.1)', color: 'var(--accent-cyan)' }}>Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
