import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Anchor, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

const PortStatus = () => {
  const congestionData = [
    { day: 'Mon', vizag: 4, paradip: 2, ennore: 1 },
    { day: 'Tue', vizag: 5, paradip: 2, ennore: 2 },
    { day: 'Wed', vizag: 6, paradip: 3, ennore: 1 },
    { day: 'Thu', vizag: 7, paradip: 4, ennore: 1 },
    { day: 'Fri', vizag: 6, paradip: 3, ennore: 2 },
    { day: 'Sat', vizag: 5, paradip: 2, ennore: 2 },
    { day: 'Sun', vizag: 4, paradip: 2, ennore: 1 },
  ];

  return (
    <div>
      <h1 className="page-title">East Coast Port Monitoring</h1>

      <div className="grid grid-cols-3">
        {/* Vizag */}
        <div className="card" style={{ borderTop: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2>Visakhapatnam</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Andhra Pradesh</span>
            </div>
            <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Highly Congested</span>
          </div>
          
          <div className="grid grid-cols-2" style={{ marginTop: '20px', gap: '10px' }}>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Queue Length</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>14 Vessels</div>
            </div>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Wait Time</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>6.2 Days</div>
            </div>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Max Draft</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>14.5m</div>
            </div>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Berths</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>24 / 26</div>
            </div>
          </div>
        </div>

        {/* Paradip */}
        <div className="card" style={{ borderTop: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2>Paradip</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Odisha</span>
            </div>
            <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Moderate</span>
          </div>
          
          <div className="grid grid-cols-2" style={{ marginTop: '20px', gap: '10px' }}>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Queue Length</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>8 Vessels</div>
            </div>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Wait Time</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>2.4 Days</div>
            </div>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Max Draft</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>14.5m</div>
            </div>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Berths</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>14 / 15</div>
            </div>
          </div>
        </div>

        {/* Ennore */}
        <div className="card" style={{ borderTop: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2>Ennore (Kamarajar)</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tamil Nadu</span>
            </div>
            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Operational</span>
          </div>
          
          <div className="grid grid-cols-2" style={{ marginTop: '20px', gap: '10px' }}>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Queue Length</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>2 Vessels</div>
            </div>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Wait Time</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>0.5 Days</div>
            </div>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Max Draft</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>18.0m</div>
            </div>
            <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Berths</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>8 / 8</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ marginTop: '20px' }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>7-Day Congestion Trend (Wait Days)</h3>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={congestionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="day" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
                <Area type="monotone" dataKey="vizag" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Visakhapatnam" />
                <Area type="monotone" dataKey="paradip" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} name="Paradip" />
                <Area type="monotone" dataKey="ennore" stackId="3" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Ennore" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Vessel Lineup (Vizag)</h3>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { name: 'MV Ocean Star', type: 'Panamax', eta: 'Today 14:00', status: 'At Anchor' },
              { name: 'Bulk Explorer', type: 'Supramax', eta: 'Tomorrow 08:00', status: 'In Transit' },
              { name: 'Pacific Pearl', type: 'Capesize', eta: 'Oct 25 10:00', status: 'In Transit' },
              { name: 'Iron Titan', type: 'Panamax', eta: 'Oct 26 18:00', status: 'Loading Port' },
            ].map((v, i) => (
              <div key={i} style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>{v.name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{v.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {v.eta}</span>
                  <span style={{ color: v.status === 'At Anchor' ? 'var(--warning)' : 'var(--text-secondary)' }}>{v.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortStatus;
