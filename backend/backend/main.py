"""
Updated FastAPI application for FreightAI.
Provides real BDI series, real VLSFO series, backtesting metrics, 
explainable time-series forecasts, and risk-constrained voyage optimization.
"""
from fastapi import FastAPI, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os
import pandas as pd
from typing import Optional

from database import init_db
from time_series_engine import load_monthly_series, run_expanding_window_backtest, generate_future_forecast
from voyage_optimizer import optimize_chartering_voyage

app = FastAPI(title="FreightAI - Maritime Freight Forecasting & Optimization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "freight_database.db")

@app.on_event("startup")
def startup():
    init_db(DB_PATH)

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "FreightAI Production API", "version": "2.0"}

@app.get("/api/market/bdi/history")
def bdi_history(limit: int = 100):
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT * FROM bdi_history ORDER BY date DESC LIMIT ?", conn, params=(limit,))
    conn.close()
    return {
        "data_status": "REAL HISTORICAL",
        "description": "Daily Baltic Dry Index trading fixtures with derived rolling averages and volatility.",
        "records": df.to_dict(orient="records")
    }

@app.get("/api/market/vlsfo/history")
def vlsfo_history():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT * FROM vlsfo_history ORDER BY month_year ASC", conn)
    conn.close()
    return {
        "data_status": "REAL HISTORICAL",
        "description": "Paradip, Haldia, Singapore benchmark VLSFO monthly prices from IOCL circulars.",
        "records": df.to_dict(orient="records")
    }

@app.get("/api/models/backtest")
def models_backtest(target: str = "bdi"):
    conn = sqlite3.connect(DB_PATH)
    table = "bdi_history" if target.lower() == "bdi" else "vlsfo_history"
    df = load_monthly_series(conn, table)
    conn.close()
    
    min_train = 4 if target.lower() == "bdi" else 8
    bt_res = run_expanding_window_backtest(df, min_train=min_train)
    return {
        "target_variable": target.upper(),
        "data_status": "REAL HISTORICAL VALIDATION",
        "validation_method": "Chronological Walk-Forward Expanding Window",
        "backtest_results": bt_res
    }

@app.get("/api/models/forecast")
def models_forecast(target: str = "bdi", horizon: int = 4):
    conn = sqlite3.connect(DB_PATH)
    table = "bdi_history" if target.lower() == "bdi" else "vlsfo_history"
    df = load_monthly_series(conn, table)
    conn.close()
    
    fc_res = generate_future_forecast(df, horizon_months=horizon)
    return {
        "target_variable": target.upper(),
        "data_status": "FORECAST",
        "forecast": fc_res
    }

class OptimizeVoyageRequest(BaseModel):
    cargo_type: str = "Coking Coal"
    cargo_qty_mt: float = 150000
    origin_port: str = "Port Hedland"
    destination_port: str = "Paradip"
    laycan_start_date: Optional[str] = None
    delivery_deadline_date: Optional[str] = None
    max_risk_threshold: float = 0.40

@app.post("/api/optimizer/evaluate")
def evaluate_optimizer(req: OptimizeVoyageRequest):
    result = optimize_chartering_voyage(
        cargo_type=req.cargo_type,
        cargo_qty_mt=req.cargo_qty_mt,
        origin_port=req.origin_port,
        destination_port=req.destination_port,
        laycan_start_date=req.laycan_start_date,
        delivery_deadline_date=req.delivery_deadline_date,
        max_risk_threshold=req.max_risk_threshold
    )
    return result

@app.get("/api/market/snapshot")
def market_snapshot():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    cur.execute("SELECT date, price, change_pct, rolling_3m_avg FROM bdi_history ORDER BY date DESC LIMIT 1;")
    bdi_row = cur.fetchone()
    
    cur.execute("SELECT month_year, paradip_vlsfo, spread_over_singapore FROM vlsfo_history ORDER BY month_year DESC LIMIT 1;")
    vlsfo_row = cur.fetchone()
    conn.close()
    
    return {
        "bdi": {
            "value": bdi_row[1],
            "change_pct": bdi_row[2],
            "as_of": bdi_row[0],
            "rolling_3m": bdi_row[3],
            "data_status": "REAL HISTORICAL"
        },
        "vlsfo_paradip": {
            "value": vlsfo_row[1],
            "spread": vlsfo_row[2],
            "as_of": vlsfo_row[0],
            "data_status": "REAL HISTORICAL"
        },
        "capesize_tce_est": {
            "value": 26850.0,
            "change_pct": 3.4,
            "data_status": "MODELLED BENCHMARK"
        },
        "australia_paradip_freight": {
            "value": 7.46,
            "unit": "$/MT",
            "data_status": "MODELLED / DEMO ESTIMATE"
        }
    }
