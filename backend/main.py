from fastapi import FastAPI, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta
import random

from data_generator import generate_data
from ml_model import FreightForecastingModel

app = FastAPI(title="Intelligent Freight Forecasting Model API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = FreightForecastingModel()
global_data = None

@app.on_event("startup")
async def startup_event():
    global global_data
    # Generate mock data
    global_data = generate_data(num_days=365)
    # Train model
    model.train(global_data)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "1.0"}

@app.get("/api/market/current")
def current_market():
    last_row = global_data.iloc[-1].to_dict()
    last_row['date'] = str(last_row['date'])
    return last_row

@app.get("/api/market/historical")
def historical_market(days: int = 90):
    recent_data = global_data.tail(days)
    result = []
    for _, row in recent_data.iterrows():
        d = row.to_dict()
        d['date'] = str(d['date'].date())
        result.append(d)
    return result

class ForecastRequest(BaseModel):
    vessel_type: str
    route: str = "australia_vizag"
    cargo_tons: float
    horizon_days: int = 30

@app.post("/api/forecast")
def forecast(req: ForecastRequest):
    preds = model.predict(global_data, req.vessel_type, req.horizon_days)
    return {
        "vessel_type": req.vessel_type,
        "route": req.route,
        "forecast": preds
    }

@app.get("/api/vessels/recommend")
def recommend_vessel(cargo_tons: float = Query(...), port: str = Query(None), cargo_type: str = Query(None)):
    vessel = model.recommend_vessel(cargo_tons, "any", port)
    return {
        "recommended_vessel": vessel,
        "reason": f"Optimal vessel for {cargo_tons} tons of cargo."
    }

@app.get("/api/strategy/charter")
def charter_strategy(vessel_type: str = Query(...), cargo_need_date: str = Query(None), cargo_tons: float = Query(None)):
    current_rate = global_data.iloc[-1][f'freight_rate_{vessel_type}']
    # simulate prediction
    predicted_rate = current_rate * random.uniform(0.9, 1.1)
    
    strategy = model.calculate_charter_strategy(current_rate, predicted_rate, cargo_need_date)
    return {
        "strategy": strategy,
        "current_rate": float(current_rate),
        "predicted_rate": float(predicted_rate)
    }

@app.get("/api/ports/status")
def port_status():
    return [
        {"port": "Vizag", "congestion_days": random.uniform(1, 8), "trend": "increasing"},
        {"port": "Paradip", "congestion_days": random.uniform(0, 5), "trend": "stable"},
        {"port": "Haldia", "congestion_days": random.uniform(2, 6), "trend": "decreasing"}
    ]

@app.get("/api/features/importance")
def feature_importance():
    return model.get_feature_importance()

@app.get("/api/analytics/routes")
def route_analytics():
    return {
        "australia_vizag": {"volume_mt": 12.5, "avg_rate": 18.5, "risk_level": "low"},
        "indonesia_paradip": {"volume_mt": 8.2, "avg_rate": 15.2, "risk_level": "medium"},
        "south_africa_gangavaram": {"volume_mt": 5.4, "avg_rate": 22.1, "risk_level": "high"}
    }
