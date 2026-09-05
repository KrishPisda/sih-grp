"""
Ingest real historical data into SQLite freight_database.db:
1. Baltic Dry Index (BDI) from CSV
2. Paradip, Haldia, Singapore VLSFO bunker fuel prices from PDF
3. Vessel specifications
4. East Coast India routes and Port parameters
"""
import sqlite3
import pandas as pd
import pypdf
import os
import re

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "freight_database.db")
BDI_CSV_PATH = r"C:\Users\user\OneDrive\Documents\Baltic Dry Index Historical Data (2).csv"
VLSFO_PDF_PATH = r"C:\Users\user\Downloads\Paradip_Haldia_VLSFO_Price_Data.pdf"

def ingest_bdi(conn):
    print("Ingesting Baltic Dry Index (BDI) CSV...")
    df = pd.read_csv(BDI_CSV_PATH)
    
    # Clean up columns
    # Format: Date (MM/DD/YYYY), Price, Open, High, Low, Vol., Change %
    df['date_obj'] = pd.to_datetime(df['Date'], format='%m/%d/%Y')
    df = df.sort_values('date_obj').reset_index(drop=True)
    
    for col in ['Price', 'Open', 'High', 'Low']:
        df[col] = df[col].astype(str).str.replace(',', '').str.strip().astype(float)
    
    df['change_pct_clean'] = df['Change %'].astype(str).str.replace('%', '').str.strip().astype(float)
    df['date_iso'] = df['date_obj'].dt.strftime('%Y-%m-%d')
    df['year_month'] = df['date_obj'].dt.strftime('%Y-%m')
    
    # Calculate rolling monthly stats
    df['rolling_3m_avg'] = df['Price'].rolling(window=63, min_periods=1).mean()
    df['rolling_6m_avg'] = df['Price'].rolling(window=126, min_periods=1).mean()
    df['rolling_volatility'] = df['change_pct_clean'].rolling(window=21, min_periods=1).std()
    
    # Mark month ends
    month_ends = df.groupby('year_month')['date_iso'].max().values
    df['is_month_end'] = df['date_iso'].apply(lambda x: 1 if x in month_ends else 0)
    
    cur = conn.cursor()
    cur.execute("DELETE FROM bdi_history;")
    
    inserted = 0
    for _, row in df.iterrows():
        cur.execute("""
        INSERT INTO bdi_history (date, price, open, high, low, change_pct, year_month, is_month_end, rolling_3m_avg, rolling_6m_avg, monthly_volatility, data_source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REAL HISTORICAL')
        """, (
            row['date_iso'], row['Price'], row['Open'], row['High'], row['Low'],
            row['change_pct_clean'], row['year_month'], int(row['is_month_end']),
            round(float(row['rolling_3m_avg']), 2), round(float(row['rolling_6m_avg']), 2),
            round(float(row['rolling_volatility']), 2) if not pd.isna(row['rolling_volatility']) else 0.0
        ))
        inserted += 1
    
    conn.commit()
    print(f"-> Successfully inserted {inserted} real BDI trading day records into bdi_history.")

def ingest_vlsfo(conn):
    print("Ingesting Paradip & Haldia VLSFO from PDF...")
    reader = pypdf.PdfReader(VLSFO_PDF_PATH)
    page_text = reader.pages[0].extract_text()
    
    # Regex parse monthly rows: Jan-2023 728.00 732.50 660.00 +68.00
    # Month pattern: (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(2023|2024)
    pattern = re.compile(r"([A-Za-z]{3}-\d{4})\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+\+?([\d\.]+)")
    matches = pattern.findall(page_text)
    
    cur = conn.cursor()
    cur.execute("DELETE FROM vlsfo_history;")
    
    inserted = 0
    for match in matches:
        month_raw, paradip, haldia, singapore, spread = match
        # Convert Jan-2023 to 2023-01
        dt = pd.to_datetime(month_raw, format='%b-%Y')
        month_iso = dt.strftime('%Y-%m')
        
        cur.execute("""
        INSERT INTO vlsfo_history (month_year, paradip_vlsfo, haldia_vlsfo, singapore_vlsfo, spread_over_singapore, data_source)
        VALUES (?, ?, ?, ?, ?, 'REAL HISTORICAL')
        """, (
            month_iso, float(paradip), float(haldia), float(singapore), float(spread)
        ))
        inserted += 1
    
    conn.commit()
    print(f"-> Successfully inserted {inserted} real monthly VLSFO records into vlsfo_history.")

def ingest_benchmarks(conn):
    print("Ingesting vessel, route, and port master benchmarks...")
    cur = conn.cursor()
    
    # 1. Vessels
    cur.execute("DELETE FROM vessels;")
    vessels_data = [
        ("V-CAPE-01", "Capesize Bulker Standard", "Capesize", 180000, 18.2, 12.0, 42.0, 32.0, 3.5, 26500.0, "Active"),
        ("V-PMAX-01", "Panamax / Kamsarmax Standard", "Panamax", 82000, 14.5, 12.5, 26.0, 21.0, 2.5, 17200.0, "Active"),
        ("V-SMAX-01", "Supramax / Ultramax Standard", "Supramax", 64000, 13.3, 13.0, 22.0, 17.5, 2.0, 14500.0, "Active"),
        ("V-HANDY-01", "Handysize Bulker Standard", "Handysize", 38000, 10.5, 12.0, 16.0, 13.0, 1.8, 11800.0, "Active")
    ]
    cur.executemany("""
    INSERT INTO vessels (vessel_id, name, vessel_class, dwt, max_draft, design_speed_knots, laden_fuel_mt_day, ballast_fuel_mt_day, port_fuel_mt_day, base_tce_rate_day, current_status, data_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REALISTIC MARITIME SPEC')
    """, vessels_data)

    # 2. Routes (Australian & Asian Coal corridor to Paradip / Vizag)
    cur.execute("DELETE FROM routes;")
    routes_data = [
        ("RT-HEDLAND-PARADIP", "Port Hedland", "Australia", "Paradip", "India", 3360.0, "Lombok / Open Ocean", 0.0, 11.7, 0.22),
        ("RT-HAYPOINT-PARADIP", "Hay Point / Gladstone", "Australia", "Paradip", "India", 4520.0, "Torres Strait / Open Ocean", 15000.0, 15.7, 0.30),
        ("RT-NEWCASTLE-PARADIP", "Newcastle", "Australia", "Paradip", "India", 4850.0, "Bass Strait / Open Ocean", 0.0, 16.8, 0.35),
        ("RT-TABONEO-PARADIP", "Taboneo / Kalimantan", "Indonesia", "Paradip", "India", 2180.0, "Malacca Strait", 0.0, 7.6, 0.18),
        ("RT-RICHARDSBAY-PARADIP", "Richards Bay", "South Africa", "Paradip", "India", 4780.0, "Indian Ocean Crossing", 0.0, 16.6, 0.40)
    ]
    cur.executemany("""
    INSERT INTO routes (route_id, origin_port, origin_country, destination_port, destination_country, distance_nm, canal_straits, canal_fees_usd, base_voyage_days, weather_risk_factor, data_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NAUTICAL ROUTING BENCHMARK')
    """, routes_data)

    # 3. Ports
    cur.execute("DELETE FROM port_conditions;")
    ports_data = [
        ("PORT-PARADIP", "Paradip Port", 17.5, 2.2, 28000.0, 22000.0, 48000.0, 3.4),
        ("PORT-VIZAG", "Visakhapatnam Port", 16.5, 3.1, 24000.0, 20000.0, 44000.0, 4.8),
        ("PORT-HALDIA", "Haldia Dock Complex", 9.2, 4.2, 14000.0, 16000.0, 38000.0, 6.2),
        ("PORT-DHAMRA", "Dhamra Port", 18.0, 1.4, 32000.0, 24000.0, 52000.0, 2.1)
    ]
    cur.executemany("""
    INSERT INTO port_conditions (port_id, port_name, max_permissible_draft, avg_waiting_days, berth_discharge_rate_mt_day, demurrage_usd_day, port_dues_base_usd, congestion_index, data_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SEMI-LIVE ESTIMATE')
    """, ports_data)

    conn.commit()
    print("-> Successfully inserted vessel, route, and port reference datasets.")

def main():
    conn = sqlite3.connect(DB_PATH)
    ingest_bdi(conn)
    ingest_vlsfo(conn)
    ingest_benchmarks(conn)
    
    # Print summary
    cur = conn.cursor()
    cur.execute("SELECT count(*), min(date), max(date) FROM bdi_history;")
    bdi_res = cur.fetchone()
    print(f"BDI Table Summary: {bdi_res[0]} records from {bdi_res[1]} to {bdi_res[2]}")
    
    cur.execute("SELECT count(*), min(month_year), max(month_year) FROM vlsfo_history;")
    vlsfo_res = cur.fetchone()
    print(f"VLSFO Table Summary: {vlsfo_res[0]} records from {vlsfo_res[1]} to {vlsfo_res[2]}")
    conn.close()

if __name__ == "__main__":
    main()
