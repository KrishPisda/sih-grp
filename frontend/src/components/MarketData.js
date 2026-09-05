import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Newspaper, FileText, BarChart2 } from 'lucide-react';

const MarketData = () => {
  const bdiHistory = [
    { month: 'Jan', value: 1350 }, { month: 'Feb', value: 1420 }, { month: 'Mar', value: 1580 },
    { month: 'Apr', value: 1800 }, { month: 'May', value: 2100 }, { month: 'Jun', value: 1950 },
    { month: 'Jul', value: 1750 }, { month: 'Aug', value: 1850 }, { month: 'Sep', value: 2050 },
    { month: 'Oct', value: 2145 },
  ];

  return (
    <div>
      <h1 className="page-title">Market Data & Indices</h1>

      <div className="grid grid-cols-2">
        <div className="card">
          <h3>Baltic Exchange Indices</h3>
          <div style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Value</th>
                  <th>Change</th>
                  <th>W-o-W</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>BDI (Dry Index)</td>
                  <td>2,145</td>
                  <td className="change-up">+2.4%</td>
                  <td className="change-up">+5.2%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>BCI (Capesize)</td>
                  <td>3,421</td>
                  <td className="change-up">+3.1%</td>
                  <td className="change-up">+8.4%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>BPI (Panamax)</td>
                  <td>1,892</td>
                  <td className="change-down">-0.5%</td>
                  <td className="change-up">+1.2%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>BSI (Supramax)</td>
                  <td>1,245</td>
                  <td className="change-up">+1.2%</td>
                  <td className="change-down">-0.8%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>Commodity & Fuel Prices</h3>
          <div style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>Location</th>
                  <th>Price (USD)</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Thermal Coal</td>
                  <td>Newcastle (AUS)</td>
                  <td>$135.50/t</td>
                  <td className="change-up">↑</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Thermal Coal</td>
                  <td>Kalimantan (IDN)</td>
                  <td>$88.20/t</td>
                  <td className="change-down">↓</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Iron Ore (62% Fe)</td>
                  <td>Qingdao (CHN)</td>
                  <td>$118.00/t</td>
                  <td className="change-up">↑</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>VLSFO Bunker</td>
                  <td>Singapore</td>
                  <td>$645.00/t</td>
                  <td className="change-down">↓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>BDI Historical Trend (YTD)</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bdiHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" domain={['dataMin - 200', 'dataMax + 200']} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
              <Line type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} dot={{ r: 4, fill: '#00d4ff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginTop: '20px' }}>
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Newspaper size={18} /> Market News & Events</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>2 Hours Ago</span>
              <h4 style={{ margin: '4px 0' }}>Panama Canal Draft Restrictions Eased</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Authorities announce a 1ft increase in allowable draft starting next week, potentially easing Panamax transit times.</p>
            </div>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>5 Hours Ago</span>
              <h4 style={{ margin: '4px 0' }}>Australian Miners Ramp Up Q4 Output</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Major producers indicate higher volume targets for the quarter, likely supporting Capesize demand in the Pacific.</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>1 Day Ago</span>
              <h4 style={{ margin: '4px 0' }}>Monsoon Delays at Indian East Coast Ports</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Heavy rainfall causing temporary suspension of loading/unloading operations at Paradip and Dhamra.</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18} /> Recent Charter Fixtures</h3>
          <div style={{ marginTop: '16px', overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Vessel</th>
                  <th>Route</th>
                  <th>Cargo</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>MV Ocean Pearl (Pmax)</td>
                  <td>Hay Point -> Vizag</td>
                  <td>Coal (75k)</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>$14.25/t</td>
                </tr>
                <tr>
                  <td>Star Bulk (Cape)</td>
                  <td>Dampier -> Qingdao</td>
                  <td>Iron (170k)</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>$8.40/t</td>
                </tr>
                <tr>
                  <td>Eagle (Smax)</td>
                  <td>Richards Bay -> Ennore</td>
                  <td>Coal (55k)</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>$16.50/t</td>
                </tr>
                <tr>
                  <td>Navios (Pmax)</td>
                  <td>Baltimore -> Paradip</td>
                  <td>Coal (70k)</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>$41.00/t</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketData;
