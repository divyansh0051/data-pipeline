import pandas as pd
import numpy as np

class DataTransformer:
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df_out = df.copy()

        # Parse datetime objects
        df_out['incident_date'] = pd.to_datetime(df_out['incident_date'])
        df_out['claim_date'] = pd.to_datetime(df_out['claim_date'])
        df_out['settlement_date'] = pd.to_datetime(df_out['settlement_date'])

        # Business derived features
        # 1. Settlement Velocity (days from filing to payout)
        df_out['settlement_velocity_days'] = (df_out['settlement_date'] - df_out['claim_date']).dt.days

        # 2. Incident-to-Claim Filing Lag (days)
        df_out['reporting_lag_days'] = (df_out['claim_date'] - df_out['incident_date']).dt.days

        # 3. Loss Ratio (Claim Amount / Annual Premium)
        df_out['loss_ratio'] = np.round(df_out['claim_amount'] / np.maximum(df_out['annual_premium'], 1.0), 3)

        # 4. Severity Tier
        conditions = [
            (df_out['claim_amount'] < 2500),
            (df_out['claim_amount'] >= 2500) & (df_out['claim_amount'] < 10000),
            (df_out['claim_amount'] >= 10000) & (df_out['claim_amount'] < 50000),
            (df_out['claim_amount'] >= 50000)
        ]
        choices = ['Low', 'Medium', 'High', 'Severe']
        df_out['severity_tier'] = np.select(conditions, choices, default='Medium')

        # 5. Temporal partitioning
        df_out['claim_year'] = df_out['claim_date'].dt.year
        df_out['claim_month'] = df_out['claim_date'].dt.month
        df_out['claim_year_month'] = df_out['claim_date'].dt.strftime('%Y-%m')
        df_out['claim_quarter'] = df_out['claim_date'].dt.quarter

        # Convert datetimes back to ISO strings for SQLite compatibility
        df_out['incident_date'] = df_out['incident_date'].dt.strftime('%Y-%m-%d')
        df_out['claim_date'] = df_out['claim_date'].dt.strftime('%Y-%m-%d')
        df_out['settlement_date'] = df_out['settlement_date'].dt.strftime('%Y-%m-%d')

        return df_out
