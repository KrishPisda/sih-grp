import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, XCircle, Search, Anchor, Ship } from 'lucide-react';

const VesselRecommendation = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(false);

  const mockCostData = [
    { name: 'Panamax', cost: 420000 },
    { name: 'Capesize', cost: 780000 },
    { name: 'Supramax', cost: 350000 },
    { name: 'Handysize', cost: 280000 },
  ];

  const handleAnalyze = (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setResults(false);
    setTimeout(() => {
      setAnalyzing(false);
      setResults(true);
    }, 1200);
  };

  return (
    <div>
      <h1 className="page-title">AI Vessel Match & Recommendation</h1>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Voyage Requirements</h3>
        <form onSubmit={handleAnalyze} className="grid grid-cols-4" style={{ marginTop: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Cargo Type</label>
            <select className="form-select">
              <option>Coal</option>
              <option>Iron Ore</option>
              <option>Grain</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Volume (Metric Tons)</label>
            <input type="number" className="form-input" defaultValue={75000} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Route</label>
            <select className="form-select">
              <option>Newcastle -> Vizag</option>
              <option>Samarinda -> Paradip</option>
            </select>
          </div>
          <button type="submit" className="btn" disabled={analyzing}>
            {analyzing ? <span className="animate-spin">↻</span> : <Search size={18} />}
            Analyze & Recommend
          </button>
        </form>
      </div>

      {results && (
        <div className="grid grid-cols-3">
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3>Ranked Vessel Recommendations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              
              {/* Best Match */}
              <div style={{ border: '2px solid #f59e0b', borderRadius: '12px', padding: '16px', background: 'rgba(245, 158, 11, 0.05)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-12px', left: '16px', background: '#f59e0b', color: '#000', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  Top Match
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Ship size={20} /> Panamax Class</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Optimal size for 75k ton coal cargo</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>94/100</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Match Score</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4" style={{ marginTop: '16px', gap: '10px' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Est. Total Cost</div>
                    <div style={{ fontWeight: 'bold' }}>$420,000</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Transit Time</div>
                    <div style={{ fontWeight: 'bold' }}>18 Days</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Port Compatibility</div>
                    <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><CheckCircle2 size={14} /> Vizag Verified</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Carbon Score</div>
                    <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>A (Optimal)</div>
                  </div>
                </div>
              </div>

              {/* Second Match */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Ship size={18} /> Supramax (Partial Load x2)</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Requires split cargo across two vessels</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff6b35' }}>78/100</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4" style={{ marginTop: '16px', gap: '10px' }}>
                  <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Est. Total Cost</div>
                    <div style={{ fontWeight: 'bold' }}>$485,000</div>
                  </div>
                  <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Transit Time</div>
                    <div style={{ fontWeight: 'bold' }}>20 Days</div>
                  </div>
                  <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Port Compatibility</div>
                    <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><CheckCircle2 size={14} /> All clear</div>
                  </div>
                  <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Carbon Score</div>
                    <div style={{ color: '#ff6b35', fontWeight: 'bold' }}>C (Higher)</div>
                  </div>
                </div>
              </div>

              {/* Third Match Warning */}
              <div style={{ border: '1px solid var(--danger)', borderRadius: '12px', padding: '16px', background: 'rgba(239, 68, 68, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Ship size={18} /> Capesize Class</h4>
                    <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> Draft restriction warning at destination</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>42/100</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="card">
            <h3>Cost Comparison</h3>
            <div className="chart-container" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockCostData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-secondary)" tickFormatter={(val) => `$${val/1000}k`} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" width={80} />
                  <Tooltip formatter={(val) => `$${val.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
                  <Bar dataKey="cost" fill="#00d4ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><Anchor size={16} /> Port Constraints</h4>
              <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Vizag inner harbor draft limited to 14.5m</li>
                <li>Paradip requires lighterage for Capesize</li>
                <li>Ennore optimal for thermal coal handling</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VesselRecommendation;
