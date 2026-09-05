"""
Explainable Time-Series Forecasting & Chronological Backtesting Engine.

Models implemented:
1. Naive / Random Walk: Y_hat(t+h) = Y(t)
2. Moving Average (3-Month, 6-Month): Y_hat(t+h) = mean(Y(t-k : t))
3. Holt's Linear Exponential Smoothing: Level (L_t) + Trend (T_t)
4. Lagged Linear Regression: Y(t) = a + b1*Y(t-1) + b2*Y(t-2) + c*Month_Seasonality

Validation:
- Chronological expanding window / rolling split (no lookahead leakage)
- Metrics: MAE (Mean Absolute Error), RMSE (Root Mean Squared Error), MAPE (Mean Absolute Percentage Error)
- Prediction intervals calculated from historical residual standard deviation.
"""
import sqlite3
import numpy as np
import pandas as pd
import os
from datetime import datetime
from dateutil.relativedelta import relativedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "freight_database.db")

def load_monthly_series(conn, table_name="bdi_history", value_col="price"):
    """
    Extract aggregated monthly series from SQLite.
    For BDI: average or month-end price per month.
    For VLSFO: paradip_vlsfo per month.
    """
    if table_name == "bdi_history":
        query = """
        SELECT year_month, 
               avg(price) as avg_price, 
               max(price) as max_price, 
               min(price) as min_price,
               (SELECT price FROM bdi_history b2 WHERE b2.year_month = b1.year_month ORDER BY b2.date DESC LIMIT 1) as month_end_price
        FROM bdi_history b1
        GROUP BY year_month
        ORDER BY year_month ASC;
        """
        df = pd.read_sql_query(query, conn)
        df['target'] = df['month_end_price']
        df['time_col'] = df['year_month']
    elif table_name == "vlsfo_history":
        query = """
        SELECT month_year as year_month, paradip_vlsfo as target
        FROM vlsfo_history
        ORDER BY month_year ASC;
        """
        df = pd.read_sql_query(query, conn)
        df['time_col'] = df['year_month']
    return df

# --- FORECASTING MODEL ALGORITHMS ---

def forecast_naive(series, horizon=3):
    last_val = series[-1]
    return np.full(horizon, last_val)

def forecast_moving_average(series, window=3, horizon=3):
    if len(series) < window:
        window = max(1, len(series))
    avg_val = np.mean(series[-window:])
    return np.full(horizon, avg_val)

def holt_linear(series, alpha=0.3, beta=0.1, horizon=3):
    """
    Holt's Linear Exponential Smoothing.
    Level: L_t = alpha * Y_t + (1 - alpha) * (L_{t-1} + T_{t-1})
    Trend: T_t = beta * (L_t - L_{t-1}) + (1 - beta) * T_{t-1}
    Forecast: Y_hat(t+h) = L_t + h * T_t
    """
    if len(series) < 2:
        return np.full(horizon, series[-1])
    
    # Initialize
    l = series[0]
    b = series[1] - series[0]
    
    for val in series[1:]:
        prev_l = l
        l = alpha * val + (1 - alpha) * (prev_l + b)
        b = beta * (l - prev_l) + (1 - beta) * b
        
    forecasts = [l + (h + 1) * b for h in range(horizon)]
    return np.array(forecasts)

def forecast_lagged_regression(series, horizon=3):
    """
    AR(2) linear autoregression with ordinary least squares.
    Y_t = c0 + c1 * Y_{t-1} + c2 * Y_{t-2}
    """
    if len(series) < 5:
        return forecast_naive(series, horizon)
        
    X, y = [], []
    for i in range(2, len(series)):
        X.append([1.0, series[i-1], series[i-2]])
        y.append(series[i])
        
    X = np.array(X)
    y = np.array(y)
    
    try:
        # Normal equations (X^T X)^(-1) X^T y
        coeffs, _, _, _ = np.linalg.lstsq(X, y, rcond=None)
    except Exception:
        return forecast_naive(series, horizon)
        
    # Iterative forecast
    preds = []
    curr_series = list(series)
    for _ in range(horizon):
        x_in = np.array([1.0, curr_series[-1], curr_series[-2]])
        next_val = float(np.dot(x_in, coeffs))
        # Ensure non-negative bounds
        next_val = max(100.0, next_val)
        preds.append(next_val)
        curr_series.append(next_val)
        
    return np.array(preds)

# --- BACKTESTING SUITE ---

def evaluate_metrics(actual, predicted):
    actual = np.array(actual, dtype=float)
    predicted = np.array(predicted, dtype=float)
    mae = float(np.mean(np.abs(actual - predicted)))
    rmse = float(np.sqrt(np.mean((actual - predicted)**2)))
    mape = float(np.mean(np.abs((actual - predicted) / np.maximum(actual, 1.0)))) * 100.0
    return {"mae": round(mae, 2), "rmse": round(rmse, 2), "mape": round(mape, 2)}

def run_expanding_window_backtest(df, target_col="target", min_train=6):
    """
    Walk-forward / Expanding window validation.
    For step t from min_train to len-1:
      Train on 0..t
      Predict 1-step ahead at t+1
    """
    series = df[target_col].values
    dates = df['time_col'].values
    n = len(series)
    
    models = {
        "Naive (Last Observed)": [],
        "Moving Average (3M)": [],
        "Holt Linear Smoothing": [],
        "Lagged Autoregression AR(2)": []
    }
    
    actuals = []
    test_dates = []
    
    for t in range(min_train, n):
        train = series[:t]
        actual_val = series[t]
        
        actuals.append(actual_val)
        test_dates.append(dates[t])
        
        # 1-step forecast for each model
        p_naive = forecast_naive(train, horizon=1)[0]
        p_ma = forecast_moving_average(train, window=3, horizon=1)[0]
        p_holt = holt_linear(train, alpha=0.35, beta=0.1, horizon=1)[0]
        p_ar = forecast_lagged_regression(train, horizon=1)[0]
        
        models["Naive (Last Observed)"].append(p_naive)
        models["Moving Average (3M)"].append(p_ma)
        models["Holt Linear Smoothing"].append(p_holt)
        models["Lagged Autoregression AR(2)"].append(p_ar)
        
    # Calculate performance metrics
    metrics = {}
    for m_name, preds in models.items():
        metrics[m_name] = evaluate_metrics(actuals, preds)
        
    return {
        "dates": list(test_dates),
        "actuals": [round(float(x), 2) for x in actuals],
        "predictions": {k: [round(float(x), 2) for x in v] for k, v in models.items()},
        "metrics": metrics
    }

def generate_future_forecast(df, target_col="target", horizon_months=4):
    """
    Generates point forecast + 95% confidence intervals (residual std dev * 1.96).
    """
    series = df[target_col].values
    last_date_str = df['time_col'].iloc[-1]
    last_date = datetime.strptime(last_date_str, "%Y-%m")
    
    future_dates = [(last_date + relativedelta(months=i+1)).strftime("%Y-%m") for i in range(horizon_months)]
    
    # Run backtest to get residual std dev
    bt = run_expanding_window_backtest(df, target_col=target_col, min_train=max(3, len(series)//2))
    
    # Select best performing model based on RMSE
    best_model_name = min(bt["metrics"], key=lambda k: bt["metrics"][k]["rmse"])
    residuals = np.array(bt["actuals"]) - np.array(bt["predictions"][best_model_name])
    sigma = float(np.std(residuals)) if len(residuals) > 0 else 50.0
    
    # Generate future values
    if best_model_name == "Holt Linear Smoothing":
        point_preds = holt_linear(series, alpha=0.35, beta=0.1, horizon=horizon_months)
    elif best_model_name == "Moving Average (3M)":
        point_preds = forecast_moving_average(series, window=3, horizon=horizon_months)
    elif best_model_name == "Lagged Autoregression AR(2)":
        point_preds = forecast_lagged_regression(series, horizon=horizon_months)
    else:
        point_preds = forecast_naive(series, horizon=horizon_months)
        
    results = []
    for i in range(horizon_months):
        p_val = float(point_preds[i])
        uncertainty = sigma * np.sqrt(i + 1)
        results.append({
            "month": future_dates[i],
            "predicted_value": round(p_val, 2),
            "lower_bound": round(max(0.0, p_val - 1.96 * uncertainty), 2),
            "upper_bound": round(p_val + 1.96 * uncertainty, 2),
            "model_selected": best_model_name,
            "confidence_level": "95%",
            "data_status": "FORECAST"
        })
    return {"forecast": results, "best_model": best_model_name, "backtest_summary": bt["metrics"]}

if __name__ == "__main__":
    conn = sqlite3.connect(DB_PATH)
    print("=== Testing BDI Time-Series Engine ===")
    bdi_df = load_monthly_series(conn, "bdi_history")
    print(f"Loaded {len(bdi_df)} monthly BDI points:")
    print(bdi_df[['time_col', 'target']])
    
    bdi_bt = run_expanding_window_backtest(bdi_df, min_train=4)
    print("\nBDI Backtest Metrics:")
    for m, met in bdi_bt["metrics"].items():
        print(f"  {m}: MAE={met['mae']}, RMSE={met['rmse']}, MAPE={met['mape']}%")
        
    bdi_fc = generate_future_forecast(bdi_df, horizon_months=3)
    print(f"\nBDI Future Forecast (Selected: {bdi_fc['best_model']}):")
    for row in bdi_fc['forecast']:
        print(f"  {row['month']}: {row['predicted_value']} (95% CI: [{row['lower_bound']} - {row['upper_bound']}])")
        
    print("\n=== Testing VLSFO Time-Series Engine ===")
    vlsfo_df = load_monthly_series(conn, "vlsfo_history")
    print(f"Loaded {len(vlsfo_df)} monthly VLSFO points (Paradip benchmark)")
    vlsfo_bt = run_expanding_window_backtest(vlsfo_df, min_train=8)
    print("\nVLSFO Backtest Metrics:")
    for m, met in vlsfo_bt["metrics"].items():
        print(f"  {m}: MAE=${met['mae']}/MT, RMSE=${met['rmse']}/MT, MAPE={met['mape']}%")
        
    vlsfo_fc = generate_future_forecast(vlsfo_df, horizon_months=3)
    print(f"\nVLSFO Future Forecast (Selected: {vlsfo_fc['best_model']}):")
    for row in vlsfo_fc['forecast']:
        print(f"  {row['month']}: ${row['predicted_value']}/MT (95% CI: [${row['lower_bound']} - ${row['upper_bound']}])")
    conn.close()
