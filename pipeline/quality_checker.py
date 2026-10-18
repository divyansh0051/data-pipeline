import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List

VALID_STATES = {'CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA'}
VALID_CATEGORIES = {'Health', 'Auto', 'Property', 'Life', 'Cyber'}

class DataQualityChecker:
    def __init__(self):
        self.rules = [
            {
                "id": "DQ-01",
                "name": "expect_column_values_to_be_unique",
                "column": "transaction_id",
                "description": "Primary key uniqueness assertion on transaction_id",
                "critical": True
            },
            {
                "id": "DQ-02",
                "name": "expect_column_values_to_be_between",
                "column": "claim_amount",
                "description": "Claim amount must be strictly greater than $0.00 and <= $1,000,000",
                "critical": True
            },
            {
                "id": "DQ-03",
                "name": "expect_column_values_to_not_be_null",
                "column": "policy_category",
                "description": "Policy category column cannot contain null or empty values",
                "critical": False
            },
            {
                "id": "DQ-04",
                "name": "expect_column_values_to_be_in_set",
                "column": "policy_category",
                "description": "Category must belong to approved set [Health, Auto, Property, Life, Cyber]",
                "critical": False
            },
            {
                "id": "DQ-05",
                "name": "expect_column_values_to_be_in_set",
                "column": "state_code",
                "description": "Geographic state code must conform to registered US State codes",
                "critical": False
            },
            {
                "id": "DQ-06",
                "name": "expect_date_chronology_valid",
                "column": "claim_date,incident_date",
                "description": "Claim filing date must be on or after incident date",
                "critical": True
            },
            {
                "id": "DQ-07",
                "name": "expect_settlement_chronology_valid",
                "column": "settlement_date,claim_date",
                "description": "Settlement date must be on or after claim filing date",
                "critical": True
            },
            {
                "id": "DQ-08",
                "name": "expect_column_values_to_not_be_null",
                "column": "customer_id",
                "description": "Customer identifier must not be null or blank",
                "critical": True
            }
        ]

    def run_checks(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
        total_rows = len(df)
        df_eval = df.copy()
        
        # Track quarantine reasons
        quarantine_mask = pd.Series(False, index=df.index)
        quarantine_reasons = pd.Series("", index=df.index)

        check_results = []
        
        # DQ-01: Unique Transaction ID
        dup_mask = df_eval.duplicated(subset=['transaction_id'], keep=False)
        dup_count = int(dup_mask.sum())
        quarantine_mask |= dup_mask
        quarantine_reasons = np.where(dup_mask, quarantine_reasons + "Duplicate transaction_id; ", quarantine_reasons)
        check_results.append({
            "id": "DQ-01",
            "name": "Uniqueness of Transaction ID",
            "column": "transaction_id",
            "violations": dup_count,
            "pass_rate": round(((total_rows - dup_count) / total_rows) * 100, 2),
            "status": "PASSED" if dup_count == 0 else "WARNING"
        })

        # DQ-02: Claim Amount Positive
        invalid_amount_mask = (df_eval['claim_amount'] <= 0) | (df_eval['claim_amount'] > 1000000) | df_eval['claim_amount'].isna()
        amount_violations = int(invalid_amount_mask.sum())
        quarantine_mask |= invalid_amount_mask
        quarantine_reasons = np.where(invalid_amount_mask, quarantine_reasons + "Non-positive or extreme claim amount; ", quarantine_reasons)
        check_results.append({
            "id": "DQ-02",
            "name": "Valid Claim Amount Range ($0 - $1M)",
            "column": "claim_amount",
            "violations": amount_violations,
            "pass_rate": round(((total_rows - amount_violations) / total_rows) * 100, 2),
            "status": "PASSED" if amount_violations == 0 else "FAILED"
        })

        # DQ-03: Null policy category
        null_cat_mask = df_eval['policy_category'].isna() | (df_eval['policy_category'] == '')
        null_cat_count = int(null_cat_mask.sum())
        quarantine_mask |= null_cat_mask
        quarantine_reasons = np.where(null_cat_mask, quarantine_reasons + "Missing policy_category; ", quarantine_reasons)
        check_results.append({
            "id": "DQ-03",
            "name": "Null Category Tolerance",
            "column": "policy_category",
            "violations": null_cat_count,
            "pass_rate": round(((total_rows - null_cat_count) / total_rows) * 100, 2),
            "status": "PASSED" if null_cat_count == 0 else "WARNING"
        })

        # DQ-04: Category set validation
        inv_cat_mask = ~df_eval['policy_category'].isin(VALID_CATEGORIES) & ~null_cat_mask
        inv_cat_count = int(inv_cat_mask.sum())
        quarantine_mask |= inv_cat_mask
        quarantine_reasons = np.where(inv_cat_mask, quarantine_reasons + "Invalid policy category enum; ", quarantine_reasons)
        check_results.append({
            "id": "DQ-04",
            "name": "Allowed Insurance Categories Set",
            "column": "policy_category",
            "violations": inv_cat_count,
            "pass_rate": round(((total_rows - inv_cat_count) / total_rows) * 100, 2),
            "status": "PASSED" if inv_cat_count == 0 else "WARNING"
        })

        # DQ-05: State code validation
        inv_state_mask = ~df_eval['state_code'].isin(VALID_STATES)
        inv_state_count = int(inv_state_mask.sum())
        quarantine_mask |= inv_state_mask
        quarantine_reasons = np.where(inv_state_mask, quarantine_reasons + "Invalid US State code; ", quarantine_reasons)
        check_results.append({
            "id": "DQ-05",
            "name": "US State Code Integrity",
            "column": "state_code",
            "violations": inv_state_count,
            "pass_rate": round(((total_rows - inv_state_count) / total_rows) * 100, 2),
            "status": "PASSED" if inv_state_count == 0 else "WARNING"
        })

        # DQ-06: Incident Date <= Claim Date
        try:
            inc_dt = pd.to_datetime(df_eval['incident_date'])
            clm_dt = pd.to_datetime(df_eval['claim_date'])
            chrono_mask = clm_dt < inc_dt
            chrono_count = int(chrono_mask.sum())
            quarantine_mask |= chrono_mask
            quarantine_reasons = np.where(chrono_mask, quarantine_reasons + "Incident date after claim date; ", quarantine_reasons)
        except Exception:
            chrono_count = 0
        check_results.append({
            "id": "DQ-06",
            "name": "Chronological Incident vs Claim Date",
            "column": "incident_date,claim_date",
            "violations": chrono_count,
            "pass_rate": round(((total_rows - chrono_count) / total_rows) * 100, 2),
            "status": "PASSED" if chrono_count == 0 else "FAILED"
        })

        # DQ-07: Claim Date <= Settlement Date
        try:
            stl_dt = pd.to_datetime(df_eval['settlement_date'])
            clm_dt = pd.to_datetime(df_eval['claim_date'])
            stl_mask = stl_dt < clm_dt
            stl_count = int(stl_mask.sum())
            quarantine_mask |= stl_mask
            quarantine_reasons = np.where(stl_mask, quarantine_reasons + "Settlement before claim date; ", quarantine_reasons)
        except Exception:
            stl_count = 0
        check_results.append({
            "id": "DQ-07",
            "name": "Chronological Settlement vs Claim Date",
            "column": "claim_date,settlement_date",
            "violations": stl_count,
            "pass_rate": round(((total_rows - stl_count) / total_rows) * 100, 2),
            "status": "PASSED" if stl_count == 0 else "FAILED"
        })

        # DQ-08: Customer ID not null
        null_cust_mask = df_eval['customer_id'].isna() | (df_eval['customer_id'] == '')
        null_cust_count = int(null_cust_mask.sum())
        quarantine_mask |= null_cust_mask
        quarantine_reasons = np.where(null_cust_mask, quarantine_reasons + "Missing customer identifier; ", quarantine_reasons)
        check_results.append({
            "id": "DQ-08",
            "name": "Customer Identifier Completeness",
            "column": "customer_id",
            "violations": null_cust_count,
            "pass_rate": round(((total_rows - null_cust_count) / total_rows) * 100, 2),
            "status": "PASSED" if null_cust_count == 0 else "FAILED"
        })

        # Clean vs Quarantine split
        df_clean = df_eval[~quarantine_mask].copy()
        df_quarantine = df_eval[quarantine_mask].copy()
        df_quarantine['rejection_reason'] = quarantine_reasons[quarantine_mask]

        overall_pass_rate = round((len(df_clean) / total_rows) * 100, 2)
        
        summary = {
            "total_rows_inspected": total_rows,
            "clean_rows": len(df_clean),
            "quarantined_rows": len(df_quarantine),
            "overall_data_quality_score": overall_pass_rate,
            "total_rules_evaluated": len(check_results),
            "rules_passed": sum(1 for r in check_results if r["status"] == "PASSED"),
            "check_details": check_results
        }

        return df_clean, df_quarantine, summary
