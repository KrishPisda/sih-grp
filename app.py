# ============================================================
#   🚢 INTELLIGENT FREIGHT FORECASTING DASHBOARD
#   Overseas → East Coast India | Bulk Cargo & Vessel Chartering
# ============================================================

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from xgboost import XGBRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, r2_score
import warnings
warnings.filterwarnings("ignore")

# ── PAGE CONFIG ──────────────────────────────────────────────
st.set_page_config(
    page_title="Freight Forecasting Dashboard",
    page_icon="🚢",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── CUSTOM CSS ───────────────────────────────────────────────
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #1F4E79, #2E86AB);
        padding: 20px; border-radius: 12px; margin-bottom: 20px;
        text-align: center; color: white;
    }
    .metric-card {
        background: #f0f4f8; border-radius: 10px;
        padding: 15px; text-align: center; border-left: 4px solid #1F4E79;
    }
    .section-header {
        background: #1F4E79; color: white;
        padding: 8px 15px; border-radius: 8px;
        margin: 15px 0 10px 0; font-size: 16px; font-weight: bold;
    }
    .signal-buy  { background:#d4edda; color:#155724; padding:10px 20px; border-radius:8px; font-size:18px; font-weight:bold; text-align:center; }
    .signal-wait { background:#f8d7da; color:#721c24; padding:10px 20px; border-radius:8px; font-size:18px; font-weight:bold; text-align:center; }
</style>
""", unsafe_allow_html=True)

# ── HEADER ───────────────────────────────────────────────────
st.markdown("""
<div class="main-header">
    <h1>🚢 Intelligent Freight Forecasting Model</h1>
    <p style="font-size:16px; margin:0;">Overseas → East Coast India &nbsp;|&nbsp; Vessel Chartering &nbsp;|&nbsp; Bulk Cargo Procurement</p>
</div>
""", unsafe_allow_html=True)

# ── LOAD DATA ────────────────────────────────────────────────
@st.cache_data
def load_data():
    xl = "Freight_Forecasting_Dataset.xlsx"
    bdi   = pd.read_excel(xl, sheet_name="1_BDI_FreightRates",     skiprows=3, parse_dates=["Date"])
    comm  = pd.read_excel(xl, sheet_name="2_Commodity_Fuel_Prices", skiprows=3, parse_dates=["Date"])
    forex = pd.read_excel(xl, sheet_name="3_Forex_Macro",           skiprows=3, parse_dates=["Date"])
    stk   = pd.read_excel(xl, sheet_name="4_India_Steel_Port_Stocks",skiprows=3, parse_dates=["Date"])
    ports = pd.read_excel(xl, sheet_name="5_EastCoastIndiaPorts",   skiprows=3)
    routes= pd.read_excel(xl, sheet_name="6_ShippingRoutes",        skiprows=3)
    vessels=pd.read_excel(xl, sheet_name="7_VesselSpecifications",  skiprows=3)
    imp   = pd.read_excel(xl, sheet_name="8_India_Import_Stats",    skiprows=3, parse_dates=["Month"])

    # Merge daily data
    df = bdi.merge(comm,  on="Date", how="left")
    df = df.merge(forex,  on="Date", how="left")
    df = df.merge(stk,    on="Date", how="left")
    df.fillna(method="ffill", inplace=True)
    df.dropna(subset=["BDI","Brent_Crude_USD_bbl","USDINR"], inplace=True)
    df["Month_Num"]   = df["Date"].dt.month
    df["Quarter"]     = df["Date"].dt.quarter
    df["Monsoon_Flag"]= df["Month_Num"].isin([6,7,8,9]).astype(int)
    df["Year"]        = df["Date"].dt.year
    return df, ports, routes, vessels, imp

df, ports, routes, vessels, imp = load_data()

# ── SIDEBAR ──────────────────────────────────────────────────
st.sidebar.image("https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/100px-Flag_of_India.svg.png", width=60)
st.sidebar.title("🎛️ Control Panel")
st.sidebar.markdown("---")

st.sidebar.subheader("📅 Date Range")
min_date = df["Date"].min().date()
max_date = df["Date"].max().date()
date_range = st.sidebar.date_input("Select Period", [min_date, max_date], min_value=min_date, max_value=max_date)

st.sidebar.markdown("---")
st.sidebar.subheader("🚢 Chartering Parameters")
origin    = st.sidebar.selectbox("🌍 Load Port (Origin)", routes["Load_Port"].unique())
port_name = st.sidebar.selectbox("⚓ Discharge Port (East Coast India)", ["Paradip","Visakhapatnam","Ennore","Gangavaram","Krishnapatnam","Dhamra","Haldia","Chennai"])
commodity = st.sidebar.selectbox("📦 Commodity", ["Thermal Coal","Iron Ore","Coking Coal","Fertilizers","Steel Scrap"])
vessel    = st.sidebar.selectbox("🛳️ Vessel Type", vessels["Vessel_Type"].tolist())
cargo_mt  = st.sidebar.slider("📏 Cargo Volume (MT)", 10000, 200000, 75000, 5000)

st.sidebar.markdown("---")
st.sidebar.subheader("📈 Forecast Horizon")
forecast_days = st.sidebar.radio("Predict next:", [7, 30, 60, 90], index=1, horizontal=True)

# Filter date
if len(date_range) == 2:
    mask = (df["Date"].dt.date >= date_range[0]) & (df["Date"].dt.date <= date_range[1])
    dff = df[mask].copy()
else:
    dff = df.copy()

# ── ROUTE INFO ───────────────────────────────────────────────
route_row  = routes[routes["Load_Port"].str.contains(origin.split("(")[0].strip(), na=False)].head(1)
vessel_row = vessels[vessels["Vessel_Type"] == vessel].iloc[0] if vessel in vessels["Vessel_Type"].values else vessels.iloc[4]
dist_nm    = int(route_row["Dist_NM"].values[0]) if not route_row.empty else 4800
voyage_d   = int(route_row["Voyage_Days"].values[0]) if not route_row.empty else 16
fuel_day   = float(vessel_row["Fuel_Laden_MTd"])
tc_rate    = float(vessel_row["TC_Rate_USD_d"])
dwt        = float(vessel_row["Typical_DWT"])

# Cost Calculation
latest_brent    = float(dff["Brent_Crude_USD_bbl"].iloc[-1]) if len(dff) else 80.0
bunker_usd_mt   = latest_brent * 6.35   # approx conversion bbl → MT
fuel_cost       = fuel_day * voyage_d * bunker_usd_mt
hire_cost       = tc_rate * voyage_d
port_cost       = 150000   # port dues estimate
total_voyage    = fuel_cost + hire_cost + port_cost
freight_per_mt  = total_voyage / max(cargo_mt, 1)
latest_usdinr   = float(dff["USDINR"].iloc[-1]) if len(dff) else 84.0
freight_inr     = freight_per_mt * latest_usdinr

# BDI Today
latest_bdi      = float(dff["BDI"].iloc[-1]) if len(dff) else 1200
prev_bdi        = float(dff["BDI"].iloc[-8]) if len(dff) > 7 else latest_bdi
bdi_change      = latest_bdi - prev_bdi

# ════════════════════════════════════════════════════════════
# TAB LAYOUT
# ════════════════════════════════════════════════════════════
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📊 Overview",
    "📈 BDI & Freight Rates",
    "💰 Cost Calculator",
    "🤖 AI Forecast",
    "📦 India Trade Data"
])

# ─────────────────────────────────────────────────────────────
# TAB 1 — OVERVIEW
# ─────────────────────────────────────────────────────────────
with tab1:
    st.markdown('<div class="section-header">📊 Key Market Indicators — Today</div>', unsafe_allow_html=True)

    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("🌊 BDI (Today)",       f"{latest_bdi:.0f}",  f"{bdi_change:+.0f} pts (7d)")
    c2.metric("🛢️ Brent Crude",       f"${latest_brent:.1f}/bbl")
    c3.metric("💱 USD/INR",           f"₹{latest_usdinr:.2f}")
    c4.metric("⚓ Freight Rate",       f"${freight_per_mt:.2f}/MT", f"₹{freight_inr:.0f}/MT")
    c5.metric("🚢 Voyage Days",        f"{voyage_d} days",   f"{dist_nm:,} NM")

    st.markdown("---")
    col_a, col_b = st.columns([2, 1])

    with col_a:
        st.markdown('<div class="section-header">📈 BDI Historical Trend</div>', unsafe_allow_html=True)
        fig = px.line(dff, x="Date", y="BDI",
                      title="Baltic Dry Index (BDI) — 2015 to 2026",
                      color_discrete_sequence=["#2E86AB"])
        fig.add_hline(y=dff["BDI"].mean(), line_dash="dot", annotation_text="Average",
                      line_color="orange", annotation_position="bottom right")
        fig.update_layout(height=350, margin=dict(t=40,b=10))
        st.plotly_chart(fig, use_container_width=True)

    with col_b:
        st.markdown('<div class="section-header">🟢 Chartering Signal</div>', unsafe_allow_html=True)
        avg_bdi = dff["BDI"].mean()
        if latest_bdi < avg_bdi * 0.95:
            st.markdown('<div class="signal-buy">🟢 BUY NOW!<br><small>Rates below average</small></div>', unsafe_allow_html=True)
        elif latest_bdi < avg_bdi * 1.05:
            st.markdown('<div style="background:#fff3cd;color:#856404;padding:10px 20px;border-radius:8px;font-size:18px;font-weight:bold;text-align:center;">🟡 NEUTRAL<br><small>Rates near average</small></div>', unsafe_allow_html=True)
        else:
            st.markdown('<div class="signal-wait">🔴 WAIT!<br><small>Rates above average</small></div>', unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("**📌 Selected Route:**")
        st.info(f"**{origin}**\n\n➡️ **{port_name}**\n\n🚢 {vessel} | 📦 {commodity}")
        st.success(f"💰 **{freight_per_mt:.2f} USD/MT**\n\n₹ **{freight_inr:.0f} /MT**")

    st.markdown("---")
    st.markdown('<div class="section-header">🏭 Industry Stocks (NSE India)</div>', unsafe_allow_html=True)
    stock_cols = ["TataSteel_INR","JSWSteel_INR","SAIL_INR","NMDC_INR","CoalIndia_INR","AdaniPorts_INR"]
    avail_stk  = [c for c in stock_cols if c in dff.columns]
    if avail_stk:
        fig_stk = px.line(dff, x="Date", y=avail_stk,
                          title="India Steel & Port Stocks (NSE Closing Price — INR)",
                          labels={"value":"Price (INR)","variable":"Stock"})
        fig_stk.update_layout(height=300, margin=dict(t=40,b=10))
        st.plotly_chart(fig_stk, use_container_width=True)

# ─────────────────────────────────────────────────────────────
# TAB 2 — BDI & FREIGHT RATES
# ─────────────────────────────────────────────────────────────
with tab2:
    st.markdown('<div class="section-header">📈 Freight Rate Analysis</div>', unsafe_allow_html=True)

    c1, c2 = st.columns(2)
    with c1:
        fig = make_subplots(rows=2, cols=1, shared_xaxes=True,
                            subplot_titles=("BDI Index", "Vessel-Type Sub-Indices"),
                            vertical_spacing=0.08)
        fig.add_trace(go.Scatter(x=dff["Date"], y=dff["BDI"], name="BDI", line=dict(color="#1F4E79", width=2)), row=1, col=1)
        fig.add_trace(go.Scatter(x=dff["Date"], y=dff["BDI_7d_MA"], name="7d MA", line=dict(color="orange", dash="dot")), row=1, col=1)
        for col_n, color in [("Capesize_5TC","#E63946"),("Panamax_4TC","#2E86AB"),("Supramax_10TC","#57CC99"),("Handysize_7TC","#F4A261")]:
            if col_n in dff.columns:
                fig.add_trace(go.Scatter(x=dff["Date"], y=dff[col_n], name=col_n.replace("_"," "), line=dict(color=color)), row=2, col=1)
        fig.update_layout(height=500, margin=dict(t=30,b=10), showlegend=True)
        st.plotly_chart(fig, use_container_width=True)

    with c2:
        # Correlation Heatmap
        corr_cols = ["BDI","Capesize_5TC","Panamax_4TC","Brent_Crude_USD_bbl","USDINR","VIX"]
        avail_corr = [c for c in corr_cols if c in dff.columns]
        corr_mat   = dff[avail_corr].corr()
        fig_corr   = px.imshow(corr_mat, text_auto=".2f", color_continuous_scale="RdBu_r",
                               title="Correlation Matrix — BDI vs Market Factors")
        fig_corr.update_layout(height=350, margin=dict(t=40,b=10))
        st.plotly_chart(fig_corr, use_container_width=True)

        # Seasonal Pattern
        if "Month_Num" in dff.columns:
            month_names = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec"}
            seasonal = dff.groupby("Month_Num")["BDI"].mean().reset_index()
            seasonal["Month"] = seasonal["Month_Num"].map(month_names)
            fig_sea = px.bar(seasonal, x="Month", y="BDI",
                             title="📅 Average BDI by Month (Seasonal Pattern)",
                             color="BDI", color_continuous_scale="Blues")
            fig_sea.add_hline(y=seasonal["BDI"].mean(), line_dash="dot", line_color="red",
                              annotation_text="Avg", annotation_position="top right")
            fig_sea.update_layout(height=280, margin=dict(t=40,b=10))
            st.plotly_chart(fig_sea, use_container_width=True)

    # Commodity vs BDI
    st.markdown('<div class="section-header">🛢️ Commodity & Fuel Prices</div>', unsafe_allow_html=True)
    fuel_cols = ["Brent_Crude_USD_bbl","WTI_Crude_USD_bbl","NatGas_USD_mmbtu","HeatingOil_USD_gal"]
    avail_fuel = [c for c in fuel_cols if c in dff.columns]
    if avail_fuel:
        fig_f = px.line(dff, x="Date", y=avail_fuel,
                        title="Fuel & Commodity Prices — 2015 to 2026",
                        labels={"value":"Price","variable":"Commodity"})
        fig_f.update_layout(height=300, margin=dict(t=40,b=10))
        st.plotly_chart(fig_f, use_container_width=True)

# ─────────────────────────────────────────────────────────────
# TAB 3 — COST CALCULATOR
# ─────────────────────────────────────────────────────────────
with tab3:
    st.markdown('<div class="section-header">💰 Freight Cost Calculator — Detailed Breakdown</div>', unsafe_allow_html=True)

    c1, c2, c3 = st.columns(3)

    with c1:
        st.markdown("**🚢 Vessel Details**")
        st.dataframe(vessel_row[["Vessel_Type","Typical_DWT","LOA_m","Draft_Laden_m","Speed_kt","TC_Rate_USD_d"]].to_frame().T, use_container_width=True)

        st.markdown("**🗺️ Route Details**")
        if not route_row.empty:
            st.dataframe(route_row[["Load_Port","Discharge","Dist_NM","Voyage_Days","Commodity","Canal"]].reset_index(drop=True), use_container_width=True)

    with c2:
        st.markdown("**📊 Cost Breakdown**")
        cost_items = {
            "⛽ Fuel Cost (Bunker)": fuel_cost,
            "🚢 Vessel Hire (TC)":   hire_cost,
            "⚓ Port Dues":          port_cost,
        }
        for label, val in cost_items.items():
            st.metric(label, f"$ {val:,.0f}")

        st.markdown("---")
        st.metric("💰 Total Voyage Cost",    f"$ {total_voyage:,.0f}", help="Fuel + Hire + Port")
        st.metric("📦 Freight Rate/MT",      f"$ {freight_per_mt:.2f}/MT")
        st.metric("₹ Freight Rate (INR/MT)", f"₹ {freight_inr:,.0f}/MT")
        st.metric("📦 Total Cargo Bill",     f"$ {freight_per_mt * cargo_mt:,.0f}")

    with c3:
        # Pie chart
        fig_pie = px.pie(
            values=list(cost_items.values()),
            names=list(cost_items.keys()),
            title="Cost Component Breakdown",
            color_discrete_sequence=["#1F4E79","#2E86AB","#A8DADC"]
        )
        fig_pie.update_layout(height=300, margin=dict(t=40,b=10))
        st.plotly_chart(fig_pie, use_container_width=True)

    # Route Comparison Table
    st.markdown('<div class="section-header">🗺️ All Routes Comparison</div>', unsafe_allow_html=True)
    st.dataframe(routes, use_container_width=True, height=300)

    st.markdown('<div class="section-header">⚓ East Coast India Ports Reference</div>', unsafe_allow_html=True)
    st.dataframe(ports, use_container_width=True, height=280)

# ─────────────────────────────────────────────────────────────
# TAB 4 — AI FORECAST
# ─────────────────────────────────────────────────────────────
with tab4:
    st.markdown('<div class="section-header">🤖 AI-Powered BDI Forecast (XGBoost Model)</div>', unsafe_allow_html=True)

    @st.cache_data
    def train_model(df_train):
        d = df_train.copy()
        d["lag7"]   = d["BDI"].shift(7)
        d["lag14"]  = d["BDI"].shift(14)
        d["lag30"]  = d["BDI"].shift(30)
        d["ma7"]    = d["BDI"].rolling(7).mean()
        d["ma30"]   = d["BDI"].rolling(30).mean()
        d["roc7"]   = d["BDI"].pct_change(7)
        d["target"] = d["BDI"].shift(-30)
        feat_cols = ["lag7","lag14","lag30","ma7","ma30","roc7","Month_Num","Monsoon_Flag","Quarter"]
        if "Brent_Crude_USD_bbl" in d.columns:
            d["brent"] = d["Brent_Crude_USD_bbl"]
            feat_cols.append("brent")
        if "USDINR" in d.columns:
            d["usdinr"] = d["USDINR"]
            feat_cols.append("usdinr")
        d.dropna(inplace=True)
        X = d[feat_cols]
        y = d["target"]
        split = int(len(X) * 0.8)
        X_tr, X_te = X[:split], X[split:]
        y_tr, y_te = y[:split], y[split:]
        model = XGBRegressor(n_estimators=300, learning_rate=0.05, max_depth=5, random_state=42)
        model.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)
        y_pred = model.predict(X_te)
        mae = mean_absolute_error(y_te, y_pred)
        r2  = r2_score(y_te, y_pred)
        return model, feat_cols, mae, r2, y_te, y_pred, d

    with st.spinner("🤖 Training XGBoost model on historical BDI data..."):
        model, feat_cols, mae, r2, y_te, y_pred, d_feat = train_model(df.copy())

    # Model metrics
    cm1, cm2, cm3, cm4 = st.columns(4)
    cm1.metric("🎯 MAE (Error)",         f"{mae:.1f} pts")
    cm2.metric("📊 R² Score",            f"{r2:.3f}")
    cm3.metric("🔮 Prediction Horizon",  f"{forecast_days} days")
    cm4.metric("📅 Training Data",       f"{len(d_feat):,} days")

    st.markdown("---")
    c1, c2 = st.columns([2, 1])

    with c1:
        # Actual vs Predicted
        test_dates = df.iloc[int(len(df)*0.8):int(len(df)*0.8)+len(y_te)]["Date"]
        fig_pred = go.Figure()
        fig_pred.add_trace(go.Scatter(x=test_dates, y=list(y_te), name="Actual BDI",     line=dict(color="#1F4E79", width=2)))
        fig_pred.add_trace(go.Scatter(x=test_dates, y=list(y_pred), name="Predicted BDI", line=dict(color="#E63946", dash="dot", width=2)))
        fig_pred.update_layout(title="Actual vs Predicted BDI (Test Set)", height=350, margin=dict(t=40,b=10))
        st.plotly_chart(fig_pred, use_container_width=True)

    with c2:
        # Feature Importance
        feat_imp = pd.DataFrame({"Feature": feat_cols, "Importance": model.feature_importances_})
        feat_imp = feat_imp.sort_values("Importance", ascending=True)
        fig_imp = px.bar(feat_imp, x="Importance", y="Feature", orientation="h",
                         title="Feature Importance", color="Importance",
                         color_continuous_scale="Blues")
        fig_imp.update_layout(height=350, margin=dict(t=40,b=10), showlegend=False)
        st.plotly_chart(fig_imp, use_container_width=True)

    # Future Forecast
    st.markdown('<div class="section-header">🔮 Future BDI Forecast</div>', unsafe_allow_html=True)
    last_row = d_feat[feat_cols].dropna().iloc[-1:].copy()
    future_preds = []
    for i in range(forecast_days // 7):
        p = float(model.predict(last_row)[0])
        future_preds.append(p)
    future_dates = pd.date_range(df["Date"].max(), periods=len(future_preds)+1, freq="7D")[1:]
    hist_last60  = dff.tail(60)

    fig_fut = go.Figure()
    fig_fut.add_trace(go.Scatter(x=hist_last60["Date"], y=hist_last60["BDI"],  name="Historical BDI", line=dict(color="#1F4E79", width=2)))
    fig_fut.add_trace(go.Scatter(x=future_dates,        y=future_preds,        name="Forecast",       line=dict(color="#E63946", dash="dash", width=2)))
    fig_fut.add_vrect(x0=str(df["Date"].max().date()), x1=str(future_dates[-1].date()),
                      fillcolor="lightyellow", opacity=0.3, annotation_text="Forecast Zone")
    fig_fut.update_layout(title=f"BDI Forecast — Next {forecast_days} Days", height=350, margin=dict(t=40,b=10))
    st.plotly_chart(fig_fut, use_container_width=True)

    pred_bdi = np.mean(future_preds)
    if pred_bdi < latest_bdi * 0.95:
        st.success(f"🟢 **MODEL SAYS: WAIT to Charter** — BDI expected to fall to ~{pred_bdi:.0f} pts. Better rates coming!")
    elif pred_bdi > latest_bdi * 1.05:
        st.error(f"🔴 **MODEL SAYS: CHARTER NOW!** — BDI expected to rise to ~{pred_bdi:.0f} pts. Lock in current rates!")
    else:
        st.info(f"🟡 **NEUTRAL** — BDI expected around {pred_bdi:.0f} pts. Monitor closely.")

# ─────────────────────────────────────────────────────────────
# TAB 5 — INDIA TRADE DATA
# ─────────────────────────────────────────────────────────────
with tab5:
    st.markdown('<div class="section-header">📦 India Bulk Cargo Import Statistics</div>', unsafe_allow_html=True)
    imp_data = pd.read_excel("Freight_Forecasting_Dataset.xlsx", sheet_name="8_India_Import_Stats", skiprows=3, parse_dates=["Month"])

    c1, c2 = st.columns(2)
    with c1:
        fig_imp = px.line(imp_data, x="Month",
                          y=["ThermalCoal_MT","CokingCoal_MT","IronOre_MT","Fertilizers_MT"],
                          title="India Monthly Bulk Imports (Million MT)",
                          labels={"value":"Million MT","variable":"Commodity"})
        fig_imp.update_layout(height=350, margin=dict(t=40,b=10))
        st.plotly_chart(fig_imp, use_container_width=True)

    with c2:
        imp_yearly = imp_data.groupby("Year")[["ThermalCoal_MT","CokingCoal_MT","IronOre_MT","Fertilizers_MT"]].sum().reset_index()
        fig_yr = px.bar(imp_yearly, x="Year",
                        y=["ThermalCoal_MT","CokingCoal_MT","IronOre_MT","Fertilizers_MT"],
                        title="Annual India Bulk Imports (Stacked, Million MT)",
                        barmode="stack", color_discrete_sequence=["#1F4E79","#2E86AB","#57CC99","#F4A261"])
        fig_yr.update_layout(height=350, margin=dict(t=40,b=10))
        st.plotly_chart(fig_yr, use_container_width=True)

    c3, c4 = st.columns(2)
    with c3:
        fig_ec = px.line(imp_data, x="Month", y="EastCoast_Pct",
                         title="East Coast India Share of Total Imports (%)",
                         color_discrete_sequence=["#E63946"])
        fig_ec.add_hline(y=imp_data["EastCoast_Pct"].mean(), line_dash="dot",
                         annotation_text=f"Avg {imp_data['EastCoast_Pct'].mean():.1f}%")
        fig_ec.update_layout(height=280, margin=dict(t=40,b=10))
        st.plotly_chart(fig_ec, use_container_width=True)

    with c4:
        fig_cfr = px.line(imp_data, x="Month", y=["CFR_Coal_USD","CFR_IronOre","CFR_Fert_USD"],
                          title="CFR Import Prices (USD/MT)",
                          labels={"value":"USD/MT","variable":"Commodity"})
        fig_cfr.update_layout(height=280, margin=dict(t=40,b=10))
        st.plotly_chart(fig_cfr, use_container_width=True)

    st.markdown('<div class="section-header">📋 Raw Import Data</div>', unsafe_allow_html=True)
    st.dataframe(imp_data, use_container_width=True, height=280)

# ── FOOTER ───────────────────────────────────────────────────
st.markdown("---")
st.markdown("""
<div style="text-align:center; color:#888; font-size:13px; padding:10px;">
    🚢 <b>Intelligent Freight Forecasting Model</b> &nbsp;|&nbsp; Overseas → East Coast India
    &nbsp;|&nbsp; Data: Baltic Exchange, Yahoo Finance, NSE, DGCI&S
    &nbsp;|&nbsp; Model: XGBoost
</div>
""", unsafe_allow_html=True)
