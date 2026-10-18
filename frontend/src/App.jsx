import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Database,
  Layers,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Server,
  FileCode,
  ArrowRight,
  Clock,
  Zap,
  Filter,
  Search,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';
import { INITIAL_PIPELINE_RUN } from './mockData';

export default function App() {
  const [pipelineData, setPipelineData] = useState(INITIAL_PIPELINE_RUN);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'analytics' | 'warehouse' | 'architecture'
  const [selectedNode, setSelectedNode] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [showRunModal, setShowRunModal] = useState(false);
  const [batchSize, setBatchSize] = useState(25000);
  const [injectAnomalies, setInjectAnomalies] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'HEALTHY') {
          setIsBackendConnected(true);
          // fetch latest real metrics
          fetch('/api/pipeline/metrics')
            .then((r) => r.json())
            .then((m) => {
              if (m.latest_run && m.latest_run.run_id) {
                // Backend is active and has data
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        setIsBackendConnected(false);
      });
  }, []);

  const triggerPipelineExecution = async () => {
    setShowRunModal(false);
    setIsRunning(true);
    setRunProgress(0);
    setActiveStepIndex(0);

    const stepInterval = setInterval(() => {
      setRunProgress((prev) => {
        const next = prev + 20;
        if (next >= 100) {
          clearInterval(stepInterval);
          return 100;
        }
        return next;
      });
      setActiveStepIndex((prev) => (prev < 4 ? prev + 1 : 4));
    }, 280);

    // If backend is connected, trigger real API
    if (isBackendConnected) {
      try {
        const res = await fetch('/api/pipeline/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ num_records: batchSize, inject_anomalies: injectAnomalies })
        });
        const json = await res.json();
        if (json.success && json.data) {
          setTimeout(() => {
            setPipelineData(json.data);
            setIsRunning(false);
            setActiveStepIndex(-1);
          }, 1400);
          return;
        }
      } catch (err) {
        console.warn('Backend call failed, falling back to simulated execution', err);
      }
    }

    // Simulated local execution fallback
    setTimeout(() => {
      const randomDuration = Number((0.45 + Math.random() * 0.15).toFixed(3));
      const quarantined = injectAnomalies ? Math.floor(12 + Math.random() * 8) : 0;
      const cleaned = batchSize - quarantined;
      const throughput = Number((batchSize / randomDuration).toFixed(1));
      const dqScore = Number(((cleaned / batchSize) * 100).toFixed(2));
      const newRunId = `RUN-${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}-${Math.random().toString(36).substring(2, 6)}`;

      setPipelineData((prev) => ({
        ...prev,
        run_meta: {
          run_id: newRunId,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + randomDuration * 1000).toISOString(),
          duration_seconds: randomDuration,
          rows_ingested: batchSize,
          rows_cleaned: cleaned,
          rows_quarantined: quarantined,
          data_quality_score: dqScore,
          throughput_rows_sec: throughput,
          status: 'SUCCESS'
        },
        data_quality: {
          ...prev.data_quality,
          total_records_checked: batchSize,
          total_valid_records: cleaned,
          total_quarantined: quarantined,
          overall_data_quality_score: dqScore
        }
      }));

      setIsRunning(false);
      setActiveStepIndex(-1);
    }, 1500);
  };

  const { run_meta, step_logs, data_quality, analytics, quarantined_sample } = pipelineData;

  const filteredWarehouseRecords = (analytics.recent_sample || []).filter((r) => {
    const matchesSearch =
      r.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.policy_category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = stateFilter === 'ALL' || r.state_code === stateFilter;
    return matchesSearch && matchesState;
  });

  return (
    <div className="min-h-screen text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">DataStream Engine</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                v2.4 Production
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot"></span>
                {isBackendConnected ? 'FastAPI Live' : 'Client Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Insurance Claims ETL • Great Expectations Quality Gates • SQLite/Postgres Warehouse
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Airflow DAG:</span>
            <span className="font-mono text-cyan-300 font-semibold">claims_pipeline_dag</span>
          </div>

          <button
            onClick={() => setShowRunModal(true)}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Trigger Ingestion Pipeline</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* KPI Scorecards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Rows Processed */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800/80 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Records Ingested</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight mono-font">
              {run_meta.rows_ingested.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {run_meta.rows_cleaned.toLocaleString()} Validated
              </span>
              <span className="text-slate-500 font-mono">100% Ingestion</span>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all pointer-events-none"></div>
          </div>

          {/* Card 2: Quality Score */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800/80 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Data Quality Score</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight mono-font">
              {run_meta.data_quality_score}%
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">8/8 Quality Suites</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                PASSED
              </span>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none"></div>
          </div>

          {/* Card 3: Processing Throughput */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800/80 relative overflow-hidden group hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Pipeline Throughput</span>
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight mono-font">
              {run_meta.throughput_rows_sec.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">rows/s</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-cyan-400 font-medium">Latency: {run_meta.duration_seconds}s</span>
              <span className="text-slate-500 font-mono">Vectorized ETL</span>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none"></div>
          </div>

          {/* Card 4: Quarantined Records */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800/80 relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Quarantined Anomalies</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400 tracking-tight mono-font">
              {run_meta.rows_quarantined}{' '}
              <span className="text-xs text-slate-400 font-normal">isolated</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">Zero data pollution</span>
              <span className="text-amber-400 font-mono text-[11px]">DLQ Isolated</span>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none"></div>
          </div>
        </section>

        {/* Interactive DAG Pipeline Visualizer */}
        <section className="glass-panel p-6 rounded-xl border border-slate-800/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                  Airflow DAG Pipeline Execution Topology
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any pipeline stage to inspect task execution telemetry, input/output row counts, and latency
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Run ID:</span>
              <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">
                {run_meta.run_id}
              </span>
            </div>
          </div>

          {/* DAG Nodes Grid / Workflow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative py-2">
            {step_logs.map((step, idx) => {
              const isSelected = selectedNode === step.task_id;
              const isStepActive = isRunning && activeStepIndex === idx;
              const isStepDone = !isRunning || activeStepIndex > idx;

              return (
                <div
                  key={step.task_id}
                  onClick={() => setSelectedNode(step.task_id)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all relative ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Status header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      Step 0{idx + 1}
                    </span>
                    {isStepActive ? (
                      <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> RUNNING
                      </span>
                    ) : isStepDone ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> SUCCESS
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600">PENDING</span>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-slate-200 line-clamp-1">{step.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {step.details}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{step.duration_ms} ms</span>
                    <span className="text-cyan-400">
                      {step.rows_out ? `${step.rows_out.toLocaleString()} rows` : 'Done'}
                    </span>
                  </div>

                  {/* Connecting Arrow for desktop */}
                  {idx < 4 && (
                    <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-slate-400 pointer-events-none">
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Node Telemetry Drawer */}
          {selectedNode && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between text-xs">
              <div>
                <span className="text-cyan-400 font-semibold font-mono">
                  Stage Details: {selectedNode}
                </span>
                <p className="text-slate-300 mt-0.5">
                  {step_logs.find((s) => s.task_id === selectedNode)?.details}
                </p>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'pipeline'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Data Quality Assertions ({data_quality.checks_suite.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'analytics'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Warehouse Analytics Marts</span>
          </button>

          <button
            onClick={() => setActiveTab('warehouse')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'warehouse'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Warehouse Fact Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'architecture'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Airflow DAG & System Specs</span>
          </button>
        </div>

        {/* TAB 1: DATA QUALITY SUITE */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Great Expectations Quality Table */}
            <div className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Great Expectations Invariant Assertions Suite
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automated rule engines verifying completeness, schema conformity, range boundaries, and chronological sanity
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Overall Score: {data_quality.overall_data_quality_score}%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">ASSERTION RULE</th>
                      <th className="py-3 px-4">TARGET FIELD</th>
                      <th className="py-3 px-4">TOLERANCE THRESHOLD</th>
                      <th className="py-3 px-4">OBSERVED VALUE</th>
                      <th className="py-3 px-4">CRITICALITY</th>
                      <th className="py-3 px-4 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {data_quality.checks_suite.map((check, i) => (
                      <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {check.check_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-300 text-[11px]">
                          {check.field}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{check.threshold}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{check.observed}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              check.criticality === 'CRITICAL'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : check.criticality === 'HIGH'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {check.criticality}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {check.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quarantined Records Table */}
            <div className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Quarantined Dead-Letter Queue (DLQ Sample)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Records failing invariant checks isolated before reaching production warehouse
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {run_meta.rows_quarantined} Records Isolated
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">TXN ID</th>
                      <th className="py-3 px-4">CUSTOMER</th>
                      <th className="py-3 px-4">CATEGORY</th>
                      <th className="py-3 px-4">STATE</th>
                      <th className="py-3 px-4">AMOUNT</th>
                      <th className="py-3 px-4">FAILURE REASON & GATE VIOLATION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {quarantined_sample.map((q, i) => (
                      <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-cyan-300">{q.transaction_id}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{q.customer_id}</td>
                        <td className="py-3 px-4 text-slate-300">{q.policy_category}</td>
                        <td className="py-3 px-4 font-mono text-amber-400">{q.state_code}</td>
                        <td className="py-3 px-4 font-mono text-rose-400 font-semibold">
                          ${q.claim_amount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="px-2 py-1 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300 font-mono text-[11px]">
                            {q.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WAREHOUSE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Monthly Trend & Category Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Payout Trend Chart */}
              <div className="glass-panel p-6 rounded-xl border border-slate-800/80 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Monthly Claim Payouts & Volume Aggregates
                    </h3>
                    <p className="text-xs text-slate-400">
                      Analytical mart refreshed incrementally from fact_claims
                    </p>
                  </div>
                  <span className="text-xs text-cyan-400 font-mono font-semibold">
                    12-Month Horizon
                  </span>
                </div>

                {/* Bar Graph Simulation with CSS */}
                <div className="h-56 flex items-end gap-3 pt-6 px-2 border-b border-slate-800">
                  {analytics.monthly_trends.map((m, i) => {
                    const maxPayout = 8500000;
                    const heightPercent = Math.min(Math.round((m.total_payout / maxPayout) * 100), 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-blue-400 group-hover:from-cyan-400 group-hover:to-blue-300 transition-all"
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        <span className="text-[10px] font-mono text-slate-500 transform -rotate-45 origin-left group-hover:text-cyan-300 transition-colors">
                          {m.claim_year_month.slice(5)}
                        </span>

                        {/* Hover Tooltip */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-white pointer-events-none whitespace-nowrap z-20 shadow-xl font-mono">
                          Payout: ${(m.total_payout / 1000000).toFixed(2)}M • {m.claim_count} claims
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-4 px-2">
                  <span>Jan 2025</span>
                  <span className="font-mono text-cyan-400">Peak Month: Jul 2025 ($8.01M)</span>
                  <span>Dec 2025</span>
                </div>
              </div>

              {/* Policy Category Distribution */}
              <div className="glass-panel p-6 rounded-xl border border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  Portfolio Category Breakdown
                </h3>
                <p className="text-xs text-slate-400 mb-4">Volume & average loss ratio</p>

                <div className="space-y-4">
                  {analytics.category_distribution.map((cat, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-200">{cat.policy_category}</span>
                        <span className="font-mono text-cyan-300">
                          ${(cat.total_payout / 1000000).toFixed(1)}M ({cat.claim_count.toLocaleString()} claims)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                          style={{
                            width: `${(cat.claim_count / 10000) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Loss Ratio: {cat.avg_loss_ratio}</span>
                        <span>Share: {Math.round((cat.claim_count / 25000) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Severity Tiers & Top States */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Severity Tiers */}
              <div className="glass-panel p-6 rounded-xl border border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-4">Claim Severity Stratification</h3>
                <div className="grid grid-cols-2 gap-3">
                  {analytics.severity_tiers.map((tier, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all"
                    >
                      <span className="text-[11px] font-medium text-slate-400">{tier.severity_tier}</span>
                      <div className="text-lg font-bold text-white font-mono mt-1">
                        {tier.count.toLocaleString()}
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400">
                        ${(tier.total_amount / 1000000).toFixed(1)}M Total
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* State Performance */}
              <div className="glass-panel p-6 rounded-xl border border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-4">Top States by Claim Velocity</h3>
                <div className="space-y-2.5">
                  {analytics.state_performance.map((st, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded bg-slate-800 font-mono font-bold text-cyan-400 flex items-center justify-center">
                          {st.state_code}
                        </span>
                        <span className="text-slate-300">{st.claim_count.toLocaleString()} claims</span>
                      </div>
                      <div className="font-mono text-right">
                        <span className="text-white font-semibold">
                          ${(st.total_payout / 1000000).toFixed(2)}M
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Avg: ${st.avg_payout.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WAREHOUSE EXPLORER */}
        {activeTab === 'warehouse' && (
          <div className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search transaction ID, customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">All States</option>
                    <option value="CA">California (CA)</option>
                    <option value="TX">Texas (TX)</option>
                    <option value="FL">Florida (FL)</option>
                    <option value="NY">New York (NY)</option>
                    <option value="IL">Illinois (IL)</option>
                  </select>
                </div>
              </div>

              <span className="text-xs font-mono text-slate-400">
                Displaying {filteredWarehouseRecords.length} records • Indexed in fact_claims
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">TXN ID</th>
                    <th className="py-3 px-4">CUSTOMER ID</th>
                    <th className="py-3 px-4">CATEGORY</th>
                    <th className="py-3 px-4">STATE</th>
                    <th className="py-3 px-4">CLAIM DATE</th>
                    <th className="py-3 px-4">AMOUNT</th>
                    <th className="py-3 px-4">VELOCITY (DAYS)</th>
                    <th className="py-3 px-4">SEVERITY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredWarehouseRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-cyan-300">{r.transaction_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{r.customer_id}</td>
                      <td className="py-3 px-4 text-slate-200">{r.policy_category}</td>
                      <td className="py-3 px-4 font-mono text-cyan-400">{r.state_code}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{r.claim_date}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                        ${r.claim_amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {r.settlement_velocity_days} days
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {r.severity_tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ARCHITECTURE & AIRFLOW */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-slate-800/80">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Data Engineering Architecture Specification
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                End-to-end data pipeline flow from raw stream generation to analytics mart serving
              </p>

              <div className="p-4 rounded-lg bg-slate-950 font-mono text-xs text-cyan-300 overflow-x-auto border border-slate-800 leading-relaxed">
                <pre>{`[Raw Transaction Feed (25k+ records)]
         │
         ▼
[Task 1: extract_claims_feed] ──────────► Ingestion & Schema Type Validation
         │
         ▼
[Task 2: validate_quality_gates] ───────► Great Expectations Invariant Check
         │                                 ├── Passed -> Transform Stream
         │                                 └── Failed -> Quarantined DLQ (quarantined_records.csv)
         ▼
[Task 3: transform_and_enrich_features] ─► Pandas Feature Engineering
         │                                 ├── loss_ratio = claim_amount / premium
         │                                 ├── settlement_velocity = settlement_date - incident_date
         │                                 └── severity_tier classification
         ▼
[Task 4: load_to_data_warehouse] ───────► SQLite / PostgreSQL Warehouse
         │                                 ├── fact_claims (B-tree indexed on state, category, year_month)
         │                                 └── pipeline_runs (Audit log table)
         ▼
[Task 5: refresh_analytical_marts] ─────► Aggregations & Analytical Serving
                                           ├── Monthly financial trends
                                           ├── Portfolio category loss ratios
                                           └── State volume & performance metrics`}</pre>
              </div>
            </div>

            {/* Airflow Code Snippet */}
            <div className="glass-panel p-6 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-cyan-400">
                  dags/claims_pipeline_dag.py (Production Ready)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  PythonOperator • Daily Schedule • 2 Retries
                </span>
              </div>
              <div className="p-4 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800 max-h-72">
                <pre>{`with DAG(
    'enterprise_claims_etl_pipeline',
    default_args=default_args,
    description='Production ETL pipeline with Great Expectations gates',
    schedule_interval='@daily',
    catchup=False,
) as dag:
    extract_task = PythonOperator(task_id='extract_claims_feed', python_callable=task_extract_claims)
    quality_gate_task = PythonOperator(task_id='validate_quality_gates', python_callable=task_run_quality_checks)
    transform_task = PythonOperator(task_id='transform_and_enrich_features', python_callable=task_transform_features)
    load_warehouse_task = PythonOperator(task_id='load_to_data_warehouse', python_callable=task_load_warehouse)
    aggregate_marts_task = PythonOperator(task_id='refresh_analytical_marts', python_callable=task_aggregate_marts)

    extract_task >> quality_gate_task >> transform_task >> load_warehouse_task >> aggregate_marts_task`}</pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Trigger Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-cyan-500/30 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                Configure Pipeline Run
              </h3>
              <button
                onClick={() => setShowRunModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Record Batch Volume:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[10000, 25000, 50000].map((size) => (
                    <button
                      key={size}
                      onClick={() => setBatchSize(size)}
                      className={`py-2 px-3 rounded-lg border font-mono font-medium text-center transition-all ${
                        batchSize === size
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {size.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">Inject Synthetic Anomalies</span>
                  <span className="text-[11px] text-slate-400">
                    Tests Great Expectations quarantine routing (negative amounts, chronological inversions)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={injectAnomalies}
                  onChange={(e) => setInjectAnomalies(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-800 border-slate-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowRunModal(false)}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={triggerPipelineExecution}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Execute Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>DataStream ETL Studio • Insurance Analytics Engineering Showcase</span>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Pandas 2.2</span>
          <span>•</span>
          <span>Apache Airflow Ready</span>
          <span>•</span>
          <span>SQLite / PostgreSQL Fact Marts</span>
        </div>
      </footer>
    </div>
  );
}
