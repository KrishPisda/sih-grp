import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Target, TrendingUp, AlertOctagon, ShieldCheck } from 'lucide-react';

const ChartStrategy = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [showSignal, setShowSignal] = useState(false);

  const mockPredictionData = [
    { day: 1, rate: 14200 },
    { day: 5, rate: 14100 },
    { day: 10, rate: 13800 }, // optimal dip
    { day: 15, rate: 14500 },
    { day: 20, rate: 15200 },
    { day: 25, rate: 15800 },
    { day: 30, rate: 16100 },
  ];

  const handleAnalyze = (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setShowSignal(false);
    setTimeout(() => {
      setAnalyzing(false);
      setShowSignal(true);
    }, 1500);
  };

  return (
    <div>
      <h1 className="page-title">Chartering Strategy Advisor</h1>

      <div className="grid grid-cols-3">
        <div className="card">
          <h3>Strategy Inputs</h3>
          <form onSubmit={handleAnalyze} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label className="form-label">Cargo Requirement Date</label>
              <input type="date" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Vessel Class</label>
              <select className="form-select">
                <option>Panamax</option>
                <option>Capesize</option>
                <option>Supramax</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Risk Appetite</label>
              <select className="form-select">
                <option>Conservative (Prefer fixed forward)</option>
                <option>Moderate (Blended approach)</option>
                <option>Aggressive (Spot market exposure)</option>
              </select>
            </div>
            <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={analyzing}>
              {analyzing ? <span className="animate-spin">↻</span> : <Target size={18} />}
              Generate Strategy Signal
            </button>
          </form>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          {!showSignal && !analyzing && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Configure parameters to generate an AI-driven chartering signal.
            </div>
          )}

          {analyzing && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <span className="animate-spin" style={{ fontSize: '3rem', marginBottom: '16px', display: 'block', textAlign: 'center' }}>↻</span>
              <p>Analyzing historical volatility and forward curves...</p>
            </div>
          )}

          {showSignal && (
            <div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
                
                <div style={{ flex: 1, background: 'rgba(245, 158, 11, 0.1)', border: '2px solid var(--warning)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--warning)', fontWeight: 'bold' }}>AI Recommendation</div>
                  <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--warning)', margin: '10px 0' }}>WAIT</div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Delay booking for 7-10 days</p>
                </div>

                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: '8px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', marginBottom: '8px' }}><TrendingUp size={16} /> Strategy Rationale</h4>
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>Our ML model detects a temporary softening in the Pacific basin due to a localized build-up of tonnage. Rates are projected to dip by ~2-3% next week before a strong Q4 rally begins.</p>
                  </div>
                  <div className="grid grid-cols-2" style={{ gap: '12px' }}>
                    <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Spot Rate</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>$14,200/day</div>
                    </div>
                    <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Entry Rate</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--success)' }}>$13,800/day</div>
                    </div>
                  </div>
                </div>
              </div>

              <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Rate Projection & Optimal Entry Window</h3>
              <div className="chart-container" style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockPredictionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="day" stroke="var(--text-secondary)" tickFormatter={(val) => `Day ${val}`} />
                    <YAxis stroke="var(--text-secondary)" domain={['dataMin - 500', 'dataMax + 500']} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
                    <ReferenceArea x1={7} x2={12} strokeOpacity={0.3} fill="var(--success)" fillOpacity={0.2} />
                    <Line type="monotone" dataKey="rate" stroke="#00d4ff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--success)', marginRight: '6px', verticalAlign: 'middle' }}></span>
                Highlighted area indicates optimal chartering window (Days 7-12)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartStrategy;
