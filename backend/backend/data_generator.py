import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

def generate_data(num_days=3*365, save_path=None):
    start_date = datetime(2022, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(num_days)]
    
    # Generate base features with trend, seasonality, and noise
    t = np.arange(num_days)
    trend = t * 0.05
    seasonality = 100 * np.sin(2 * np.pi * t / 365.25 + np.pi/4) # Q1 peak
    
    bdi = 1500 + trend + seasonality + np.random.normal(0, 50, num_days)
    bdi = np.clip(bdi, 800, 3000)
    
    capesize_index = 2000 + 1.2 * trend + 1.5 * seasonality + np.random.normal(0, 100, num_days)
    capesize_index = np.clip(capesize_index, 500, 4000)
    
    panamax_index = 1500 + 0.8 * trend + 1.2 * seasonality + np.random.normal(0, 80, num_days)
    panamax_index = np.clip(panamax_index, 700, 2500)
    
    supramax_index = 1200 + 0.6 * trend + 1.0 * seasonality + np.random.normal(0, 60, num_days)
    supramax_index = np.clip(supramax_index, 600, 2000)
    
    coal_price_aus = 120 + 0.01 * t + np.random.normal(0, 5, num_days)
    coal_price_aus = np.clip(coal_price_aus, 80, 180)
    
    iron_ore_price = 110 + 0.02 * t + np.random.normal(0, 4, num_days)
    iron_ore_price = np.clip(iron_ore_price, 80, 160)
    
    bunker_fuel_price = 550 + 0.1 * t + np.random.normal(0, 15, num_days)
    bunker_fuel_price = np.clip(bunker_fuel_price, 400, 700)
    
    china_steel_production = 90 + 0.005 * t + np.random.normal(0, 2, num_days)
    china_steel_production = np.clip(china_steel_production, 80, 100)
    
    india_coal_import = 15 + 0.002 * t + np.random.normal(0, 1, num_days)
    india_coal_import = np.clip(india_coal_import, 10, 25)
    
    port_congestion_vizag = np.random.uniform(0, 10, num_days)
    port_congestion_paradip = np.random.uniform(0, 8, num_days)
    
    vessel_orderbook = 65 + 5 * np.sin(2 * np.pi * t / 730) + np.random.normal(0, 2, num_days)
    vessel_orderbook = np.clip(vessel_orderbook, 50, 80)
    
    fleet_utilization = 0.85 + 0.05 * np.sin(2 * np.pi * t / 365) + np.random.normal(0, 0.02, num_days)
    fleet_utilization = np.clip(fleet_utilization, 0.7, 0.95)
    
    freight_rate_handysize = 10000 + 10 * supramax_index + 5 * bunker_fuel_price + np.random.normal(0, 200, num_days)
    freight_rate_supramax = 12000 + 12 * supramax_index + 6 * bunker_fuel_price + np.random.normal(0, 250, num_days)
    freight_rate_panamax = 15000 + 10 * panamax_index + 8 * bunker_fuel_price + np.random.normal(0, 300, num_days)
    freight_rate_capesize = 20000 + 15 * capesize_index + 10 * bunker_fuel_price + np.random.normal(0, 400, num_days)
    
    data = pd.DataFrame({
        'date': dates,
        'bdi': bdi,
        'capesize_index': capesize_index,
        'panamax_index': panamax_index,
        'supramax_index': supramax_index,
        'coal_price_aus': coal_price_aus,
        'iron_ore_price': iron_ore_price,
        'bunker_fuel_price': bunker_fuel_price,
        'china_steel_production': china_steel_production,
        'india_coal_import': india_coal_import,
        'port_congestion_vizag': port_congestion_vizag,
        'port_congestion_paradip': port_congestion_paradip,
        'vessel_orderbook': vessel_orderbook,
        'fleet_utilization': fleet_utilization,
        'freight_rate_handysize': freight_rate_handysize,
        'freight_rate_supramax': freight_rate_supramax,
        'freight_rate_panamax': freight_rate_panamax,
        'freight_rate_capesize': freight_rate_capesize
    })
    
    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        data.to_csv(save_path, index=False)
        
    return data

def get_sample_data():
    return generate_data(num_days=90)

if __name__ == "__main__":
    generate_data(save_path=r"C:\Users\user\.gemini\antigravity\scratch\freight-forecasting\data\historical_data.csv")
