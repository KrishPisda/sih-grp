"""
Database initialization and schema definitions for FreightAI prototype.
Stores real historical BDI, real monthly VLSFO, vessel parameters, route definitions,
port status, weather snapshots, and model predictions/backtests.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "freight_database.db")

def init_db(db_path=DB_PATH):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. BDI History (Real historical monthly & trading day data)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS bdi_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE,
        price REAL,
        open REAL,
        high REAL,
        low REAL,
        change_pct REAL,
        year_month TEXT,
        is_month_end INTEGER DEFAULT 0,
        rolling_3m_avg REAL,
        rolling_6m_avg REAL,
        monthly_volatility REAL,
        data_source TEXT DEFAULT 'REAL HISTORICAL'
    );
    """)

    # 2. VLSFO Bunker Fuel History (Real monthly IOCL / benchmark data)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS vlsfo_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month_year TEXT UNIQUE,
        paradip_vlsfo REAL,
        haldia_vlsfo REAL,
        singapore_vlsfo REAL,
        spread_over_singapore REAL,
        data_source TEXT DEFAULT 'REAL HISTORICAL'
    );
    """)

    # 3. Modelled / Historical Freight Rates (Specific routes, e.g. Port Hedland / Hay Point -> Paradip)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS freight_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        route_id TEXT,
        vessel_class TEXT,
        rate_usd_per_mt REAL,
        tce_usd_per_day REAL,
        bdi_ref REAL,
        vlsfo_ref REAL,
        data_status TEXT DEFAULT 'MODELLED / DEMO ESTIMATE'
    );
    """)

    # 4. Vessels Specification Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS vessels (
        vessel_id TEXT PRIMARY KEY,
        name TEXT,
        vessel_class TEXT,       -- Capesize, Panamax, Supramax, Handysize
        dwt REAL,                -- Deadweight Tonnage
        max_draft REAL,          -- meters
        design_speed_knots REAL,
        laden_fuel_mt_day REAL,  -- VLSFO tons per day laden
        ballast_fuel_mt_day REAL,-- VLSFO tons per day ballast
        port_fuel_mt_day REAL,   -- Idle tons per day
        base_tce_rate_day REAL,  -- Base time charter equivalent $/day
        current_status TEXT,
        data_status TEXT DEFAULT 'SIMULATED AIS / SPEC'
    );
    """)

    # 5. Routes Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS routes (
        route_id TEXT PRIMARY KEY,
        origin_port TEXT,
        origin_country TEXT,
        destination_port TEXT,
        destination_country TEXT,
        distance_nm REAL,
        canal_straits TEXT,      -- Malacca, Sunda, Lombok, None
        canal_fees_usd REAL,
        base_voyage_days REAL,
        weather_risk_factor REAL,
        data_status TEXT DEFAULT 'NAUTICAL ROUTING BENCHMARK'
    );
    """)

    # 6. Port Conditions Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS port_conditions (
        port_id TEXT PRIMARY KEY,
        port_name TEXT,
        max_permissible_draft REAL,
        avg_waiting_days REAL,
        berth_discharge_rate_mt_day REAL,
        demurrage_usd_day REAL,
        port_dues_base_usd REAL,
        congestion_index REAL,   -- 0.0 - 10.0
        data_status TEXT DEFAULT 'SEMI-LIVE ESTIMATE'
    );
    """)

    # 7. Model Predictions & Backtests
    cur.execute("""
    CREATE TABLE IF NOT EXISTS model_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_variable TEXT,    -- BDI, VLSFO, FREIGHT
        model_name TEXT,         -- Naive, MA_3M, Holt_Winters, Lagged_Regression
        forecast_date TEXT,
        predicted_value REAL,
        lower_ci REAL,
        upper_ci REAL,
        actual_value REAL,
        residual REAL,
        horizon_months INTEGER,
        data_status TEXT DEFAULT 'FORECAST / BACKTEST'
    );
    """)

    # 8. Optimized Voyage Runs
    cur.execute("""
    CREATE TABLE IF NOT EXISTS voyage_runs (
        run_id TEXT PRIMARY KEY,
        timestamp TEXT,
        cargo_type TEXT,
        cargo_qty_mt REAL,
        origin_port TEXT,
        dest_port TEXT,
        deadline_date TEXT,
        selected_sailing_date TEXT,
        selected_vessel_class TEXT,
        selected_route_id TEXT,
        charter_cost_usd REAL,
        bunker_cost_usd REAL,
        port_fees_usd REAL,
        canal_fees_usd REAL,
        total_landed_cost_usd REAL,
        cost_per_mt REAL,
        risk_score REAL,
        savings_vs_earliest_usd REAL,
        recommendation_badge TEXT
    );
    """)

    conn.commit()
    conn.close()
    print(f"Initialized database schema at {db_path}")

if __name__ == "__main__":
    init_db()
