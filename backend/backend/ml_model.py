import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, mean_absolute_percentage_error
import os
import joblib

class FreightForecastingModel:
    def __init__(self):
        self.models = {}
        self.features = [
            'bdi', 'capesize_index', 'panamax_index', 'supramax_index',
            'coal_price_aus', 'iron_ore_price', 'bunker_fuel_price',
            'china_steel_production', 'india_coal_import',
            'port_congestion_vizag', 'port_congestion_paradip',
            'vessel_orderbook', 'fleet_utilization'
        ]
        self.target_cols = ['freight_rate_handysize', 'freight_rate_supramax', 'freight_rate_panamax', 'freight_rate_capesize']
        self.metrics = {}
        self.feature_importances = {}
        
    def _create_rolling_features(self, df):
        df = df.copy()
        for col in self.features:
            df[f'{col}_ma_7'] = df[col].rolling(window=7, min_periods=1).mean()
            df[f'{col}_ma_30'] = df[col].rolling(window=30, min_periods=1).mean()
            df[f'{col}_ma_90'] = df[col].rolling(window=90, min_periods=1).mean()
            
        self.all_features = [c for c in df.columns if c not in self.target_cols and c != 'date']
        return df

    def train(self, data):
        data = self._create_rolling_features(data)
        
        for target in self.target_cols:
            X = data[self.all_features]
            y = data[target]
            
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
            
            model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
            model.fit(X_train, y_train)
            
            self.models[target] = model
            
            y_pred = model.predict(X_test)
            self.metrics[target] = {
                'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
                'mae': float(mean_absolute_error(y_test, y_pred)),
                'mape': float(mean_absolute_percentage_error(y_test, y_pred))
            }
            
            self.feature_importances[target] = dict(zip(self.all_features, model.feature_importances_))

    def predict(self, features_df, vessel_type, horizon_days):
        target = f'freight_rate_{vessel_type}'
        if target not in self.models:
            return None
            
        features_df = self._create_rolling_features(features_df)
        last_row = features_df[self.all_features].iloc[-1:]
        
        pred = self.models[target].predict(last_row)[0]
        
        # Simulate forecast for horizon
        preds = []
        for i in range(horizon_days):
            noise = np.random.normal(0, 100)
            preds.append({
                'day': i + 1,
                'predicted_rate': float(pred + i*10 + noise),
                'lower_bound': float(pred + i*10 - 500),
                'upper_bound': float(pred + i*10 + 500)
            })
            
        return preds

    def get_feature_importance(self):
        # average across models
        if not self.feature_importances:
            return {}
            
        avg_importance = {}
        for feat in self.all_features:
            avg = np.mean([self.feature_importances[m].get(feat, 0) for m in self.models])
            avg_importance[feat] = float(avg)
            
        sorted_imp = {k: v for k, v in sorted(avg_importance.items(), key=lambda item: item[1], reverse=True)}
        return sorted_imp

    def recommend_vessel(self, cargo_tons, route, port):
        if cargo_tons < 40000:
            return 'handysize'
        elif cargo_tons < 60000:
            return 'supramax'
        elif cargo_tons < 100000:
            return 'panamax'
        else:
            return 'capesize'
            
    def calculate_charter_strategy(self, current_rate, predicted_rate, cargo_need_date):
        diff = predicted_rate - current_rate
        percent_diff = diff / current_rate
        
        if percent_diff > 0.05:
            return 'BUY'
        elif percent_diff < -0.05:
            return 'WAIT'
        else:
            return 'HEDGE'

    def save(self, path):
        os.makedirs(path, exist_ok=True)
        for target, model in self.models.items():
            joblib.dump(model, os.path.join(path, f'{target}.joblib'))
            
    def load(self, path):
        for target in self.target_cols:
            file_path = os.path.join(path, f'{target}.joblib')
            if os.path.exists(file_path):
                self.models[target] = joblib.load(file_path)
