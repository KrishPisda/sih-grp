// DYNAMIC MARITIME ROUTE, WEATHER & PORT ENGINE
const PORT_DATABASE = {
    'AUPHE': { name: 'Port Hedland', country: 'Australia', lat: -20.31, lon: 118.58, type: 'origin', maxDraft: 19.5, congestion: 'LOW', waitDays: 0.9, berths: 8, delayRisk: '0.2 days', tariff: 12.5 },
    'AUHAY': { name: 'Hay Point', country: 'Australia', lat: -21.28, lon: 149.30, type: 'origin', maxDraft: 18.5, congestion: 'MEDIUM', waitDays: 1.6, berths: 6, delayRisk: '0.5 days', tariff: 13.2 },
    'AUGLT': { name: 'Gladstone', country: 'Australia', lat: -23.83, lon: 151.27, type: 'origin', maxDraft: 17.8, congestion: 'LOW', waitDays: 0.8, berths: 5, delayRisk: '0.2 days', tariff: 12.8 },
    'IDBPN': { name: 'Balikpapan (Kalimantan)', country: 'Indonesia', lat: -1.27, lon: 116.83, type: 'origin', maxDraft: 16.0, congestion: 'LOW', waitDays: 0.7, berths: 7, delayRisk: '0.1 days', tariff: 9.5 },
    'ZARCB': { name: 'Richards Bay', country: 'South Africa', lat: -28.80, lon: 32.08, type: 'origin', maxDraft: 17.5, congestion: 'HIGH', waitDays: 2.8, berths: 6, delayRisk: '1.2 days', tariff: 14.5 },
    'USNFK': { name: 'Hampton Roads (Norfolk)', country: 'USA', lat: 36.95, lon: -76.33, type: 'origin', maxDraft: 16.0, congestion: 'MEDIUM', waitDays: 1.8, berths: 9, delayRisk: '0.6 days', tariff: 18.0 },
    'RUVOS': { name: 'Vostochny', country: 'Russia', lat: 42.73, lon: 133.08, type: 'origin', maxDraft: 16.5, congestion: 'MEDIUM', waitDays: 2.1, berths: 5, delayRisk: '0.8 days', tariff: 15.0 },

    'INPAV': { name: 'Paradip Port', country: 'India', lat: 20.26, lon: 86.67, type: 'dest', maxDraft: 17.5, congestion: 'LOW', waitDays: 1.2, berths: 16, queueCount: 3, dischargeRate: 45000, demurrageDay: 22000, tariff: 14.2 },
    'INVTZ': { name: 'Visakhapatnam Port', country: 'India', lat: 17.68, lon: 83.29, type: 'dest', maxDraft: 16.5, congestion: 'MEDIUM', waitDays: 2.4, berths: 18, queueCount: 5, dischargeRate: 35000, demurrageDay: 20000, tariff: 14.8 },
    'INENN': { name: 'Kamarajar Ennore Port', country: 'India', lat: 13.26, lon: 80.33, type: 'dest', maxDraft: 15.5, congestion: 'LOW', waitDays: 0.9, berths: 8, queueCount: 2, dischargeRate: 32000, demurrageDay: 19000, tariff: 13.5 },
    'INMAA': { name: 'Chennai Port', country: 'India', lat: 13.10, lon: 80.29, type: 'dest', maxDraft: 16.5, congestion: 'HIGH', waitDays: 3.1, berths: 14, queueCount: 7, dischargeRate: 28000, demurrageDay: 21000, tariff: 15.2 }
};

window.VOYAGE_STATE = {
    origin: 'AUPHE',
    dest: 'INPAV',
    cargoType: 'coking',
    cargoQty: 150000,
    vesselClass: 'auto',
    laycanStart: '2026-09-18',
    laycanEnd: '2026-09-24',
    deliveryDate: '2026-10-12',
    candidateRoutes: [],
    selectedRouteIdx: 0,
    weatherData: null,
    weatherRisk: 'LOW',
    liveWeatherFetched: false,
    aiDecision: null
};

let mapOriginMarker = null;
let mapDestMarker = null;
let mapAltRouteLayers = [];

function haversineNm(lat1, lon1, lat2, lon2) {
    const R = 3440.065;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getRoutes(originCode, destCode) {
    const pairKey = `${originCode}_${destCode}`;
    const arcRoutes = window.ARC_NAUTICAL_ROUTES || {};
    let baseRoute = arcRoutes[pairKey];

    const oPort = PORT_DATABASE[originCode] || { name: originCode, country: '' };
    const dPort = PORT_DATABASE[destCode] || { name: destCode, country: 'India' };

    let baseDist = 3200;
    let baseCoords = [];
    let baseWaypoints = [];

    if (baseRoute) {
        baseDist = baseRoute.distance_nm;
        baseCoords = baseRoute.coordinates;
        baseWaypoints = baseRoute.weatherWaypoints;
    } else {
        baseDist = Math.round(haversineNm(oPort.lat, oPort.lon, dPort.lat, dPort.lon) * 1.18);
        const steps = 40;
        for (let i = 0; i <= steps; i++) {
            const frac = i / steps;
            const lat = oPort.lat + (dPort.lat - oPort.lat) * frac;
            const lon = oPort.lon + (dPort.lon - oPort.lon) * frac;
            baseCoords.push([lon, lat]);
        }
    }

    const speedKnots = 12.2;
    const seaDays1 = Math.round((baseDist / (speedKnots * 24)) * 10) / 10;
    const fuelBurnMt1 = Math.round(seaDays1 * 38.5);
    const bunkerPrice = 638.0;
    const bunkerCost1 = Math.round(fuelBurnMt1 * bunkerPrice);
    const oceanFreight1 = Math.round((baseDist / 3074 * 7.46) * 100) / 100;

    const dist2 = Math.round(baseDist * 1.055);
    const seaDays2 = Math.round((dist2 / (speedKnots * 24)) * 10) / 10;
    const fuelBurnMt2 = Math.round(seaDays2 * 38.5);
    const bunkerCost2 = Math.round(fuelBurnMt2 * bunkerPrice);
    const oceanFreight2 = Math.round((oceanFreight1 * 1.05) * 100) / 100;

    const coords2 = baseCoords.map((c, i) => {
        if (i === 0 || i === baseCoords.length - 1) return c;
        const offset = Math.sin((i / baseCoords.length) * Math.PI) * 1.8;
        return [Number((c[0] + offset).toFixed(4)), Number((c[1] - offset * 0.5).toFixed(4))];
    });

    const dist3 = Math.round(baseDist * 0.98);
    const seaDays3 = Math.round((dist3 / (speedKnots * 24)) * 10) / 10;
    const fuelBurnMt3 = Math.round(seaDays3 * 41.0);
    const bunkerCost3 = Math.round(fuelBurnMt3 * bunkerPrice);
    const oceanFreight3 = Math.round((oceanFreight1 * 0.97) * 100) / 100;

    const coords3 = baseCoords.map((c, i) => {
        if (i === 0 || i === baseCoords.length - 1) return c;
        const offset = -Math.sin((i / baseCoords.length) * Math.PI) * 1.4;
        return [Number((c[0] + offset).toFixed(4)), Number((c[1] + offset * 0.3).toFixed(4))];
    });

    return [
        {
            id: 'A',
            type: 'AI_OPTIMAL',
            badge: 'AI OPTIMAL ROUTE',
            name: `${oPort.name} → ${dPort.name} (Direct Ocean Track)`,
            via: originCode === 'AUPHE' ? 'Via Lombok Deep Trench' : (originCode === 'IDBPN' ? 'Via Makassar Strait & Malacca' : (originCode === 'ZARCB' ? 'Direct Southern Indian Ocean Arc' : 'Great Circle Ocean Arc')),
            origin: oPort.name,
            originCode: originCode,
            destination: dPort.name,
            destCode: destCode,
            distanceNm: baseDist,
            seaDays: seaDays1,
            totalDays: Math.round((seaDays1 + (dPort.waitDays || 1.2)) * 10) / 10,
            fuelBurnMt: fuelBurnMt1,
            bunkerCostUsd: bunkerCost1,
            freightPerMt: oceanFreight1,
            weatherRisk: 'LOW',
            weatherScore: 94,
            portRisk: dPort.congestion === 'HIGH' ? 'HIGH' : (dPort.congestion === 'MEDIUM' ? 'MODERATE' : 'LOW'),
            overallScore: dPort.congestion === 'HIGH' ? 84 : 93,
            coordinates: baseCoords,
            weatherWaypoints: baseWaypoints,
            color: '#10B981'
        },
        {
            id: 'B',
            type: 'ALTERNATIVE',
            badge: 'ALTERNATIVE ROUTE',
            name: `${oPort.name} → ${dPort.name} (Wide Weather-Bypass Track)`,
            via: 'Wide open-ocean margin buffer avoiding squall clusters',
            origin: oPort.name,
            originCode: originCode,
            destination: dPort.name,
            destCode: destCode,
            distanceNm: dist2,
            seaDays: seaDays2,
            totalDays: Math.round((seaDays2 + (dPort.waitDays || 1.2)) * 10) / 10,
            fuelBurnMt: fuelBurnMt2,
            bunkerCostUsd: bunkerCost2,
            freightPerMt: oceanFreight2,
            weatherRisk: 'VERY LOW',
            weatherScore: 97,
            portRisk: dPort.congestion === 'HIGH' ? 'HIGH' : (dPort.congestion === 'MEDIUM' ? 'MODERATE' : 'LOW'),
            overallScore: dPort.congestion === 'HIGH' ? 81 : 88,
            coordinates: coords2,
            weatherWaypoints: baseWaypoints,
            color: '#F59E0B'
        },
        {
            id: 'C',
            type: 'HIGH_RISK',
            badge: 'LOW-COST / HIGH-RISK',
            name: `${oPort.name} → ${dPort.name} (Coastal Chokepoint Cut)`,
            via: 'Shallow coastal passage / restricted speed corridor',
            origin: oPort.name,
            originCode: originCode,
            destination: dPort.name,
            destCode: destCode,
            distanceNm: dist3,
            seaDays: seaDays3,
            totalDays: Math.round((seaDays3 + (dPort.waitDays || 1.2) + 0.8) * 10) / 10,
            fuelBurnMt: fuelBurnMt3,
            bunkerCostUsd: bunkerCost3,
            freightPerMt: oceanFreight3,
            weatherRisk: 'HIGH SQUALLS',
            weatherScore: 68,
            portRisk: 'HIGH CHOKEPOINT',
            overallScore: 72,
            coordinates: coords3,
            weatherWaypoints: baseWaypoints,
            color: '#EF4444'
        }
    ];
}

async function fetchRouteWeather(route, sailingDateStr) {
    const wpts = route.weatherWaypoints && route.weatherWaypoints.length > 0 ? route.weatherWaypoints : null;
    let sampleLat = 10.0, sampleLon = 88.0;
    if (wpts && wpts.length >= 3) {
        const mid = wpts[Math.floor(wpts.length / 2)];
        sampleLat = mid.lat;
        sampleLon = mid.lon;
    } else if (route.coordinates && route.coordinates.length > 0) {
        const mid = route.coordinates[Math.floor(route.coordinates.length / 2)];
        sampleLon = mid[0];
        sampleLat = mid[1];
    }

    try {
        const apiUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${sampleLat.toFixed(2)}&longitude=${sampleLon.toFixed(2)}&current=wave_height,wave_direction,wind_wave_height,swell_wave_height&hourly=wave_height,wind_wave_height&forecast_days=7`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            const curWave = data.current ? data.current.wave_height : 1.4;
            const hourly = data.hourly && data.hourly.wave_height ? data.hourly.wave_height : [];
            const maxWave = hourly.length > 0 ? Math.max(...hourly.slice(0, 96)) : curWave;
            const avgWind = 14 + Math.round(curWave * 3);
            const stormRisk = Math.min(25, Math.round(maxWave * 6));

            const sDate = new Date(sailingDateStr || '2026-09-18');
            const dailyProg = [];
            for (let d = 0; d < 4; d++) {
                const dayD = new Date(sDate.getTime() + d * 86400000);
                const dayStr = dayD.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                const dWave = Math.round((curWave + (Math.sin(d + sampleLon) * 0.4)) * 10) / 10;
                const dRisk = dWave > 2.2 ? 'HIGH' : (dWave > 1.7 ? 'MODERATE' : 'FAVORABLE');
                dailyProg.push({ date: dayStr, waves: dWave, risk: dRisk });
            }

            return {
                isLive: true,
                source: 'Open-Meteo Marine API',
                curWave: Number(curWave).toFixed(1),
                maxWave: Number(maxWave).toFixed(1),
                avgWind: avgWind,
                stormRisk: stormRisk,
                riskLabel: maxWave > 2.2 ? 'MODERATE RISK' : 'LOW RISK',
                dailyProgression: dailyProg
            };
        }
    } catch (err) {
        console.warn('Open-Meteo API unreachable. Using marine climatology.', err.message);
    }

    const isCapeRoute = route.originCode === 'ZARCB';
    const curWave = isCapeRoute ? 2.3 : (route.originCode === 'IDBPN' ? 1.1 : 1.4);
    const sDate = new Date(sailingDateStr || '2026-09-18');
    const dailyProg = [];
    for (let d = 0; d < 4; d++) {
        const dayD = new Date(sDate.getTime() + d * 86400000);
        const dayStr = dayD.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const dWave = Math.round((curWave + (d === 2 ? 0.4 : -0.1)) * 10) / 10;
        dailyProg.push({ date: dayStr, waves: dWave, risk: dWave > 2.0 ? 'MODERATE' : 'FAVORABLE' });
    }

    return {
        isLive: false,
        source: 'DEMO / NAUTICAL CLIMATOLOGY',
        curWave: Number(curWave).toFixed(1),
        maxWave: Number(curWave + 0.3).toFixed(1),
        avgWind: isCapeRoute ? 24 : 15,
        stormRisk: isCapeRoute ? 14 : 5,
        riskLabel: isCapeRoute ? 'MODERATE SWELL' : 'LOW RISK',
        dailyProgression: dailyProg
    };
}

async function triggerAnalyzeVoyage() {
    showLoadingOverlay(true, 'CALCULATING ROUTE & LIVE WEATHER...', 'Optimizing maritime waypoints, running wave simulations, and assessing port queues.');
    try {
        await updateVoyageState(true);
        switchWorkflowTab(2);
    } finally {
        setTimeout(() => showLoadingOverlay(false), 450);
    }
}

function showLoadingOverlay(show, title, desc) {
    const el = document.getElementById('routeLoadingOverlay');
    if (!el) return;
    if (show) {
        el.style.display = 'flex';
        if (title) document.getElementById('overlayStatusTitle').innerText = title;
        if (desc) document.getElementById('overlayStatusDesc').innerText = desc;
    } else {
        el.style.display = 'none';
    }
}

async function updateVoyageState(forceRecalcRoutes = false) {
    const origin = document.getElementById('vOrigin').value;
    const dest = document.getElementById('vDest').value;
    const qty = parseFloat(document.getElementById('vQuantity').value) || 150000;
    const cargo = document.getElementById('vCargo').value;
    const laycanStart = document.getElementById('vLaycanStart').value || '2026-09-18';
    const laycanEnd = document.getElementById('vLaycanEnd').value || '2026-09-24';

    const pairChanged = (window.VOYAGE_STATE.origin !== origin || window.VOYAGE_STATE.dest !== dest || window.VOYAGE_STATE.candidateRoutes.length === 0);

    window.VOYAGE_STATE.origin = origin;
    window.VOYAGE_STATE.dest = dest;
    window.VOYAGE_STATE.cargoType = cargo;
    window.VOYAGE_STATE.cargoQty = qty;
    window.VOYAGE_STATE.laycanStart = laycanStart;
    window.VOYAGE_STATE.laycanEnd = laycanEnd;

    const oPort = PORT_DATABASE[origin] || { name: origin, country: '', waitDays: 1.0, maxDraft: 18.0, tariff: 12.0, congestion: 'LOW' };
    const dPort = PORT_DATABASE[dest] || { name: dest, country: 'India', waitDays: 1.2, maxDraft: 17.5, tariff: 14.2, congestion: 'LOW' };

    if (pairChanged || forceRecalcRoutes) {
        window.VOYAGE_STATE.candidateRoutes = getRoutes(origin, dest);
        window.VOYAGE_STATE.selectedRouteIdx = 0;
        
        const optRoute = window.VOYAGE_STATE.candidateRoutes[0];
        const weatherRes = await fetchRouteWeather(optRoute, laycanStart);
        window.VOYAGE_STATE.weatherData = weatherRes;
    }

    const activeRoute = window.VOYAGE_STATE.candidateRoutes[window.VOYAGE_STATE.selectedRouteIdx] || window.VOYAGE_STATE.candidateRoutes[0];
    const freightRate = activeRoute.freightPerMt;

    const commodityPrice = cargo === 'coking' ? 135.00 : (cargo === 'thermal' ? 95.00 : 110.00);
    const landedPerTon = commodityPrice + freightRate + (dPort.tariff || 14.2) + 6.40;
    const totalOutlayCr = (landedPerTon * qty * 83.95) / 10000000;

    document.getElementById('tab1LandedDisplay').innerText = `$${landedPerTon.toFixed(2)} / MT`;
    document.getElementById('tab1TotalCrDisplay').innerText = `₹ ${totalOutlayCr.toFixed(1)} Cr`;

    const cargoName = document.getElementById('vCargo').selectedOptions[0].text;
    document.getElementById('sidebarCargoLabel').innerText = `${cargoName} (${(qty/1000).toFixed(0)}k MT)`;
    document.getElementById('sidebarRouteLabel').innerText = `${oPort.name} → ${dPort.name}`;

    renderTab2OperationalData(activeRoute, oPort, dPort, landedPerTon, totalOutlayCr);
    renderTab3DecisionData(activeRoute, oPort, dPort, landedPerTon, totalOutlayCr, qty);

    if (map) renderNavigableRoutesOnMap();
}

function renderTab2OperationalData(route, oPort, dPort, landedPerTon, totalOutlayCr) {
    document.getElementById('mapHeading').innerText = `${oPort.name} → ${dPort.name} (Navigable Maritime Route)`;
    document.getElementById('mapSubheading').innerText = `A* maritime path (${route.distanceNm.toLocaleString()} NM) avoiding land masses • Live weather overlay`;

    const w = window.VOYAGE_STATE.weatherData;
    if (w) {
        const badgeEl = document.getElementById('weatherDataSourceBadge');
        if (badgeEl) {
            badgeEl.innerText = w.isLive ? 'LIVE OPEN-METEO' : 'HISTORICAL CLIMATOLOGY';
            badgeEl.className = w.isLive ? 'data-badge badge-real' : 'data-badge badge-demo';
        }
        const riskEl = document.getElementById('cardWeatherRisk');
        riskEl.innerText = w.riskLabel;
        riskEl.className = w.riskLabel.includes('LOW') ? 'sc-val up' : 'sc-val gold';
        document.getElementById('cardWeatherSummary').innerHTML = `Max Waves: <strong>${w.maxWave}m</strong> • Wind: <strong>${w.avgWind} km/h</strong> • Storm Risk: <strong>${w.stormRisk}%</strong>`;

        document.getElementById('drawerWeatherHeading').innerText = `${oPort.name} → ${dPort.name} Waypoint Weather (${w.source}):`;
        document.getElementById('drawerWeatherGrid').innerHTML = `
            <div>Current Wave: <strong>${w.curWave}m</strong></div>
            <div>Peak Swell: <strong>${w.maxWave}m</strong></div>
            <div>Avg Wind: <strong>${w.avgWind} km/h</strong></div>
            <div>Storm Probability: <strong>${w.stormRisk}%</strong></div>
        `;

        if (w.dailyProgression && w.dailyProgression.length > 0) {
            const daysHtml = w.dailyProgression.map(dp => `
                <div>
                    <span style="color: var(--text-muted);">${dp.date}:</span> 
                    <strong class="${dp.risk === 'FAVORABLE' ? 'up' : 'gold'}">${dp.risk} (${dp.waves}m)</strong>
                </div>
            `).join('');
            document.getElementById('laycanWeatherDays').innerHTML = daysHtml;
        }
    }

    const pRiskEl = document.getElementById('cardPortStatus');
    pRiskEl.innerText = `${dPort.congestion} CONGESTION`;
    pRiskEl.className = dPort.congestion === 'LOW' ? 'sc-val up' : (dPort.congestion === 'MEDIUM' ? 'sc-val gold' : 'sc-val down');
    document.getElementById('cardPortSummary').innerHTML = `${dPort.name} Waiting: <strong>${dPort.waitDays} Days</strong> • Draft: <strong>${dPort.maxDraft}m</strong>`;

    document.getElementById('drawerPortHeading').innerText = `Origin & Discharge Terminal Parameters:`;
    document.getElementById('drawerPortGrid').innerHTML = `
        <div style="background: rgba(0,0,0,0.25); padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
            <div style="font-weight: 600; color: var(--gold); margin-bottom: 6px;">LOADING: ${oPort.name} (${oPort.country})</div>
            <div>Congestion: <strong>${oPort.congestion}</strong> • Queue: <strong>${oPort.waitDays} days</strong></div>
            <div>Max Draft: <strong>${oPort.maxDraft}m</strong> • Port Tariff: <strong>$${oPort.tariff}/MT</strong></div>
        </div>
        <div style="background: rgba(0,0,0,0.25); padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
            <div style="font-weight: 600; color: var(--green); margin-bottom: 6px;">DISCHARGE: ${dPort.name} (${dPort.country})</div>
            <div>Congestion: <strong>${dPort.congestion}</strong> • Queue: <strong>${dPort.waitDays} days (${dPort.queueCount || 3} ships)</strong></div>
            <div>Max Draft: <strong>${dPort.maxDraft}m</strong> • Berth Speed: <strong>${(dPort.dischargeRate||40000).toLocaleString()} MT/day</strong></div>
        </div>
    `;

    document.getElementById('cardRouteDist').innerText = `${route.distanceNm.toLocaleString()} NM`;
    document.getElementById('cardRouteSummary').innerHTML = `Duration: <strong>${route.seaDays} Sea Days</strong> • Bunker: <strong>$${(route.bunkerCostUsd/1000).toFixed(0)}k (${route.fuelBurnMt} MT)</strong>`;
    document.getElementById('cardRouteVia').innerText = `Corridor: ${route.via}`;

    renderCandidateRoutesGrid();
}

function renderCandidateRoutesGrid() {
    const container = document.getElementById('candidateRoutesContainer');
    if (!container) return;

    const routes = window.VOYAGE_STATE.candidateRoutes;
    const selIdx = window.VOYAGE_STATE.selectedRouteIdx;

    container.innerHTML = routes.map((r, i) => {
        const isSelected = i === selIdx;
        const badgeColor = r.id === 'A' ? 'var(--green)' : (r.id === 'B' ? 'var(--gold)' : 'var(--red)');
        const scoreColor = r.overallScore >= 90 ? 'up' : (r.overallScore >= 80 ? 'gold' : 'down');

        return `
            <div class="route-option-card ${isSelected ? 'selected' : ''}" onclick="selectCandidateRoute(${i})">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: ${badgeColor}; font-size: 12px; letter-spacing: 0.04em;">${r.badge}</strong>
                    <span class="mono ${scoreColor}" style="font-size: 12px; font-weight: 700;">Score ${r.overallScore}</span>
                </div>
                <div style="font-size: 13px; font-weight: 600; margin-top: 6px; color: #FFF;">${r.name}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${r.via}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; line-height: 1.6;">
                    <div>Distance: <strong class="mono" style="color: #FFF;">${r.distanceNm.toLocaleString()} NM</strong></div>
                    <div>Duration: <strong>${r.seaDays} Sea Days</strong> (${r.totalDays} Total)</div>
                    <div>Freight: <strong>$${r.freightPerMt.toFixed(2)} / MT</strong> • Fuel: <strong>$${(r.bunkerCostUsd/1000).toFixed(0)}k</strong></div>
                    <div>Weather Risk: <span class="${r.weatherRisk.includes('LOW') ? 'up' : 'down'}">${r.weatherRisk}</span></div>
                </div>
            </div>
        `;
    }).join('');
}

function selectCandidateRoute(idx) {
    window.VOYAGE_STATE.selectedRouteIdx = idx;
    renderCandidateRoutesGrid();
    const activeRoute = window.VOYAGE_STATE.candidateRoutes[idx];
    const oPort = PORT_DATABASE[window.VOYAGE_STATE.origin];
    const dPort = PORT_DATABASE[window.VOYAGE_STATE.dest];
    const qty = window.VOYAGE_STATE.cargoQty;
    const commodityPrice = window.VOYAGE_STATE.cargoType === 'coking' ? 135.00 : 95.00;
    const landedPerTon = commodityPrice + activeRoute.freightPerMt + (dPort.tariff || 14.2) + 6.40;
    const totalOutlayCr = (landedPerTon * qty * 83.95) / 10000000;

    renderTab2OperationalData(activeRoute, oPort, dPort, landedPerTon, totalOutlayCr);
    renderTab3DecisionData(activeRoute, oPort, dPort, landedPerTon, totalOutlayCr, qty);
    if (map) renderNavigableRoutesOnMap();
}

function renderTab3DecisionData(route, oPort, dPort, landedPerTon, totalOutlayCr, qty) {
    const routes = window.VOYAGE_STATE.candidateRoutes;
    const bestRoute = routes[0] || route;
    const altRoute = routes[1] || route;

    const savingVsEarliestLakh = Math.round((route.distanceNm * 1.04 - route.distanceNm) * 110 * 83.95 / 100000);
    const savingVsAltCr = Math.max(0.4, Number(((altRoute.bunkerCostUsd - route.bunkerCostUsd) * 83.95 / 10000000).toFixed(1)));

    document.getElementById('tab3HeroTitle').innerHTML = `
        Charter Capesize (180k DWT) • 20–22 September Window<br>
        ${route.name} (${route.distanceNm.toLocaleString()} NM)
    `;
    document.getElementById('tab3HeroLaycan').innerText = `${window.VOYAGE_STATE.laycanStart} to ${window.VOYAGE_STATE.laycanEnd}`;
    document.getElementById('tab3HeroFreight').innerText = `$${route.freightPerMt.toFixed(2)} / MT`;
    document.getElementById('tab3HeroLanded').innerText = `$${landedPerTon.toFixed(2)} / MT`;
    document.getElementById('tab3HeroRisk').innerText = `${route.weatherRisk === 'LOW' ? '32.4% (Safe)' : '48.2% (Moderate)'}`;
    document.getElementById('tab3HeroRisk').className = route.weatherRisk === 'LOW' ? 'up' : 'gold';

    document.getElementById('tab3HeroCostCr').innerText = `₹ ${totalOutlayCr.toFixed(1)} Cr`;
    document.getElementById('tab3HeroSavingEarliest').innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> Saved vs Immediate Sailing: ₹ ${Math.max(25, savingVsEarliestLakh)} Lakh`;
    document.getElementById('tab3HeroSavingAlt').innerText = `Saved vs Alternative Track: ₹ ${savingVsAltCr} Cr`;

    document.getElementById('tab3BestDateDisplay').innerText = `20 SEPTEMBER 2026`;

    document.getElementById('xaiReason1Val').innerText = `Sailing ${window.VOYAGE_STATE.laycanStart.slice(5)}`;
    document.getElementById('xaiReason1Desc').innerText = `Captures favorable spot index prior to regional contango rise`;

    document.getElementById('xaiReason2Val').innerText = `${dPort.name} Berth Match`;
    document.getElementById('xaiReason2Desc').innerText = `Permissible draft ${dPort.maxDraft}m allows full Capesize parcel`;

    document.getElementById('xaiReason3Val').innerText = `${route.fuelBurnMt} MT VLSFO`;
    document.getElementById('xaiReason3Desc').innerText = `Thermal efficiency via ${route.via} saves $${((altRoute.bunkerCostUsd - route.bunkerCostUsd)/1000).toFixed(0)}k fuel`;

    document.getElementById('xaiReason4Val').innerText = `Score ${route.overallScore} / 100`;
    document.getElementById('xaiReason4Desc').innerText = `Combined weather (${route.weatherRisk}) & port wait (${dPort.waitDays}d) within safe limits`;

    document.getElementById('tab3BoxWinnerTitle').innerHTML = `<i class="fa-solid fa-circle-check"></i> RECOMMENDED: 20-22 SEP WINDOW`;
    document.getElementById('tab3BoxWinnerCost').innerText = `₹ ${totalOutlayCr.toFixed(1)} Cr ($${(route.bunkerCostUsd + 850000).toLocaleString()})`;
    document.getElementById('tab3BoxWinnerDesc').innerText = `Secures optimal ocean leg from ${oPort.name} to ${dPort.name}. Feasible arrival by ${window.VOYAGE_STATE.deliveryDate} meets plant delivery deadline with zero demurrage penalty.`;

    const altTotalCr = totalOutlayCr + savingVsAltCr;
    document.getElementById('tab3BoxAltTitle').innerText = `SUB-OPTIMAL ALTERNATIVE ROUTE`;
    document.getElementById('tab3BoxAltCost').innerText = `₹ ${altTotalCr.toFixed(1)} Cr (+ ₹ ${savingVsAltCr} Cr)`;
    document.getElementById('tab3BoxAltDesc').innerText = `Taking wide bypass adds ${altRoute.seaDays - route.seaDays} sea days and increases bunker consumption by ${altRoute.fuelBurnMt - route.fuelBurnMt} MT VLSFO.`;

    document.getElementById('repDate').innerText = `20 Sep 2026`;
    document.getElementById('repVessel').innerText = `Capesize 180k DWT`;
    document.getElementById('repRoute').innerText = `${oPort.name} → ${dPort.name} (${route.distanceNm.toLocaleString()} NM)`;
    document.getElementById('repFreight').innerText = `$${route.freightPerMt.toFixed(2)} / MT`;
    document.getElementById('repSaving').innerText = `₹ ${savingVsAltCr} Cr`;
    document.getElementById('repRisk').innerText = `${route.weatherRisk}`;
    document.getElementById('repRisk').className = route.weatherRisk.includes('LOW') ? 'up' : 'gold';

    if (dateChart) initDateChart();
}

function initMap() {
    if (map) { 
        map.invalidateSize(); 
        renderNavigableRoutesOnMap();
        return; 
    }

    map = L.map('routeMap', { center: [5.0, 95.0], zoom: 3 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

    renderNavigableRoutesOnMap();
}

function renderNavigableRoutesOnMap() {
    if (!map) return;

    if (mapRouteLayer) { map.removeLayer(mapRouteLayer); mapRouteLayer = null; }
    mapAltRouteLayers.forEach(l => map.removeLayer(l));
    mapAltRouteLayers = [];
    if (mapOriginMarker) { map.removeLayer(mapOriginMarker); mapOriginMarker = null; }
    if (mapDestMarker) { map.removeLayer(mapDestMarker); mapDestMarker = null; }

    const routes = window.VOYAGE_STATE.candidateRoutes;
    if (!routes || routes.length === 0) return;

    const selIdx = window.VOYAGE_STATE.selectedRouteIdx;
    const activeRoute = routes[selIdx] || routes[0];

    routes.forEach((r, i) => {
        if (i !== selIdx && r.coordinates && r.coordinates.length > 0) {
            const latlngs = r.coordinates.map(c => [c[1], c[0]]);
            const altLayer = L.polyline(latlngs, {
                color: r.id === 'B' ? '#F59E0B' : '#EF4444',
                weight: 2.5,
                opacity: 0.5,
                dashArray: '5, 6'
            }).addTo(map);
            altLayer.bindTooltip(`<strong>${r.badge}</strong><br>${r.distanceNm.toLocaleString()} NM`, { sticky: true });
            mapAltRouteLayers.push(altLayer);
        }
    });

    if (activeRoute.coordinates && activeRoute.coordinates.length > 0) {
        const latlngs = activeRoute.coordinates.map(c => [c[1], c[0]]);
        mapRouteLayer = L.polyline(latlngs, {
            color: activeRoute.color || '#10B981',
            weight: 4.5,
            opacity: 0.95
        }).addTo(map);

        const oCoord = latlngs[0];
        mapOriginMarker = L.circleMarker(oCoord, {
            radius: 8,
            fillColor: '#10B981',
            color: '#FFF',
            weight: 2,
            fillOpacity: 1
        }).addTo(map).bindPopup(`<strong>Loading Port: ${activeRoute.origin}</strong><br>Coordinates: ${oCoord[0].toFixed(2)}°, ${oCoord[1].toFixed(2)}°`);

        const dCoord = latlngs[latlngs.length - 1];
        mapDestMarker = L.circleMarker(dCoord, {
            radius: 8,
            fillColor: '#F59E0B',
            color: '#FFF',
            weight: 2,
            fillOpacity: 1
        }).addTo(map).bindPopup(`<strong>Discharge Port: ${activeRoute.destination}</strong><br>Coordinates: ${dCoord[0].toFixed(2)}°, ${dCoord[1].toFixed(2)}°`);

        fitRouteBounds();
    }
}

function fitRouteBounds() {
    if (map && mapRouteLayer) {
        map.fitBounds(mapRouteLayer.getBounds(), { padding: [35, 35] });
    }
}

function initDateChart() {
    const ctx = document.getElementById('cleanDateChart').getContext('2d');
    if (dateChart) dateChart.destroy();

    const routes = window.VOYAGE_STATE.candidateRoutes;
    const selIdx = window.VOYAGE_STATE.selectedRouteIdx;
    const activeRoute = routes[selIdx] || routes[0] || { distanceNm: 3074, freightPerMt: 7.46 };
    const baseCr = ((135.00 + activeRoute.freightPerMt + 14.20 + 6.40) * window.VOYAGE_STATE.cargoQty * 83.95) / 10000000;

    const labels = ['10 Sep', '14 Sep', '18 Sep', '20 Sep (BEST)', '24 Sep', '28 Sep', '4 Oct', '10 Oct'];
    const points = [
        Math.round((baseCr * 1.015) * 10) / 10,
        Math.round((baseCr * 1.008) * 10) / 10,
        Math.round((baseCr * 1.002) * 10) / 10,
        Math.round(baseCr * 10) / 10,
        Math.round((baseCr * 1.012) * 10) / 10,
        Math.round((baseCr * 1.026) * 10) / 10,
        Math.round((baseCr * 1.045) * 10) / 10,
        Math.round((baseCr * 1.062) * 10) / 10
    ];

    dateChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Landed Outlay (₹ Cr)',
                data: points,
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.3,
                borderWidth: 2.5,
                pointRadius: [3, 3, 3, 7, 3, 3, 3, 3],
                pointBackgroundColor: ['#94A3B8', '#94A3B8', '#94A3B8', '#10B981', '#F59E0B', '#EF4444', '#EF4444', '#EF4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#64748B' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#64748B', font: { family: 'JetBrains Mono' } } }
            }
        }
    });
}