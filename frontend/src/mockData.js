export const INITIAL_PIPELINE_RUN = {
  run_meta: {
    run_id: "RUN-20261014-ETL-PROD-868d",
    start_time: "2026-10-14T15:41:09.124Z",
    end_time: "2026-10-14T15:41:09.643Z",
    duration_seconds: 0.519,
    rows_ingested: 25000,
    rows_cleaned: 24983,
    rows_quarantined: 17,
    data_quality_score: 99.93,
    throughput_rows_sec: 48169.6,
    status: "SUCCESS"
  },
  step_logs: [
    {
      task_id: "extract_raw_claims",
      title: "Stream Ingestion & Schema Extraction",
      duration_ms: 112.4,
      rows_in: 0,
      rows_out: 25000,
      status: "SUCCESS",
      details: "Extracted 25,000 multi-state transactional claim records from Apache Kafka stream"
    },
    {
      task_id: "data_quality_assertions",
      title: "Great Expectations Quality Gates",
      duration_ms: 184.2,
      rows_in: 25000,
      rows_out: 24983,
      quarantined: 17,
      status: "SUCCESS",
      details: "8 validation suites executed; 17 records quarantined to dead-letter storage"
    },
    {
      task_id: "transform_and_enrich",
      title: "Pandas Feature Engineering & Standardization",
      duration_ms: 98.7,
      rows_in: 24983,
      rows_out: 24983,
      status: "SUCCESS",
      details: "Computed loss_ratio, settlement_velocity_days, severity_tier, and ISO timestamps"
    },
    {
      task_id: "load_warehouse_fact_table",
      title: "Data Warehouse Ingestion (fact_claims)",
      duration_ms: 81.3,
      rows_in: 24983,
      rows_out: 24983,
      status: "SUCCESS",
      details: "Bulk inserted 24,983 records into SQLite/PostgreSQL warehouse with B-tree indices"
    },
    {
      task_id: "aggregate_analytical_marts",
      title: "Analytical Datamarts Refresh",
      duration_ms: 42.4,
      status: "SUCCESS",
      details: "Recomputed monthly financial trends, state metrics, and loss ratio aggregations"
    }
  ],
  data_quality: {
    total_records_checked: 25000,
    total_valid_records: 24983,
    total_quarantined: 17,
    overall_data_quality_score: 99.93,
    quarantine_breakdown: {
      "NEGATIVE_CLAIM_AMOUNT": 5,
      "CHRONOLOGICAL_INVERSION": 4,
      "INVALID_STATE_CODE": 4,
      "MISSING_REQUIRED_FIELDS": 3,
      "ANOMALOUS_LOSS_RATIO": 1
    },
    checks_suite: [
      {
        check_name: "Null Value Invariant",
        field: "transaction_id, customer_id, claim_date",
        threshold: "< 0.05% allowed",
        observed: "0.00% (0 nulls)",
        status: "PASSED",
        criticality: "CRITICAL"
      },
      {
        check_name: "Positive Monetary Invariant",
        field: "claim_amount > 0",
        threshold: "100% compliant",
        observed: "99.98% (5 negative claims isolated)",
        status: "PASSED_WITH_QUARANTINE",
        criticality: "CRITICAL"
      },
      {
        check_name: "Chronological Integrity Gate",
        field: "incident_date <= claim_date <= settlement_date",
        threshold: "100% valid sequence",
        observed: "99.98% (4 future claims caught)",
        status: "PASSED_WITH_QUARANTINE",
        criticality: "HIGH"
      },
      {
        check_name: "ISO State Code Verification",
        field: "state_code in [50 US States]",
        threshold: "100% valid",
        observed: "99.98% (4 invalid abbreviations isolated)",
        status: "PASSED_WITH_QUARANTINE",
        criticality: "MEDIUM"
      },
      {
        check_name: "Unique Key Primary Integrity",
        field: "transaction_id uniqueness",
        threshold: "100% distinct",
        observed: "100.0% unique (0 duplicate hashes)",
        status: "PASSED",
        criticality: "CRITICAL"
      },
      {
        check_name: "Policy Category Domain Whitelist",
        field: "policy_category in [Auto, Health, Home, Commercial]",
        threshold: "100% mapped",
        observed: "100.0% conformity",
        status: "PASSED",
        criticality: "HIGH"
      },
      {
        check_name: "Premium Loss Ratio Sanity",
        field: "loss_ratio <= 100.0",
        threshold: "< 0.1% outliers",
        observed: "99.99% valid bounds",
        status: "PASSED",
        criticality: "MEDIUM"
      },
      {
        check_name: "Settlement Velocity Threshold",
        field: "settlement_velocity_days >= 0",
        threshold: "0 negative lag allowed",
        observed: "100.0% positive velocity",
        status: "PASSED",
        criticality: "HIGH"
      }
    ]
  },
  analytics: {
    monthly_trends: [
      { claim_year_month: "2025-01", claim_count: 1782, total_payout: 5892100.40, avg_claim: 3306.45, avg_velocity_days: 14.2 },
      { claim_year_month: "2025-02", claim_count: 1845, total_payout: 6124500.20, avg_claim: 3319.51, avg_velocity_days: 14.8 },
      { claim_year_month: "2025-03", claim_count: 2012, total_payout: 6780300.90, avg_claim: 3369.93, avg_velocity_days: 15.1 },
      { claim_year_month: "2025-04", claim_count: 1954, total_payout: 6490200.15, avg_claim: 3321.49, avg_velocity_days: 13.9 },
      { claim_year_month: "2025-05", claim_count: 2140, total_payout: 7210900.80, avg_claim: 3369.58, avg_velocity_days: 14.5 },
      { claim_year_month: "2025-06", claim_count: 2280, total_payout: 7850400.00, avg_claim: 3443.16, avg_velocity_days: 15.6 },
      { claim_year_month: "2025-07", claim_count: 2315, total_payout: 8012600.50, avg_claim: 3461.17, avg_velocity_days: 15.2 },
      { claim_year_month: "2025-08", claim_count: 2190, total_payout: 7420100.00, avg_claim: 3388.17, avg_velocity_days: 14.7 },
      { claim_year_month: "2025-09", claim_count: 2050, total_payout: 6980400.75, avg_claim: 3405.07, avg_velocity_days: 14.1 },
      { claim_year_month: "2025-10", claim_count: 2210, total_payout: 7540200.30, avg_claim: 3411.86, avg_velocity_days: 14.9 },
      { claim_year_month: "2025-11", claim_count: 2095, total_payout: 7120800.60, avg_claim: 3398.95, avg_velocity_days: 14.4 },
      { claim_year_month: "2025-12", claim_count: 2110, total_payout: 7250600.20, avg_claim: 3436.30, avg_velocity_days: 15.0 }
    ],
    category_distribution: [
      { policy_category: "Health Insurance", claim_count: 9412, total_payout: 34215000.00, avg_loss_ratio: 0.74 },
      { policy_category: "Auto Insurance", claim_count: 7850, total_payout: 26840000.00, avg_loss_ratio: 0.68 },
      { policy_category: "Commercial Property", claim_count: 4210, total_payout: 18120000.00, avg_loss_ratio: 0.58 },
      { policy_category: "Homeowners", claim_count: 3511, total_payout: 12450000.00, avg_loss_ratio: 0.62 }
    ],
    state_performance: [
      { state_code: "CA", claim_count: 4120, total_payout: 15480000.00, avg_payout: 3757.28 },
      { state_code: "TX", claim_count: 3840, total_payout: 13210000.00, avg_payout: 3440.10 },
      { state_code: "FL", claim_count: 3210, total_payout: 11950000.00, avg_payout: 3722.74 },
      { state_code: "NY", claim_count: 2950, total_payout: 10840000.00, avg_payout: 3674.58 },
      { state_code: "IL", claim_count: 2180, total_payout: 7420000.00, avg_payout: 3403.67 },
      { state_code: "PA", claim_count: 1940, total_payout: 6510000.00, avg_payout: 3355.67 }
    ],
    severity_tiers: [
      { severity_tier: "LOW (<$2,500)", count: 11840, total_amount: 14208000.00, color: "#10b981" },
      { severity_tier: "MEDIUM ($2.5k-$10k)", count: 9120, total_amount: 45600000.00, color: "#06b6d4" },
      { severity_tier: "HIGH ($10k-$25k)", count: 3210, total_amount: 48150000.00, color: "#f59e0b" },
      { severity_tier: "CATASTROPHIC (>$25k)", count: 813, total_amount: 28455000.00, color: "#f43f5e" }
    ],
    recent_sample: [
      { transaction_id: "TXN-2026-98124", customer_id: "CUST-49120", policy_category: "Health Insurance", state_code: "CA", claim_date: "2026-10-12", claim_amount: 4850.00, settlement_velocity_days: 9, severity_tier: "MEDIUM ($2.5k-$10k)" },
      { transaction_id: "TXN-2026-98123", customer_id: "CUST-38102", policy_category: "Auto Insurance", state_code: "TX", claim_date: "2026-10-11", claim_amount: 1420.50, settlement_velocity_days: 6, severity_tier: "LOW (<$2,500)" },
      { transaction_id: "TXN-2026-98122", customer_id: "CUST-81093", policy_category: "Commercial Property", state_code: "NY", claim_date: "2026-10-11", claim_amount: 18950.00, settlement_velocity_days: 22, severity_tier: "HIGH ($10k-$25k)" },
      { transaction_id: "TXN-2026-98121", customer_id: "CUST-19402", policy_category: "Health Insurance", state_code: "FL", claim_date: "2026-10-10", claim_amount: 32100.00, settlement_velocity_days: 31, severity_tier: "CATASTROPHIC (>$25k)" },
      { transaction_id: "TXN-2026-98120", customer_id: "CUST-77219", policy_category: "Homeowners", state_code: "IL", claim_date: "2026-10-10", claim_amount: 8400.00, settlement_velocity_days: 14, severity_tier: "MEDIUM ($2.5k-$10k)" }
    ]
  },
  quarantined_sample: [
    { transaction_id: "TXN-ANOM-001", customer_id: "CUST-ANOM-12", policy_category: "Auto Insurance", state_code: "CA", claim_amount: -4500.00, reason: "NEGATIVE_CLAIM_AMOUNT: Claim value -$4,500.00 violates monetary invariant." },
    { transaction_id: "TXN-ANOM-002", customer_id: "CUST-ANOM-44", policy_category: "Health Insurance", state_code: "ZZ", claim_amount: 3200.00, reason: "INVALID_STATE_CODE: State 'ZZ' failed ISO-3166-2 geographic validation." },
    { transaction_id: "TXN-ANOM-003", customer_id: "CUST-ANOM-89", policy_category: "Homeowners", state_code: "TX", claim_amount: 12000.00, reason: "CHRONOLOGICAL_INVERSION: Incident date (2026-08-20) occurred AFTER claim filing date (2026-07-10)." },
    { transaction_id: "TXN-ANOM-004", customer_id: "CUST-ANOM-91", policy_category: "Commercial Property", state_code: "NY", claim_amount: 850.00, reason: "MISSING_REQUIRED_FIELDS: Missing customer verification identifier." }
  ]
};
