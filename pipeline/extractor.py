import os
import random
import datetime
import pandas as pd
import numpy as np

STATES = ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA']
CATEGORIES = ['Health', 'Auto', 'Property', 'Life', 'Cyber']

def generate_raw_claims_dataset(output_path: str, num_records: int = 25000, inject_anomalies: bool = True):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    random.seed(42)
    np.random.seed(42)

    base_date = datetime.date(2025, 1, 1)
    
    records = []
    for i in range(num_records):
        tx_id = f"TXN-2026-{100000 + i}"
        customer_id = f"CUST-{random.randint(1000, 9999)}"
        category = random.choices(CATEGORIES, weights=[0.35, 0.30, 0.15, 0.12, 0.08])[0]
        state = random.choice(STATES)
        
        # Incident date
        offset_days = random.randint(0, 400)
        incident_date = base_date + datetime.timedelta(days=offset_days)
        # Claim filed 1-30 days later
        claim_date = incident_date + datetime.timedelta(days=random.randint(1, 30))
        # Settlement 5-60 days later
        settlement_date = claim_date + datetime.timedelta(days=random.randint(5, 60))
        
        # Claim amount with log-normal distribution
        base_amount = float(np.random.lognormal(mean=7.5, sigma=0.9))
        claim_amount = round(base_amount, 2)
        annual_premium = round(random.uniform(1200, 6500), 2)
        
        records.append({
            "transaction_id": tx_id,
            "customer_id": customer_id,
            "policy_category": category,
            "state_code": state,
            "incident_date": incident_date.strftime("%Y-%m-%d"),
            "claim_date": claim_date.strftime("%Y-%m-%d"),
            "settlement_date": settlement_date.strftime("%Y-%m-%d"),
            "claim_amount": claim_amount,
            "annual_premium": annual_premium,
            "policy_status": "ACTIVE"
        })

    # Deliberate edge case injection for Data Quality testing (approx 1.5% of rows)
    if inject_anomalies:
        # Duplicate transaction IDs
        for idx in [12, 45, 89, 150]:
            records[idx]["transaction_id"] = records[idx - 1]["transaction_id"]
        # Negative claim amounts
        for idx in [23, 110, 340]:
            records[idx]["claim_amount"] = -round(abs(records[idx]["claim_amount"]), 2)
        # Chronological violation: incident after claim
        for idx in [67, 215]:
            records[idx]["claim_date"] = "2024-01-01"
        # Null categories
        for idx in [94, 402]:
            records[idx]["policy_category"] = None
        # Invalid state code
        for idx in [180, 520]:
            records[idx]["state_code"] = "XX"

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"[OK] Generated {len(df)} raw ingestion records at: {output_path}")
    return df

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(__file__), "..", "data", "raw_claims_stream.csv")
    generate_raw_claims_dataset(out_file)
