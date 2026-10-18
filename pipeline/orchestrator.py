import os
import time
import uuid
import datetime
import pandas as pd
from typing import Dict, Any

from extractor import generate_raw_claims_dataset
from quality_checker import DataQualityChecker
from transformer import DataTransformer
from loader import WarehouseLoader

class PipelineOrchestrator:
    def __init__(self, data_dir: str = None):
        self.data_dir = data_dir or os.path.join(os.path.dirname(__file__), "..", "data")
        self.raw_path = os.path.join(self.data_dir, "raw_claims_stream.csv")
        self.quarantine_path = os.path.join(self.data_dir, "quarantined_records.csv")
        self.quality_checker = DataQualityChecker()
        self.transformer = DataTransformer()
        self.loader = WarehouseLoader()

    def run_pipeline(self, num_records: int = 25000, inject_anomalies: bool = True) -> Dict[str, Any]:
        run_id = f"RUN-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:4]}"
        start_time = datetime.datetime.utcnow()
        t0 = time.perf_counter()

        step_logs = []

        # Step 1: Extraction
        s1_t0 = time.perf_counter()
        if not os.path.exists(self.raw_path) or inject_anomalies:
            df_raw = generate_raw_claims_dataset(self.raw_path, num_records=num_records, inject_anomalies=inject_anomalies)
        else:
            df_raw = pd.read_csv(self.raw_path)
        step_logs.append({
            "task_id": "extract_raw_claims",
            "duration_ms": round((time.perf_counter() - s1_t0) * 1000, 2),
            "rows_in": 0,
            "rows_out": len(df_raw),
            "status": "SUCCESS"
        })

        # Step 2: Data Quality & Quarantine
        s2_t0 = time.perf_counter()
        df_clean, df_quarantine, dq_summary = self.quality_checker.run_checks(df_raw)
        # Save quarantine log
        df_quarantine.to_csv(self.quarantine_path, index=False)
        step_logs.append({
            "task_id": "data_quality_assertions",
            "duration_ms": round((time.perf_counter() - s2_t0) * 1000, 2),
            "rows_in": len(df_raw),
            "rows_out": len(df_clean),
            "quarantined": len(df_quarantine),
            "status": "SUCCESS"
        })

        # Step 3: Transformation & Feature Engineering
        s3_t0 = time.perf_counter()
        df_transformed = self.transformer.transform(df_clean)
        step_logs.append({
            "task_id": "transform_and_enrich",
            "duration_ms": round((time.perf_counter() - s3_t0) * 1000, 2),
            "rows_in": len(df_clean),
            "rows_out": len(df_transformed),
            "status": "SUCCESS"
        })

        # Step 4: Loading to Data Warehouse
        s4_t0 = time.perf_counter()
        self.loader.load_clean_data(df_transformed, replace=True)
        step_logs.append({
            "task_id": "load_warehouse_fact_table",
            "duration_ms": round((time.perf_counter() - s4_t0) * 1000, 2),
            "rows_in": len(df_transformed),
            "rows_out": len(df_transformed),
            "status": "SUCCESS"
        })

        # Step 5: Datamart Aggregation
        s5_t0 = time.perf_counter()
        analytics = self.loader.get_analytics_marts()
        step_logs.append({
            "task_id": "aggregate_analytical_marts",
            "duration_ms": round((time.perf_counter() - s5_t0) * 1000, 2),
            "status": "SUCCESS"
        })

        total_duration = round(time.perf_counter() - t0, 3)
        throughput = round(len(df_raw) / max(total_duration, 0.001), 1)
        end_time = datetime.datetime.utcnow()

        audit_meta = {
            "run_id": run_id,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration_seconds": total_duration,
            "rows_ingested": len(df_raw),
            "rows_cleaned": len(df_clean),
            "rows_quarantined": len(df_quarantine),
            "data_quality_score": dq_summary["overall_data_quality_score"],
            "throughput_rows_sec": throughput,
            "status": "SUCCESS"
        }

        self.loader.record_pipeline_run(audit_meta)

        return {
            "run_meta": audit_meta,
            "step_logs": step_logs,
            "data_quality": dq_summary,
            "quarantined_sample": df_quarantine.head(10).to_dict(orient="records"),
            "analytics": analytics
        }

if __name__ == "__main__":
    orchestrator = PipelineOrchestrator()
    print("[*] Running Data Pipeline Orchestrator...")
    res = orchestrator.run_pipeline(num_records=25000)
    meta = res["run_meta"]
    print(f"[OK] Pipeline {meta['run_id']} finished in {meta['duration_seconds']}s")
    print(f"     Ingested: {meta['rows_ingested']:,} rows | Throughput: {meta['throughput_rows_sec']:,} rows/sec")
    print(f"     Clean: {meta['rows_cleaned']:,} | Quarantined: {meta['rows_quarantined']} | DQ Score: {meta['data_quality_score']}%")
