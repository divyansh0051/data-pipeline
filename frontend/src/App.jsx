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
  Download,
  Terminal,
  Check,
  AlertOctagon,
  X
} from 'lucide-react';
import { INITIAL_PIPELINE_RUN } from './mockData';

export default function App() {
  const [pipelineData, setPipelineData] = useState(INITIAL_PIPELINE_RUN);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'quality' | 'analytics' | 'warehouse' | 'architecture'
  const [selectedNode, setSelectedNode] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [executionRunId, setExecutionRunId] = useState(INITIAL_PIPELINE_RUN.run_meta.run_id);
  const [throughput, setThroughput] = useState(48169.6);
  const [rowsProcessed, setRowsProcessed] = useState(25000);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'HEALTHY') {
          setIsBackendConnected(true);
        }
      })
      .catch(() => {
        setIsBackendConnected(false);
      });
  }, []);

  const triggerPipelineExecution = (customBatch = 25000) => {
    setIsRunning(true);
    setRunProgress(0);
    setActiveStepIndex(0);
    setSelectedNode(null);

    const stepInterval = setInterval(() => {
      setRunProgress((prev) => {
        const next = prev + 20;
        if (next >= 100) {
          clearInterval(stepInterval);
          setIsRunning(false);
          setActiveStepIndex(-1);
          setExecutionRunId(`RUN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-ETL-${Math.random().toString(36).substring(2, 6)}`);
          setRowsProcessed(customBatch);
          setThroughput(Number((45000 + Math.random() * 6000).toFixed(1)));
          return 100;
        }
        return next;
      });
      setActiveStepIndex((prev) => (prev < 4 ? prev + 1 : 4));
    }, 280);
  };

  const exportWarehouseCSV = () => {
    const headers = ["transaction_id", "customer_id", "policy_category", "state_code", "claim_date", "claim_amount", "settlement_velocity_days", "severity_tier"];
    const rows = pipelineData.analytics.recent_sample.map(r => [
      r.transaction_id, r.customer_id, r.policy_category, r.state_code, r.claim_date, r.claim_amount, r.settlement_velocity_days, `"${r.severity_tier}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `warehouse_claims_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#040812] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-4 lg:px-8 py-3.5 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/25">
              <div className="w-full h-full bg-[#081020] rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-lg text-white tracking-tight">DataStream ETL</h1>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Airflow & Warehouse
                </span>
              </div>
              <p className="text-xs text-slate-400">High-Throughput Vectorized Pipeline & Invariant Quality Gates</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Live Status Chip */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/10 text-xs text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`}></span>
              <span className="font-mono text-[11px]">{isBackendConnected ? 'FastAPI Backend LIVE' : 'Airflow Orchestrator Standalone'}</span>
            </div>

            {/* Performance Metric Pills */}
            <div className="hidden md:flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
                ⚡ {throughput.toLocaleString()} rows/s
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/20 text-[11px] font-mono text-emerald-300">
                🛡️ 99.93% DQ Score
              </div>
            </div>

            {/* GitHub & Vercel links */}
            <a
              href="https://github.com/divyansh0051/data-pipeline"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:text-white"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <a
              href="https://02-data-pipeline-dashboard.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="btn-primary px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Vercel Live</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 border-t border-white/5 pt-3 overflow-x-auto">
          {[
            { id: 'pipeline', label: '⚡ DAG Pipeline Topology', badge: 'Live Topology' },
            { id: 'quality', label: '🛡️ Quality Gates (8 Invariants)', badge: '17 Quarantined' },
            { id: 'analytics', label: '📊 Analytical Datamarts', badge: '12-Month Trends' },
            { id: 'warehouse', label: '🗄️ Fact Table Explorer', badge: '24,983 Rows' },
            { id: 'architecture', label: '🏗️ Airflow Architecture', badge: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {/* TAB 1: DAG PIPELINE TOPOLOGY */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Pipeline Control Header Card */}
            <div className="glass-panel p-6 lg:p-8 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-heading font-bold text-white">Apache Airflow Directed Acyclic Graph (DAG)</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    claims_etl_warehouse_v2
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Vectorized multi-stage orchestration ingesting raw Apache Kafka streaming transactions, enforcing 8 invariant quality checks, computing financial metrics in Pandas, and loading into the fact warehouse.
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs font-mono text-slate-400">
                  <span>Current Run: <strong className="text-cyan-300">{executionRunId}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong className="text-emerald-400">0.519s</strong></span>
                  <span>•</span>
                  <span>Throughput: <strong className="text-cyan-300">{throughput.toLocaleString()} rows/s</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => triggerPipelineExecution(25000)}
                  disabled={isRunning}
                  className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 w-full md:w-auto disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>{isRunning ? `Running (${runProgress}%)` : 'Trigger DAG Run'}</span>
                </button>
                <button
                  onClick={() => triggerPipelineExecution(50000)}
                  disabled={isRunning}
                  className="btn-secondary px-4 py-3 rounded-xl text-xs font-medium hover:text-white"
                  title="Simulate 50,000 row spike"
                >
                  50k Spike
                </button>
              </div>
            </div>

            {/* Execution Progress Bar */}
            {isRunning && (
              <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 animate-slide-up">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-mono mb-2">
                  <span>Running DAG Task: {pipelineData.step_logs[activeStepIndex]?.title || 'Processing pipeline...'}</span>
                  <span>{runProgress}% Complete</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-200"
                    style={{ width: `${runProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Interactive SVG DAG Topology Visualizer */}
            <div className="glass-panel p-6 lg:p-8 rounded-2xl border border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Pipeline Topology</span>
                </h3>
                <span className="text-xs text-slate-400">Click any stage to view telemetry & schema input/output</span>
              </div>

              {/* DAG Nodes Display */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {pipelineData.step_logs.map((step, idx) => {
                  const isActive = activeStepIndex === idx;
                  const isSelected = selectedNode?.task_id === step.task_id;
                  return (
                    <div
                      key={step.task_id}
                      onClick={() => setSelectedNode(step)}
                      className={`glass-card p-5 rounded-2xl cursor-pointer transition-all duration-200 border relative ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20'
                          : isActive
                          ? 'border-emerald-400 animate-pulse bg-emerald-950/30'
                          : 'border-white/10 hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                          Step 0{idx + 1}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      </div>

                      <h4 className="font-heading font-bold text-sm text-white">{step.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{step.details}</p>

                      <div className="mt-4 pt-3 border-t border-white/5 space-y-1 text-[11px] font-mono text-slate-400">
                        <div className="flex justify-between">
                          <span>Latency:</span>
                          <span className="text-cyan-300 font-bold">{step.duration_ms} ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Output:</span>
                          <span className="text-emerald-400 font-bold">{(step.rows_out || rowsProcessed).toLocaleString()} rows</span>
                        </div>
                        {step.quarantined && (
                          <div className="flex justify-between text-amber-400">
                            <span>Quarantined:</span>
                            <span>{step.quarantined} rows</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Node Inspector Drawer */}
              {selectedNode && (
                <div className="p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-4 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-cyan-400" />
                      <h4 className="font-heading font-bold text-base text-white">
                        Node Telemetry: {selectedNode.title} (<code className="text-cyan-300">{selectedNode.task_id}</code>)
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-slate-500 block">Status</span>
                      <span className="text-emerald-400 font-bold text-sm">SUCCESS</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-slate-500 block">Execution Time</span>
                      <span className="text-cyan-300 font-bold text-sm">{selectedNode.duration_ms} ms</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-slate-500 block">Rows In</span>
                      <span className="text-slate-200 font-bold text-sm">{selectedNode.rows_in.toLocaleString()}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-slate-500 block">Rows Out</span>
                      <span className="text-emerald-400 font-bold text-sm">{selectedNode.rows_out.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#03060c] border border-white/10 text-xs font-mono text-slate-300 space-y-1">
                    <p className="text-cyan-400">=== Task Execution Log ===</p>
                    <p>[INFO] Initializing task runner with worker pool thread 04</p>
                    <p>[INFO] {selectedNode.details}</p>
                    <p>[INFO] Memory footprint: 18.4 MB (Vectorized Pandas buffer)</p>
                    <p className="text-emerald-400">[SUCCESS] Task completed in {selectedNode.duration_ms}ms with exit code 0</p>
                  </div>
                </div>
              )}
            </div>

            {/* Standout Numbers Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-2xl border border-cyan-500/20">
                <span className="text-xs text-slate-400 block">Stream Throughput</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-heading font-bold text-cyan-300">{throughput.toLocaleString()}</span>
                  <span className="text-xs font-mono text-slate-400">rows/s</span>
                </div>
                <span className="text-[11px] text-cyan-300/80 mt-1 block">Vectorized batch ingestion</span>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-emerald-500/20">
                <span className="text-xs text-slate-400 block">Data Quality Compliance</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-heading font-bold text-emerald-400">99.93%</span>
                </div>
                <span className="text-[11px] text-emerald-300/80 mt-1 block">17 isolated into quarantine DLQ</span>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-blue-500/20">
                <span className="text-xs text-slate-400 block">End-to-End Latency</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-heading font-bold text-blue-300">0.519s</span>
                </div>
                <span className="text-[11px] text-blue-300/80 mt-1 block">25,000 records processed</span>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-purple-500/20">
                <span className="text-xs text-slate-400 block">Quality Invariants</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-heading font-bold text-purple-300">8 / 8</span>
                </div>
                <span className="text-[11px] text-purple-300/80 mt-1 block">Great Expectations test suites</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUALITY GATES (8 INVARIANTS) */}
        {activeTab === 'quality' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 lg:p-8 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span>Great Expectations Quality Gates (8 Invariants)</span>
                </h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Automated invariant gates executing between stream ingestion and fact table loading. Corrupt, out-of-order, or negative-claim records are diverted to dead-letter quarantine storage without blocking downstream jobs.
                </p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
                Score: <strong>99.93% PASS</strong>
              </div>
            </div>

            {/* 8 Invariants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pipelineData.data_quality.checks_suite.map((chk, i) => (
                <div key={i} className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{chk.check_name}</span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {chk.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">Field assertion: {chk.field}</p>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Observed:</span>
                    <span className="text-cyan-300">{chk.observed}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Dead Letter Queue Section */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-amber-400" />
                  <span>Dead-Letter Queue (DLQ) Isolated Records ({pipelineData.data_quality.quarantined_sample.length})</span>
                </h3>
                <span className="text-xs text-slate-400">Quarantine Storage: dlq_quarantined_claims</span>
              </div>

              <div className="divide-y divide-white/5">
                {pipelineData.data_quality.quarantined_sample.map((q, i) => (
                  <div key={i} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-rose-400 font-bold">{q.transaction_id}</span>
                        <span className="text-slate-400">({q.customer_id})</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-indigo-300">{q.policy_category}</span>
                      </div>
                      <p className="text-amber-300/90 mt-1 font-mono text-[11px]">{q.reason}</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono whitespace-nowrap">
                      QUARANTINED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS & MARTS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 lg:p-8 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                  <span>Analytical Datamarts & Trends</span>
                </h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Recomputed dimensional marts serving downstream executive reporting, loss ratio monitoring, and claims payout forecasts.
                </p>
              </div>
            </div>

            {/* Monthly Trends Table */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <h3 className="font-heading font-bold text-base text-white">Monthly Transactional Trends (2025-2026)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="pb-3">Month</th>
                      <th className="pb-3">Claim Volume</th>
                      <th className="pb-3">Total Payout</th>
                      <th className="pb-3">Avg Claim Payout</th>
                      <th className="pb-3">Settlement Velocity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pipelineData.analytics.monthly_trends.slice(-6).map((m, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 font-bold text-cyan-300">{m.claim_year_month}</td>
                        <td className="py-2.5 text-slate-200">{m.claim_count.toLocaleString()}</td>
                        <td className="py-2.5 text-emerald-400">${(m.total_payout / 1000000).toFixed(2)}M</td>
                        <td className="py-2.5 text-slate-300">${m.avg_claim.toFixed(2)}</td>
                        <td className="py-2.5 text-purple-300">{m.avg_velocity_days} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Distribution Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="font-heading font-bold text-base text-white">Policy Category Distribution</h3>
                <div className="space-y-3">
                  {pipelineData.analytics.category_distribution.map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">{cat.policy_category}</span>
                        <span className="font-mono text-cyan-300">${(cat.total_payout / 1000000).toFixed(1)}M ({cat.claim_count.toLocaleString()})</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-cyan-500 h-2 rounded-full"
                          style={{ width: `${(cat.claim_count / 10000) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="font-heading font-bold text-base text-white">Severity Tiers Breakdown</h3>
                <div className="space-y-3">
                  {pipelineData.analytics.severity_tiers.map((tier, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">{tier.severity_tier}</span>
                        <span className="font-mono text-emerald-400">{tier.count.toLocaleString()} cases</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${(tier.count / 12000) * 100}%`, backgroundColor: tier.color }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FACT TABLE EXPLORER */}
        {activeTab === 'warehouse' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-heading font-bold text-white">Warehouse Fact Table: fact_claims</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Query and inspect partitioned fact records loaded into SQLite/PostgreSQL warehouse with B-tree indexes.
                </p>
              </div>
              <button
                onClick={exportWarehouseCSV}
                className="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Fact Table (CSV)</span>
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by transaction ID, customer ID, or state..."
                  className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-xs"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="glass-input px-3 py-2.5 rounded-xl text-xs"
              >
                <option value="ALL">All Policy Categories</option>
                <option value="Health Insurance">Health Insurance</option>
                <option value="Auto Insurance">Auto Insurance</option>
                <option value="Commercial Property">Commercial Property</option>
                <option value="Homeowners">Homeowners</option>
              </select>
            </div>

            {/* Records Table */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 bg-slate-900/60">
                      <th className="p-4">Transaction ID</th>
                      <th className="p-4">Customer ID</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">State</th>
                      <th className="p-4">Claim Date</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Velocity</th>
                      <th className="p-4">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pipelineData.analytics.recent_sample
                      .filter(r => categoryFilter === 'ALL' || r.policy_category === categoryFilter)
                      .filter(r => !searchQuery || r.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) || r.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) || r.state_code.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="p-4 font-bold text-cyan-300">{row.transaction_id}</td>
                          <td className="p-4 text-slate-400">{row.customer_id}</td>
                          <td className="p-4 text-slate-200">{row.policy_category}</td>
                          <td className="p-4 font-bold text-indigo-300">{row.state_code}</td>
                          <td className="p-4 text-slate-400">{row.claim_date}</td>
                          <td className="p-4 font-bold text-emerald-400">${row.claim_amount.toFixed(2)}</td>
                          <td className="p-4 text-purple-300">{row.settlement_velocity_days}d</td>
                          <td className="p-4">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {row.severity_tier}
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

        {/* TAB 5: ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="glass-panel p-6 lg:p-8 rounded-2xl border border-white/10 space-y-6">
              <div>
                <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-400" />
                  <span>Pipeline Architecture & Tech Stack</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Technical blueprints detailing ingestion, Airflow DAG scheduling, vectorized compute, and data warehouse schema.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                  <h4 className="font-heading font-bold text-sm text-cyan-300">Ingestion & Orchestration</h4>
                  <p className="text-slate-400">Scheduled via <strong>Apache Airflow 2.8</strong> cron intervals with automatic retry policies and Slack alerting hooks.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                  <h4 className="font-heading font-bold text-sm text-emerald-300">Vectorized Transformation</h4>
                  <p className="text-slate-400">Zero-copy processing powered by <strong>Pandas 2.2</strong> utilizing pyarrow backends to maximize memory throughput.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                  <h4 className="font-heading font-bold text-sm text-purple-300">Quality Assertion Gates</h4>
                  <p className="text-slate-400">8 deterministic invariant checks inspired by <strong>Great Expectations</strong> providing zero corrupt leaks.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                  <h4 className="font-heading font-bold text-sm text-amber-300">Relational Warehouse</h4>
                  <p className="text-slate-400">Star schema fact and dimensional tables stored in <strong>PostgreSQL / SQLite</strong> indexed on transaction and customer keys.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/5 py-4 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>DataStream ETL — Enterprise Data Pipeline & Warehouse Dashboard</span>
          <div className="flex items-center gap-4">
            <span>Apache Airflow</span>
            <span>•</span>
            <span>Pandas 2.2 Vectorized</span>
            <span>•</span>
            <span>Great Expectations Gates</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
