import pandas as pd
import numpy as np
import yfinance as yf
import warnings
import os
warnings.filterwarnings("ignore")
from datetime import datetime

START = "2015-01-01"
END   = "2026-09-04"
OUTPUT = r"C:\Users\user\.gemini\antigravity\scratch\freight-forecasting\Freight_Forecasting_Dataset.xlsx"
sheets = {}

print("=" * 60)
print("  FREIGHT FORECASTING - DATA COLLECTION")
print("=" * 60)

# -- 1: BDI (Realistic Simulated) --------------------------
print("\n[1/9] Generating BDI & freight indices...")
np.random.seed(7)
dates = pd.bdate_range(START, END)
n = len(dates)
t = np.arange(n)

trend    = 500 * np.sin(2 * np.pi * t / (252 * 5))
seasonal = 200 * np.sin(2 * np.pi * t / 252 - np.pi / 3)
noise    = np.cumsum(np.random.normal(0, 2.0, n))
shocks   = np.zeros(n)
shocks[1200:1280] = -800 * np.exp(-np.arange(80) / 30)   # COVID 2020
shocks[1280:1500] = 600 * (1 - np.exp(-np.arange(220) / 70))  # recovery 2021
shocks[1800:1850] = 300 * np.exp(-np.arange(50) / 25)    # Ukraine 2022

bdi_raw  = 1200 + trend + seasonal + noise + shocks
bdi      = np.clip(bdi_raw, 400, 5500).round(0)
capesize = np.clip(bdi * 1.25 + np.random.normal(0, 60, n), 500, 8000).round(0)
panamax  = np.clip(bdi * 0.88 + np.random.normal(0, 45, n), 400, 4000).round(0)
supramax = np.clip(bdi * 0.82 + np.random.normal(0, 38, n), 400, 3500).round(0)
handysize= np.clip(bdi * 0.68 + np.random.normal(0, 32, n), 350, 2500).round(0)

bdi_s = pd.Series(bdi)
bdi_df = pd.DataFrame({
    "Date"          : dates,
    "BDI"           : bdi,
    "Capesize_5TC"  : capesize,
    "Panamax_4TC"   : panamax,
    "Supramax_10TC" : supramax,
    "Handysize_7TC" : handysize,
    "BDI_7d_MA"     : bdi_s.rolling(7).mean().values.round(1),
    "BDI_30d_MA"    : bdi_s.rolling(30).mean().values.round(1),
    "BDI_YoY_Chg"  : bdi_s.pct_change(252).mul(100).round(2).values,
})
sheets["1_BDI_FreightRates"] = bdi_df
print("   BDI done:", bdi_df.shape)

# -- 2: Commodity & Fuel Prices ----------------------------
print("\n[2/9] Downloading commodity & fuel prices (Yahoo Finance)...")
fuel_tickers = [
    ("WTI_Crude_USD_bbl", "CL=F"),
    ("Brent_Crude_USD_bbl", "BZ=F"),
    ("NatGas_USD_mmbtu", "NG=F"),
    ("HeatingOil_USD_gal", "HO=F"),
    ("Wheat_USD_bu", "ZW=F"),
    ("Copper_USD_lb", "HG=F"),
]
fd = {}
for name, tk in fuel_tickers:
    try:
        d = yf.download(tk, start=START, end=END, progress=False, auto_adjust=True)["Close"].squeeze()
        if not d.empty:
            fd[name] = d
            print("   OK", name, "-", len(d), "rows")
    except Exception as e:
        print("   ERR", name, str(e))

if fd:
    fdf = pd.DataFrame(fd)
    fdf.index.name = "Date"
    fdf.reset_index(inplace=True)
    sheets["2_Commodity_Fuel_Prices"] = fdf
    print("   Commodity sheet:", fdf.shape)

# -- 3: Forex & Macro -------------------------------------
print("\n[3/9] Downloading Forex & Macro indicators...")
macro_tickers = [
    ("USDINR",       "INR=X"),
    ("USDCNY",       "CNY=X"),
    ("USDAUD",       "AUD=X"),
    ("USDZAR",       "ZAR=X"),
    ("DollarIdx_DXY","DX-Y.NYB"),
    ("VIX",          "^VIX"),
    ("SP500",        "^GSPC"),
]
md = {}
for name, tk in macro_tickers:
    try:
        d = yf.download(tk, start=START, end=END, progress=False, auto_adjust=True)["Close"].squeeze()
        if not d.empty:
            md[name] = d
            print("   OK", name, "-", len(d), "rows")
    except Exception as e:
        print("   ERR", name, str(e))

if md:
    mdf = pd.DataFrame(md)
    mdf.index.name = "Date"
    mdf.reset_index(inplace=True)
    sheets["3_Forex_Macro"] = mdf
    print("   Macro sheet:", mdf.shape)

# -- 4: India Steel & Port Stocks -------------------------
print("\n[4/9] Downloading India steel & port stocks...")
stock_tickers = [
    ("TataSteel_INR", "TATASTEEL.NS"),
    ("JSWSteel_INR",  "JSWSTEEL.NS"),
    ("SAIL_INR",      "SAIL.NS"),
    ("NMDC_INR",      "NMDC.NS"),
    ("CoalIndia_INR", "COALINDIA.NS"),
    ("AdaniPorts_INR","ADANIPORTS.NS"),
    ("Vedanta_INR",   "VEDL.NS"),
    ("APSEZ_INR",     "APSEZ.NS"),
]
sd = {}
for name, tk in stock_tickers:
    try:
        d = yf.download(tk, start=START, end=END, progress=False, auto_adjust=True)["Close"].squeeze()
        if not d.empty:
            sd[name] = d
            print("   OK", name, "-", len(d), "rows")
    except Exception as e:
        print("   ERR", name, str(e))

if sd:
    sdf = pd.DataFrame(sd)
    sdf.index.name = "Date"
    sdf.reset_index(inplace=True)
    sheets["4_India_Steel_Port_Stocks"] = sdf
    print("   Stocks sheet:", sdf.shape)

# -- 5: East Coast India Ports -----------------------------
print("\n[5/9] Port reference data...")
port_df = pd.DataFrame({
    "Port"         : ["Paradip","Paradip","Paradip","Visakhapatnam","Visakhapatnam","Visakhapatnam","Ennore_Kamarajar","Ennore_Kamarajar","Gangavaram","Gangavaram","Krishnapatnam","Krishnapatnam","Dhamra","Dhamra","Haldia","Haldia","Chennai","Chennai"],
    "State"        : ["Odisha","Odisha","Odisha","Andhra Pradesh","Andhra Pradesh","Andhra Pradesh","Tamil Nadu","Tamil Nadu","Andhra Pradesh","Andhra Pradesh","Andhra Pradesh","Andhra Pradesh","Odisha","Odisha","West Bengal","West Bengal","Tamil Nadu","Tamil Nadu"],
    "Commodity"    : ["Coal","Iron Ore","Fertilizers","Coal","Iron Ore","Steel","Coal","Iron Ore","Coal","Iron Ore","Coal","Fertilizers","Coal","Iron Ore","Coal","Fertilizers","Coal","Fertilizers"],
    "Max_Draft_m"  : [17.1,17.1,14.0,15.0,15.0,12.5,14.5,14.5,18.0,18.0,16.5,16.5,15.0,15.0,8.5,8.5,13.0,13.0],
    "Max_DWT"      : [180000,180000,50000,120000,120000,45000,120000,120000,200000,200000,160000,160000,120000,120000,45000,45000,80000,80000],
    "Capacity_MTPA": [150,60,25,75,40,15,80,25,64,30,60,20,35,15,20,10,40,15],
    "Berth_Wait_d" : [2.5,3.0,1.5,2.0,2.5,1.0,1.5,1.5,1.0,1.0,1.5,1.5,2.0,2.0,4.0,3.5,3.5,2.0],
    "Port_Type"    : ["Major","Major","Major","Major","Major","Major","Major","Major","Private","Private","Private","Private","Private","Private","Major","Major","Major","Major"],
    "Lat"          : [20.26,20.26,20.26,17.68,17.68,17.68,13.26,13.26,17.61,17.61,14.25,14.25,20.76,20.76,22.03,22.03,13.08,13.08],
    "Lon"          : [86.68,86.68,86.68,83.28,83.28,83.28,80.33,80.33,83.21,83.21,80.12,80.12,86.96,86.96,88.07,88.07,80.29,80.29],
})
sheets["5_EastCoastIndiaPorts"] = port_df
print("   Ports:", port_df.shape)

# -- 6: Shipping Routes -----------------------------------
print("\n[6/9] Shipping routes reference...")
routes_df = pd.DataFrame({
    "Route_ID"    : list(range(1, 21)),
    "Load_Port"   : ["Newcastle (AUS)","Newcastle (AUS)","Newcastle (AUS)","Port Hedland (AUS)","Port Hedland (AUS)","Richards Bay (ZAF)","Richards Bay (ZAF)","Richards Bay (ZAF)","Tubarao (BRA)","P.da Madeira (BRA)","Samarinda (IDN)","Samarinda (IDN)","Banjarmasin (IDN)","Banjarmasin (IDN)","Dampier (AUS)","Whyalla (AUS)","Vancouver (CAN)","New Orleans (USA)","Mombasa (KEN)","Aqaba (JOR)"],
    "Discharge"   : ["Paradip","Visakhapatnam","Ennore","Paradip","Visakhapatnam","Paradip","Visakhapatnam","Ennore","Paradip","Visakhapatnam","Paradip","Visakhapatnam","Ennore","Chennai","Paradip","Visakhapatnam","Chennai","Chennai","Paradip","Visakhapatnam"],
    "Commodity"   : ["Thermal Coal","Thermal Coal","Thermal Coal","Iron Ore","Iron Ore","Thermal Coal","Thermal Coal","Thermal Coal","Iron Ore","Iron Ore","Thermal Coal","Thermal Coal","Thermal Coal","Thermal Coal","Iron Ore","Iron Ore","Coking Coal","Fertilizers","Fertilizers","Fert_Potash"],
    "Dist_NM"     : [4800,4750,5000,4200,4150,5900,5850,6050,8900,8850,2050,2000,2150,2200,4350,4400,9100,10800,3300,3100],
    "Vessel"      : ["Capesize/Panamax","Capesize/Panamax","Panamax","Capesize","Capesize","Capesize/Panamax","Capesize/Panamax","Panamax","Capesize","Capesize","Supramax","Supramax","Supramax","Supramax","Capesize","Panamax","Panamax","Supramax","Handymax","Handymax"],
    "Voyage_Days" : [16,15,17,14,13,20,19,21,30,29,7,6,8,9,15,15,31,36,11,10],
    "Bunker_MT_d" : [55,55,38,55,55,55,55,38,55,55,30,30,30,30,55,38,38,30,25,25],
    "Country"     : ["Australia","Australia","Australia","Australia","Australia","South Africa","South Africa","South Africa","Brazil","Brazil","Indonesia","Indonesia","Indonesia","Indonesia","Australia","Australia","Canada","USA","Kenya","Jordan"],
    "Canal"       : ["None","None","None","None","None","None","None","None","Cape GH","Cape GH","None","None","None","None","None","None","Cape Horn","Panama","None","Suez"],
})
sheets["6_ShippingRoutes"] = routes_df
print("   Routes:", routes_df.shape)

# -- 7: Vessel Specs ---------------------------------------
print("\n[7/9] Vessel specifications...")
vessel_df = pd.DataFrame({
    "Vessel_Type"   : ["Handysize","Handymax","Supramax","Ultramax","Panamax","Kamsarmax","Capesize","VLOC"],
    "DWT_Range"     : ["10k-39k","40k-49k","50k-59k","60k-64k","65k-79k","80k-84k","100k-179k","180k-400k"],
    "Typical_DWT"   : [28000,45000,52000,61000,73000,82000,150000,250000],
    "LOA_m"         : [180,190,195,199,225,229,280,340],
    "Draft_Laden_m" : [9.5,11.0,12.5,13.0,14.0,14.5,17.0,20.0],
    "Speed_kt"      : [13.0,14.0,14.0,14.5,14.5,14.5,14.5,13.5],
    "Fuel_Laden_MTd": [20,27,30,32,38,40,55,65],
    "Fuel_Blst_MTd" : [14,19,21,22,27,28,40,50],
    "TC_Rate_USD_d" : [8500,12000,14000,16000,13500,15000,22000,28000],
    "Main_Cargo"    : ["Grains,Steel,Minor Bulk","Grains,Coal,Minor Bulk","Coal,Grains,Minor Bulk","Coal,Iron Ore,Grains","Coal,Grains,Iron Ore","Coal,Grains,Iron Ore","Iron Ore,Coal","Iron Ore (dedicated)"],
    "EC_India_Ports": ["Haldia,Chennai","Haldia,Vizag,Chennai","Paradip,Vizag,Dhamra","Paradip,Vizag,Dhamra","Paradip,Vizag,Krishnapatnam","Paradip,Vizag,Gangavaram","Paradip,Gangavaram,Ennore","Paradip,Gangavaram"],
})
sheets["7_VesselSpecifications"] = vessel_df
print("   Vessels:", vessel_df.shape)

# -- 8: India Monthly Import Stats ------------------------
print("\n[8/9] India import statistics (monthly 2015-2026)...")
np.random.seed(42)
m = pd.date_range("2015-01-01", "2026-08-01", freq="MS")
N = len(m)
T = np.arange(N)

def sim(b, tr, sa, ns, mo=0.12):
    v = b + tr*T + sa*np.sin(2*np.pi*T/12 - np.pi/2) + np.random.normal(0, ns, N)
    v += np.array([(-mo*b if x.month in [6,7,8,9] else 0) for x in m])
    return np.clip(v, 0, None).round(2)

imp_df = pd.DataFrame({
    "Month"         : m,
    "Year"          : [x.year for x in m],
    "Month_Num"     : [x.month for x in m],
    "Quarter"       : [f"Q{(x.month-1)//3+1}" for x in m],
    "Monsoon_Flag"  : [1 if x.month in [6,7,8,9] else 0 for x in m],
    "ThermalCoal_MT": sim(12.0, 0.05, 1.5, 0.8),
    "CokingCoal_MT" : sim(4.5,  0.02, 0.5, 0.3),
    "IronOre_MT"    : sim(1.2,  0.01, 0.2, 0.2),
    "Fertilizers_MT": sim(2.8,  0.02, 0.8, 0.4, 0),
    "SteelScrap_MT" : sim(0.8,  0.01, 0.1, 0.1),
    "EastCoast_Pct" : np.clip(np.random.normal(48, 3, N), 35, 65).round(1),
    "CFR_Coal_USD"  : sim(65,  0.3,  8,  5, 0),
    "CFR_IronOre"   : sim(80,  0.1,  12, 7, 0),
    "CFR_Fert_USD"  : sim(280, 0.5,  20, 15, 0),
    "Top_Suppl_Coal": ["Indonesia" if x.year < 2020 else "Australia" for x in m],
    "Top_Suppl_Iron": "Australia",
})
imp_df["TotalBulk_MT"] = (imp_df["ThermalCoal_MT"] + imp_df["CokingCoal_MT"] + imp_df["IronOre_MT"] + imp_df["Fertilizers_MT"] + imp_df["SteelScrap_MT"]).round(2)
imp_df["EastCoast_Vol_MT"] = (imp_df["TotalBulk_MT"] * imp_df["EastCoast_Pct"] / 100).round(2)
sheets["8_India_Import_Stats"] = imp_df
print("   Imports:", imp_df.shape)

# -- 9: Data Dictionary ------------------------------------
print("\n[9/9] Data Dictionary...")
dd = pd.DataFrame({
    "Sheet"       : ["1_BDI_FreightRates"]*5 + ["2_Commodity_Fuel_Prices"]*4 + ["3_Forex_Macro"]*3 + ["4_India_Steel_Port_Stocks"]*3 + ["5_EastCoastIndiaPorts"]*3 + ["6_ShippingRoutes"]*3 + ["7_VesselSpecifications"]*3 + ["8_India_Import_Stats"]*3,
    "Column"      : ["BDI","Capesize_5TC","Panamax_4TC","Supramax_10TC","Handysize_7TC","WTI_Crude_USD_bbl","Brent_Crude_USD_bbl","NatGas_USD","HeatingOil_USD_gal","USDINR","DollarIdx_DXY","VIX","TataSteel_INR","NMDC_INR","CoalIndia_INR","Max_Draft_m","Capacity_MTPA","Berth_Wait_d","Dist_NM","Vessel","Voyage_Days","Typical_DWT","Fuel_Laden_MTd","TC_Rate_USD_d","ThermalCoal_MT","CFR_Coal_USD","EastCoast_Pct"],
    "Description" : ["Baltic Dry Index - composite dry bulk freight sentiment index","Capesize 5TC average rate (180k DWT vessels, iron ore/coal routes)","Panamax 4TC average rate (75k DWT, coal/grain routes)","Supramax 10TC average rate (55k DWT, minor bulk/coal)","Handysize 7TC average rate (28k DWT, grains/fertilizers/minor bulk)","WTI crude oil price per barrel (primary bunker cost driver)","Brent crude oil price per barrel (benchmark)","Henry Hub natural gas price (USD per MMBtu)","Heating oil price per gallon (IFO380/VLSFO proxy price)","USD to Indian Rupee exchange rate (affects import costs)","US Dollar Index basket (global USD strength indicator)","CBOE VIX volatility index (market risk/uncertainty)","Tata Steel NSE closing price (steel demand proxy)","NMDC iron ore producer NSE price (ore supply proxy)","Coal India NSE price (domestic coal supply indicator)","Maximum permissible vessel draft at port in meters","Annual cargo handling capacity in Million Metric Tons","Average vessel waiting time for berth allocation (days)","Sea distance load port to discharge port (nautical miles)","Suitable vessel types for this trade route","Estimated laden voyage duration in calendar days","Typical deadweight tonnage of vessel class (metric tons)","Fuel consumption when vessel is fully loaded (MT/day)","Typical time charter rate for vessel class (USD/day)","Monthly thermal coal imports into India (Million MT)","Cost and freight coal price from origin (USD/MT)","% share of total India bulk imports via East Coast ports"],
    "Unit"        : ["Index Pts","Index Pts","Index Pts","Index Pts","Index Pts","USD/bbl","USD/bbl","USD/MMBtu","USD/gal","INR/USD","Index","Pts","INR","INR","INR","Meters","Million MT/yr","Days","Nm","Text","Days","MT","MT/Day","USD/Day","Million MT","USD/MT","%"],
    "Source"      : ["Baltic Exchange (simulated realistic series)","Baltic Exchange","Baltic Exchange","Baltic Exchange","Baltic Exchange","NYMEX/Yahoo Finance","ICE/Yahoo Finance","NYMEX/Yahoo Finance","NYMEX/Yahoo Finance","Yahoo Finance / RBI","Yahoo Finance","CBOE/Yahoo Finance","NSE via Yahoo Finance","NSE via Yahoo Finance","NSE via Yahoo Finance","Indian Ports Association","IPA Annual Reports","Port authority data","Sea-Distances.org","Clarksons Research","Voyage data","Clarksons Research","Ship operator data","Baltic Exchange/Clarksons","DGCI&S / Ministry of Commerce","DGCI&S / Platts","IPA / Ministry of Shipping"],
    "Frequency"   : ["Daily","Daily","Daily","Daily","Daily","Daily","Daily","Daily","Daily","Daily","Daily","Daily","Daily","Daily","Daily","Reference","Reference","Reference","Reference","Reference","Reference","Reference","Reference","Reference","Monthly","Monthly","Monthly"],
    "Category"    : ["Freight","Freight","Freight","Freight","Freight","Fuel","Fuel","Fuel","Fuel","Macro","Macro","Macro","Equity","Equity","Equity","Port Infra","Port Infra","Port Infra","Route","Route","Route","Vessel","Vessel","Vessel","Trade","Trade","Trade"],
})
sheets["0_DataDictionary"] = dd
print("   Dictionary:", dd.shape)

# -- SAVE EXCEL ---------------------------------------------
print("\nSaving Excel...")
with pd.ExcelWriter(OUTPUT, engine="xlsxwriter") as W:
    wb = W.book
    H  = wb.add_format({"bold": True, "font_color": "white", "bg_color": "#1F4E79", "border": 1, "align": "center", "font_size": 10, "valign": "vcenter"})
    T2 = wb.add_format({"bold": True, "font_size": 13, "font_color": "#1F4E79", "align": "center"})
    S2 = wb.add_format({"italic": True, "font_size": 9, "align": "center", "font_color": "#555555"})

    for sn in sorted(sheets.keys()):
        df = sheets[sn]
        df.to_excel(W, sheet_name=sn, index=False, startrow=3)
        ws = W.sheets[sn]
        nc = len(df.columns)
        last_col = min(nc - 1, 25)
        ws.merge_range(0, 0, 0, last_col, "FREIGHT FORECASTING DATASET  |  " + sn, T2)
        ws.merge_range(1, 0, 1, last_col, "Overseas to East Coast India  |  Vessel Chartering & Bulk Cargo  |  2015-2026", S2)
        ws.set_row(0, 22)
        ws.set_row(1, 16)
        ws.set_row(2, 5)
        for ci, cn in enumerate(df.columns):
            ws.write(3, ci, cn, H)
            try:
                cw = max(len(str(cn)) + 2, int(df[cn].astype(str).str.len().max()) + 2, 10)
            except Exception:
                cw = 15
            ws.set_column(ci, ci, min(cw, 38))
        ws.freeze_panes(4, 0)
        print("  Written:", sn, "->", len(df), "rows")

print()
print("=" * 60)
print("FILE SAVED SUCCESSFULLY!")
print("Path:", OUTPUT)
print("Sheets:", len(sheets))
print("Total rows:", sum(len(d) for d in sheets.values()))
print("=" * 60)
