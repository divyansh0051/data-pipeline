import os
import sys
import sqlite3
import pandas as pd
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add pipeline directory to path
PIPELINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "pipeline"))
if PIPELINE_DIR not in sys.path:
    sys.path.insert(0, PIPELINE_DIR)

from orchestrator import PipelineOrchestrator
from loader import WarehouseLoader

app = FastAPI(
    title="DataStream Engine — Claims Pipeline & Quality API",
    description="High-Throughput Insurance Claims ETL, Great-Expectations Quality Assertions, and Analytical Marts",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = PipelineOrchestrator()
loader = WarehouseLoader()

class TriggerRequest(BaseModel):
    num_records: int = 25000
    inject_anomalies: bool = True

@app.get("/")
def root():
    return {
        "service": "DataStream ETL Pipeline & Warehouse API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "HEALTHY", "warehouse_status": "CONNECTED"}

@app.post("/api/pipeline/trigger")
def trigger_pipeline(payload: TriggerRequest):
    try:
        results = orchestrator.run_pipeline(
            num_records=payload.num_records,
            inject_anomalies=payload.inject_anomalies
        )
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pipeline/metrics")
def get_metrics():
    with loader.get_connection() as conn:
        # Latest runs
        runs_df = pd.read_sql_query("""
            SELECT * FROM pipeline_runs 
            ORDER BY start_time DESC 
            LIMIT 5
        """, conn)
        
        # Warehouse total stats
        stats_df = pd.read_sql_query("""
            SELECT 
                COUNT(*) as total_records,
                ROUND(SUM(claim_amount), 2) as cumulative_payout,
                ROUND(AVG(claim_amount), 2) as average_claim,
                ROUND(AVG(loss_ratio), 2) as portfolio_loss_ratio,
                ROUND(AVG(settlement_velocity_days), 1) as avg_settlement_velocity
            FROM fact_claims
        """, conn)
        
    latest_run = runs_df.iloc[0].to_dict() if not runs_df.empty else {}
    warehouse_stats = stats_df.iloc[0].to_dict() if not stats_df.empty else {}
    
    return {
        "latest_run": latest_run,
        "recent_runs": runs_df.to_dict(orient="records"),
        "warehouse_stats": warehouse_stats
    }

@app.get("/api/analytics")
def get_analytics():
    return loader.get_analytics_marts()

@app.get("/api/warehouse/sample")
def get_warehouse_sample(limit: int = 25):
    with loader.get_connection() as conn:
        df = pd.read_sql_query(f"""
            SELECT transaction_id, customer_id, policy_category, state_code,
                   incident_date, claim_date, settlement_date, claim_amount, 
                   annual_premium, settlement_velocity_days, loss_ratio, severity_tier
            FROM fact_claims
            ORDER BY claim_date DESC
            LIMIT {min(limit, 100)}
        """, conn)
    return {"records": df.to_dict(orient="records"), "count": len(df)}

@app.get("/api/quarantine/sample")
def get_quarantine_sample(limit: int = 25):
    quarantine_csv = os.path.join(PIPELINE_DIR, "..", "data", "quarantined_records.csv")
    if os.path.exists(quarantine_csv):
        df = pd.read_csv(quarantine_csv)
        return {"records": df.head(limit).to_dict(orient="records"), "total_quarantined": len(df)}
    return {"records": [], "total_quarantined": 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
