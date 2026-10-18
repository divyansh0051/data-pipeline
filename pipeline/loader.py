import sqlite3
import os
import pandas as pd
from typing import Dict, Any

class WarehouseLoader:
    def __init__(self, db_path: str = None):
        self.db_path = db_path or os.path.join(
            os.path.dirname(__file__), "..", "data", "claims_warehouse.db"
        )
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.init_schema()

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def init_schema(self):
        with self.get_connection() as conn:
            cur = conn.cursor()
            # Fact Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS fact_claims (
                    transaction_id TEXT PRIMARY KEY,
                    customer_id TEXT,
                    policy_category TEXT,
                    state_code TEXT,
                    incident_date TEXT,
                    claim_date TEXT,
                    settlement_date TEXT,
                    claim_amount REAL,
                    annual_premium REAL,
                    settlement_velocity_days INTEGER,
                    reporting_lag_days INTEGER,
                    loss_ratio REAL,
                    severity_tier TEXT,
                    claim_year INTEGER,
                    claim_month INTEGER,
                    claim_year_month TEXT,
                    policy_status TEXT
                )
            """)
            # Audit Run Log Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS pipeline_runs (
                    run_id TEXT PRIMARY KEY,
                    start_time TEXT,
                    end_time TEXT,
                    duration_seconds REAL,
                    rows_ingested INTEGER,
                    rows_cleaned INTEGER,
                    rows_quarantined INTEGER,
                    data_quality_score REAL,
                    throughput_rows_sec REAL,
                    status TEXT
                )
            """)
            # Indices for analytical querying
            cur.execute("CREATE INDEX IF NOT EXISTS idx_claims_cat ON fact_claims(policy_category)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_claims_state ON fact_claims(state_code)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_claims_ym ON fact_claims(claim_year_month)")
            conn.commit()

    def load_clean_data(self, df_clean: pd.DataFrame, replace: bool = True):
        with self.get_connection() as conn:
            if replace:
                df_clean.to_sql("fact_claims", conn, if_exists="replace", index=False)
            else:
                df_clean.to_sql("fact_claims", conn, if_exists="append", index=False)
            conn.commit()

    def record_pipeline_run(self, audit_meta: Dict[str, Any]):
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT OR REPLACE INTO pipeline_runs 
                (run_id, start_time, end_time, duration_seconds, rows_ingested, rows_cleaned, 
                 rows_quarantined, data_quality_score, throughput_rows_sec, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                audit_meta["run_id"],
                audit_meta["start_time"],
                audit_meta["end_time"],
                audit_meta["duration_seconds"],
                audit_meta["rows_ingested"],
                audit_meta["rows_cleaned"],
                audit_meta["rows_quarantined"],
                audit_meta["data_quality_score"],
                audit_meta["throughput_rows_sec"],
                audit_meta["status"]
            ))
            conn.commit()

    def get_analytics_marts(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            # 1. Monthly Trends
            monthly_df = pd.read_sql_query("""
                SELECT 
                    claim_year_month,
                    COUNT(*) as claim_count,
                    ROUND(SUM(claim_amount), 2) as total_payout,
                    ROUND(AVG(claim_amount), 2) as avg_claim,
                    ROUND(AVG(settlement_velocity_days), 1) as avg_velocity_days
                FROM fact_claims
                GROUP BY claim_year_month
                ORDER BY claim_year_month ASC
                LIMIT 14
            """, conn)

            # 2. Category Distribution
            cat_df = pd.read_sql_query("""
                SELECT 
                    policy_category,
                    COUNT(*) as claim_count,
                    ROUND(SUM(claim_amount), 2) as total_payout,
                    ROUND(AVG(loss_ratio), 2) as avg_loss_ratio
                FROM fact_claims
                GROUP BY policy_category
                ORDER BY total_payout DESC
            """, conn)

            # 3. State Performance
            state_df = pd.read_sql_query("""
                SELECT 
                    state_code,
                    COUNT(*) as claim_count,
                    ROUND(SUM(claim_amount), 2) as total_payout,
                    ROUND(AVG(claim_amount), 2) as avg_payout
                FROM fact_claims
                GROUP BY state_code
                ORDER BY claim_count DESC
                LIMIT 10
            """, conn)

            # 4. Severity Tiers
            sev_df = pd.read_sql_query("""
                SELECT 
                    severity_tier,
                    COUNT(*) as count,
                    ROUND(SUM(claim_amount), 2) as total_amount
                FROM fact_claims
                GROUP BY severity_tier
            """, conn)

            # 5. Recent Clean Rows Sample
            recent_rows = pd.read_sql_query("""
                SELECT transaction_id, customer_id, policy_category, state_code, 
                       claim_date, claim_amount, settlement_velocity_days, severity_tier
                FROM fact_claims
                ORDER BY claim_date DESC
                LIMIT 15
            """, conn)

        return {
            "monthly_trends": monthly_df.to_dict(orient="records"),
            "category_distribution": cat_df.to_dict(orient="records"),
            "state_performance": state_df.to_dict(orient="records"),
            "severity_tiers": sev_df.to_dict(orient="records"),
            "recent_sample": recent_rows.to_dict(orient="records")
        }
