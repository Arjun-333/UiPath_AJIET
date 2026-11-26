import { chromium } from '../../../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSceneHtml(job) {
  const {
    width = 1920,
    height = 1080,
    sceneIndex = 0,
    totalScenes = 6,
    activeStep = 0,
    topic = 'UiPath Studio Automation',
    chapter = 'Chapter 1',
    title = 'Automation Walkthrough',
    visualType = 'studio_ide_walkthrough',
    points = []
  } = job;

  const p0 = escapeHtml(points[0] || `Initialize ${topic} scope`);
  const p1 = escapeHtml(points[1] || 'Configure modern unified selectors');
  const p2 = escapeHtml(points[2] || 'Validate data schema and queues');
  const p3 = escapeHtml(points[3] || 'Publish verified package to Orchestrator');
  const safeTopic = escapeHtml(topic);
  const safeChapter = escapeHtml(chapter);
  const safeTitle = escapeHtml(title);
  const progressPct = Math.round(((sceneIndex + 1) / Math.max(1, totalScenes)) * 100);

  let bodyContent = '';

  if (visualType === 'challenge_comparison') {
    bodyContent = `
      <div class="grid-2">
        <div class="glass-card ${activeStep === 0 ? 'glow-rose' : 'dimmed'}">
          <div class="card-header bg-rose">MANUAL LEGACY PROCESS</div>
          <div class="card-body list-stack">
            <div class="list-item rose-item"><span class="dot rose"></span>Slow manual handling for <strong>${safeTopic}</strong></div>
            <div class="list-item rose-item"><span class="dot rose"></span>12% human error rate in repetitive data entry</div>
            <div class="list-item rose-item"><span class="dot rose"></span>Severe backlog accumulation during peak load</div>
            <div class="list-item rose-item"><span class="dot rose"></span>Zero structured audit trail or SLA telemetry</div>
          </div>
        </div>
        <div class="glass-card ${activeStep >= 1 ? 'glow-emerald' : ''}">
          <div class="card-header bg-emerald">AUTONOMIA UIPATH PIPELINE</div>
          <div class="card-body list-stack">
            ${[p0, p1, p2, p3].map((pt, i) => `
              <div class="list-item emerald-item ${activeStep >= 1 && i === Math.min(activeStep, 3) ? 'active-row' : ''}">
                <span class="badge-step">${i + 1}</span>
                <span>${pt}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="pipeline-bar ${activeStep === 2 ? 'glow-cyan' : ''}">
        <span class="mono cyan">PIPELINE [${safeTopic}]:</span>
        <span class="pipe-node ${activeStep === 0 ? 'pipe-active' : ''}">Trigger</span>
        <span class="arrow">→</span>
        <span class="pipe-node ${activeStep === 1 ? 'pipe-active' : ''}">Extract &amp; Validate</span>
        <span class="arrow">→</span>
        <span class="pipe-node ${activeStep === 2 ? 'pipe-active' : ''}">Automate &amp; Report</span>
      </div>
    `;
  } else if (visualType === 'studio_ide_walkthrough') {
    const nodes = [p0, p1, p2];
    bodyContent = `
      <div class="ide-shell">
        <div class="ide-ribbon">
          <span class="ide-logo">UiPath Studio</span>
          <span class="ide-tab active">Design</span>
          <span class="ide-tab">Debug</span>
          <span class="ide-tab">Manage Packages</span>
          <span class="ide-tab">UI Explorer</span>
          <span class="ide-tab">Data Manager</span>
        </div>
        <div class="ide-columns">
          <div class="ide-sidebar">
            <div class="panel-title">ACTIVITIES</div>
            <div class="tree-group">▼ Modern UI Automation</div>
            <div class="tree-item">[+] Use App / Browser</div>
            <div class="tree-item">[+] Click / Type Into</div>
            <div class="tree-item">[+] Table Extraction</div>
            <div class="tree-group">▼ System &amp; Workflow</div>
            <div class="tree-item">[+] Try Catch Handler</div>
            <div class="tree-item">[+] Add Queue Item</div>
            <div class="tree-item">[+] Log Message</div>
          </div>
          <div class="ide-canvas">
            <div class="panel-title">Main.xaml — ${safeTitle}</div>
            <div class="sequence-box">
              <div class="seq-header">Sequence: ${safeTopic}</div>
              <div class="seq-nodes">
                ${nodes.map((n, i) => `
                  <div class="seq-node ${activeStep === i ? 'node-active' : ''}">
                    <div class="node-badge">${activeStep === i ? 'ACTIVE' : `STEP ${i + 1}`}</div>
                    <div class="node-title">${n}</div>
                    <div class="node-sub">InputMode: Modern • Fuzzy Selector Enabled</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="ide-props">
            <div class="panel-title">PROPERTIES</div>
            <div class="prop-row"><span>ActiveNode</span><strong class="emerald">Step ${activeStep + 1}</strong></div>
            <div class="prop-row"><span>InputMode</span><strong>Modern</strong></div>
            <div class="prop-row"><span>SimulateType</span><strong>True</strong></div>
            <div class="prop-row"><span>VerifyExecution</span><strong>True</strong></div>
            <div class="prop-row"><span>FuzzyAccuracy</span><strong>0.85</strong></div>
            <div class="prop-row"><span>TimeoutMS</span><strong>30000</strong></div>
          </div>
        </div>
      </div>
    `;
  } else if (visualType === 'workflow_sequence_builder') {
    const steps = [p0, p1, p2, p3];
    bodyContent = `
      <div class="grid-workflow">
        <div class="glass-card">
          <div class="card-header bg-orange">WORKFLOW SEQUENCE DESIGNER</div>
          <div class="card-body wf-stack">
            ${steps.map((st, i) => `
              <div class="wf-node ${i === activeStep || (activeStep === 2 && i === 3) ? 'wf-active' : ''}">
                <div class="wf-num">${i + 1}</div>
                <div>
                  <div class="wf-title">${st}</div>
                  <div class="wf-sub">${i === activeStep ? 'Executing &amp; validating selector...' : 'Ready in sequence'}</div>
                </div>
              </div>
              ${i < 3 ? '<div class="wf-connector">↓</div>' : ''}
            `).join('')}
          </div>
        </div>
        <div class="glass-card">
          <div class="card-header bg-cyan">UI EXPLORER &amp; SELECTOR TUNING</div>
          <div class="card-body">
            <div class="code-block">
              <div><span class="c-pink">&lt;workflow</span> <span class="c-cyan">topic</span>=<span class="c-amber">"${safeTopic}"</span> <span class="c-pink">/&gt;</span></div>
              <div><span class="c-pink">&lt;webctrl</span> <span class="c-cyan">step</span>=<span class="c-amber">"${activeStep + 1}"</span> <span class="c-cyan">state</span>=<span class="c-emerald">"verified"</span> <span class="c-pink">/&gt;</span></div>
              <div><span class="c-pink">&lt;fuzzySelector</span> <span class="c-cyan">confidence</span>=<span class="c-emerald">"0.94"</span> <span class="c-pink">/&gt;</span></div>
            </div>
            <div class="checks-list">
              <div class="check-row"><span class="ok">OK</span> Strict Native &amp; Web Selector</div>
              <div class="check-row"><span class="ok">OK</span> Fuzzy Element Match (0.85+)</div>
              <div class="check-row"><span class="ok">OK</span> Computer Vision Anchor Fallback</div>
              <div class="check-row"><span class="ok">OK</span> Try-Catch Retry Scope Active</div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (visualType === 'variables_data_manager') {
    bodyContent = `
      <div class="stack-2">
        <div class="glass-card">
          <div class="card-header bg-slate">DATA MANAGER &amp; ARGUMENTS — ${safeTopic}</div>
          <div class="card-body">
            <table class="data-table">
              <thead><tr><th>VARIABLE</th><th>TYPE</th><th>SCOPE</th><th>VALUE</th></tr></thead>
              <tbody>
                <tr class="${activeStep === 0 ? 'tr-active' : ''}"><td class="cyan mono">dt_PipelineRecords</td><td class="amber mono">DataTable</td><td>Main Sequence</td><td class="emerald">Loaded</td></tr>
                <tr class="${activeStep === 1 ? 'tr-active' : ''}"><td class="cyan mono">in_WorkflowTopic</td><td class="amber mono">String</td><td>Process Scope</td><td>"${safeTopic.slice(0, 26)}"</td></tr>
                <tr class="${activeStep === 2 ? 'tr-active' : ''}"><td class="cyan mono">out_ValidationPass</td><td class="amber mono">Boolean</td><td>Process Scope</td><td class="emerald">True</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="glass-card">
          <div class="card-header bg-emerald">ORCHESTRATOR QUEUE TELEMETRY</div>
          <div class="card-body">
            <table class="data-table">
              <thead><tr><th>ITEM ID</th><th>WORKFLOW STAGE</th><th>CONFIDENCE</th><th>STATUS</th></tr></thead>
              <tbody>
                ${[p0, p1, p2, p3].map((pt, i) => `
                  <tr>
                    <td class="mono">TXN-${101 + i}</td>
                    <td>${pt}</td>
                    <td class="emerald mono">99.8%</td>
                    <td><span class="pill ${i <= activeStep ? 'pill-green' : 'pill-blue'}">${i <= activeStep ? 'COMPLETED' : 'QUEUED'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (visualType === 'live_execution_console') {
    const logs = [
      { tag: '[INF 00:01]', msg: `Initialized robot runtime for: ${safeTopic}`, cls: 'cyan' },
      { tag: '[INF 00:02]', msg: `Stage 1: ${p0}`, cls: 'emerald' },
      { tag: '[INF 00:03]', msg: `Stage 2: ${p1}`, cls: 'amber' },
      { tag: '[INF 00:04]', msg: `Stage 3: ${p2}`, cls: 'cyan' },
      { tag: '[INF 00:05]', msg: `Stage 4: ${p3}`, cls: 'emerald' },
      { tag: '[OK  00:06]', msg: 'Orchestrator queue dispatch & telemetry verified (0 errors).', cls: 'purple' }
    ];
    const visible = 3 + activeStep * 2;
    bodyContent = `
      <div class="glass-card terminal-card">
        <div class="card-header bg-dark flex-between">
          <span>UIPATH ROBOT EXECUTION CONSOLE // LIVE STREAM</span>
          <span class="pill pill-green">ROBOT ACTIVE (0 ERRORS)</span>
        </div>
        <div class="card-body terminal-body">
          ${logs.slice(0, visible).map((l, idx) => `
            <div class="log-line ${idx === visible - 1 ? 'log-latest' : ''}">
              <span class="mono ${l.cls}">${l.tag}</span>
              <span class="mono">${l.msg}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    bodyContent = `
      <div class="grid-2">
        <div class="glass-card ${activeStep === 0 ? 'glow-cyan' : ''}">
          <div class="card-header bg-cyan">ORCHESTRATOR PACKAGE PUBLISHED</div>
          <div class="card-body list-stack">
            <div class="list-item"><strong class="cyan">Topic:</strong> ${safeTopic}</div>
            <div class="list-item"><strong class="cyan">Runtime:</strong> Unattended Robot Fleet</div>
            <div class="list-item"><strong class="emerald">Status:</strong> QA Passed &amp; CEO Approved</div>
          </div>
        </div>
        <div class="glass-card ${activeStep === 1 ? 'glow-amber' : ''}">
          <div class="card-header bg-amber">3 GOLDEN RULES</div>
          <div class="card-body list-stack">
            <div class="list-item">1. ${p0}</div>
            <div class="list-item">2. ${p1}</div>
            <div class="list-item">3. ${p2}</div>
          </div>
        </div>
      </div>
      <div class="cta-banner ${activeStep === 2 ? 'glow-orange' : ''}">
        <div class="cta-title">UIPATH COMMUNITY AJIET // AUTONOMIA MEDIA</div>
        <div class="cta-sub">Complete workflow assets, subtitles &amp; chapters available in the Media Vault.</div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${width}px;
    height: ${height}px;
    background: radial-gradient(circle at 50% 42%, #162038 0%, #0b101d 55%, #060911 100%);
    color: #f1f5f9;
    font-family: 'Ubuntu', 'Inter', -apple-system, sans-serif;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .mono { font-family: 'Ubuntu Mono', 'JetBrains Mono', monospace; }
  .cyan { color: #38bdf8; }
  .emerald { color: #34d399; }
  .amber { color: #fbbf24; }
  .purple { color: #c084fc; }
  .topbar {
    height: 76px;
    background: linear-gradient(90deg, #ea580c 0%, #f97316 100%);
    padding: 0 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 8px 30px rgba(249, 115, 22, 0.25);
  }
  .brand { font-size: 28px; font-weight: 700; letter-spacing: 0.4px; color: #fff; }
  .chapter-pill {
    padding: 10px 22px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.4);
    font-size: 20px;
    font-weight: 600;
    color: #fff;
  }
  .topic-bar {
    margin: 26px 48px 18px;
    padding: 18px 28px;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(56, 189, 248, 0.25);
    font-size: 32px;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.5px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  }
  .stage {
    flex: 1;
    padding: 0 48px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
  }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  .grid-workflow { display: grid; grid-template-columns: 1.25fr 1fr; gap: 28px; }
  .stack-2 { display: flex; flex-direction: column; gap: 20px; }
  .glass-card {
    background: rgba(15, 23, 42, 0.82);
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  }
  .dimmed { opacity: 0.78; }
  .glow-rose { border-color: #f43f5e; box-shadow: 0 0 32px rgba(244, 63, 94, 0.25); }
  .glow-emerald { border-color: #10b981; box-shadow: 0 0 32px rgba(16, 185, 129, 0.25); }
  .glow-cyan { border-color: #38bdf8; box-shadow: 0 0 32px rgba(56, 189, 248, 0.28); }
  .glow-amber { border-color: #f59e0b; box-shadow: 0 0 32px rgba(245, 158, 11, 0.28); }
  .glow-orange { border-color: #f97316; box-shadow: 0 0 32px rgba(249, 115, 22, 0.3); }
  .card-header {
    padding: 16px 24px;
    font-size: 21px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.5px;
  }
  .flex-between { display: flex; align-items: center; justify-content: space-between; }
  .bg-rose { background: linear-gradient(90deg, #be123c, #e11d48); }
  .bg-emerald { background: linear-gradient(90deg, #047857, #10b981); }
  .bg-orange { background: linear-gradient(90deg, #c2410c, #f97316); }
  .bg-cyan { background: linear-gradient(90deg, #0369a1, #0284c7); }
  .bg-amber { background: linear-gradient(90deg, #b45309, #d97706); }
  .bg-slate { background: #1e293b; }
  .bg-dark { background: #0f172a; border-bottom: 1px solid #1e293b; }
  .card-body { padding: 24px; }
  .list-stack { display: flex; flex-direction: column; gap: 16px; }
  .list-item {
    display: flex; align-items: center; gap: 14px;
    font-size: 22px; line-height: 1.4; padding: 12px 16px;
    border-radius: 12px; background: rgba(30, 41, 59, 0.55);
  }
  .active-row {
    background: rgba(16, 185, 129, 0.18);
    border: 1px solid rgba(52, 211, 153, 0.6);
    color: #fff;
  }
  .dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  .dot.rose { background: #fb7185; }
  .badge-step {
    width: 32px; height: 32px; border-radius: 50%;
    background: #10b981; color: #022c22; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .pipeline-bar {
    padding: 18px 28px;
    border-radius: 14px;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(56, 189, 248, 0.3);
    display: flex; align-items: center; gap: 18px; font-size: 22px;
  }
  .pipe-node {
    padding: 8px 18px; border-radius: 10px;
    background: #1e293b; border: 1px solid #334155; color: #cbd5e1;
  }
  .pipe-active { background: #0284c7; border-color: #38bdf8; color: #fff; font-weight: 700; }
  .arrow { color: #38bdf8; font-weight: 700; }
  .ide-shell {
    background: #0f172a; border: 1px solid #334155; border-radius: 18px;
    overflow: hidden; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
  }
  .ide-ribbon {
    display: flex; align-items: center; gap: 22px; padding: 14px 24px;
    background: #1e293b; border-bottom: 1px solid #334155; font-size: 19px;
  }
  .ide-logo { font-weight: 700; color: #f97316; margin-right: 12px; }
  .ide-tab { color: #94a3b8; padding: 6px 12px; border-radius: 8px; }
  .ide-tab.active { background: rgba(249, 115, 22, 0.2); color: #fb923c; font-weight: 700; }
  .ide-columns { display: grid; grid-template-columns: 360px 1fr 340px; height: 500px; }
  .ide-sidebar, .ide-props { background: #0b1120; padding: 18px; border-right: 1px solid #1e293b; }
  .ide-props { border-right: none; border-left: 1px solid #1e293b; }
  .ide-canvas { padding: 18px 24px; background: #111827; }
  .panel-title { font-size: 16px; font-weight: 700; color: #38bdf8; margin-bottom: 14px; letter-spacing: 0.8px; }
  .tree-group { font-size: 18px; color: #38bdf8; font-weight: 700; margin: 14px 0 8px; }
  .tree-item { font-size: 17px; color: #cbd5e1; padding: 6px 10px; border-radius: 6px; }
  .sequence-box {
    border: 2px solid #f97316; border-radius: 14px; background: #0f172a; overflow: hidden;
  }
  .seq-header { background: #ea580c; color: #fff; padding: 10px 18px; font-size: 19px; font-weight: 700; }
  .seq-nodes { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .seq-node {
    padding: 14px 18px; border-radius: 12px; background: #1e293b;
    border: 1px solid #334155;
  }
  .node-active {
    background: rgba(16, 185, 129, 0.16); border: 2px solid #34d399;
    box-shadow: 0 0 24px rgba(16, 185, 129, 0.25);
  }
  .node-badge { font-size: 13px; font-weight: 700; color: #38bdf8; margin-bottom: 4px; }
  .node-title { font-size: 20px; font-weight: 700; color: #f8fafc; }
  .node-sub { font-size: 15px; color: #94a3b8; margin-top: 4px; }
  .prop-row {
    display: flex; justify-content: space-between; padding: 10px 0;
    border-bottom: 1px solid #1e293b; font-size: 17px; color: #cbd5e1;
  }
  .wf-stack { display: flex; flex-direction: column; align-items: stretch; gap: 6px; }
  .wf-node {
    display: flex; align-items: center; gap: 16px; padding: 14px 18px;
    border-radius: 12px; background: #1e293b; border: 1px solid #334155;
  }
  .wf-active { background: rgba(56, 189, 248, 0.16); border: 2px solid #38bdf8; }
  .wf-num {
    width: 34px; height: 34px; border-radius: 50%; background: #f97316; color: #fff;
    font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .wf-title { font-size: 20px; font-weight: 700; color: #fff; }
  .wf-sub { font-size: 15px; color: #94a3b8; }
  .wf-connector { text-align: center; color: #64748b; font-size: 18px; font-weight: 700; }
  .code-block {
    background: #060911; border: 1px solid #1e293b; border-radius: 12px;
    padding: 18px; font-family: 'Ubuntu Mono', monospace; font-size: 19px;
    line-height: 1.7; margin-bottom: 20px;
  }
  .c-pink { color: #fb7185; }
  .c-cyan { color: #38bdf8; }
  .c-amber { color: #fbbf24; }
  .c-emerald { color: #34d399; }
  .checks-list { display: flex; flex-direction: column; gap: 12px; font-size: 19px; }
  .check-row { display: flex; align-items: center; gap: 12px; }
  .ok {
    padding: 2px 10px; border-radius: 6px; background: rgba(16, 185, 129, 0.2);
    color: #34d399; font-weight: 700; font-size: 14px;
  }
  .data-table { width: 100%; border-collapse: collapse; font-size: 19px; }
  .data-table th {
    text-align: left; padding: 10px 14px; background: #1e293b; color: #cbd5e1; font-size: 16px;
  }
  .data-table td { padding: 11px 14px; border-bottom: 1px solid #1e293b; }
  .tr-active { background: rgba(56, 189, 248, 0.14); }
  .pill { padding: 4px 12px; border-radius: 999px; font-size: 14px; font-weight: 700; }
  .pill-green { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.4); }
  .pill-blue { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
  .terminal-card { min-height: 490px; }
  .terminal-body { display: flex; flex-direction: column; gap: 16px; padding: 28px; }
  .log-line { display: flex; gap: 18px; font-size: 21px; padding: 10px 14px; border-radius: 10px; background: rgba(15, 23, 42, 0.6); }
  .log-latest { background: rgba(16, 185, 129, 0.14); border-left: 4px solid #34d399; }
  .cta-banner {
    padding: 24px 32px; border-radius: 16px;
    background: linear-gradient(90deg, rgba(234, 88, 12, 0.25), rgba(15, 23, 42, 0.9));
    border: 1px solid rgba(249, 115, 22, 0.5);
  }
  .cta-title { font-size: 24px; font-weight: 700; color: #fb923c; margin-bottom: 6px; }
  .cta-sub { font-size: 20px; color: #e2e8f0; }
  .caption-dock {
    height: 210px;
    margin: 18px 48px 0;
    padding: 18px 28px;
    border-radius: 16px 16px 0 0;
    background: rgba(8, 12, 20, 0.88);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-bottom: none;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .caption-meta { font-size: 16px; font-weight: 700; color: #64748b; letter-spacing: 1px; }
  .footer {
    height: 46px;
    background: #060911;
    padding: 0 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
    color: #94a3b8;
  }
  .progress-track {
    width: 65%;
    height: 8px;
    background: #1e293b;
    border-radius: 999px;
    overflow: hidden;
  }
  .progress-fill {
    width: ${progressPct}%;
    height: 100%;
    background: linear-gradient(90deg, #ea580c, #fbbf24);
  }
</style>
</head>
<body>
  <div class="topbar">
    <div class="brand">UiPath Community AJIET | Autonomia Production Studio</div>
    <div class="chapter-pill">${safeChapter}</div>
  </div>
  <div class="topic-bar">TOPIC: ${safeTitle}</div>
  <div class="stage">${bodyContent}</div>
  <div class="caption-dock">
    <div class="caption-meta">SCENE ${sceneIndex + 1} OF ${totalScenes} • LIVE NARRATION CAPTIONS</div>
  </div>
  <div class="footer">
    <span>Autonomia Masterclass • 1080p Studio Render</span>
    <div class="progress-track"><div class="progress-fill"></div></div>
  </div>
</body>
</html>`;
}

async function runFrames(jobs) {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  for (const job of jobs) {
    if (job.width && job.height) {
      await page.setViewportSize({ width: job.width, height: job.height });
    }
    const html = buildSceneHtml(job);
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: job.outputPath, fullPage: false });
  }
  await browser.close();
}

async function runDemoRecording(demoJob) {
  const { outputDir, topic = 'UiPath Studio Automation', width = 1280, height = 720 } = demoJob;
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width, height },
    recordVideo: { dir: outputDir, size: { width, height } }
  });
  const page = await context.newPage();

  const safeTopic = escapeHtml(topic);
  await page.setContent(`<!DOCTYPE html><html><head><style>
    body { margin:0; background:#080c14; color:#f1f5f9; font-family:Ubuntu,sans-serif; padding:40px; }
    .card { background:#0f172a; border:1px solid #334155; border-radius:16px; padding:28px; max-width:920px; margin:0 auto; }
    h1 { color:#38bdf8; font-size:26px; margin:0 0 18px; }
    .row { display:flex; gap:14px; margin-bottom:20px; }
    input { flex:1; padding:12px 16px; border-radius:10px; border:1px solid #475569; background:#020617; color:#fff; font-size:16px; }
    button { padding:12px 24px; border-radius:10px; border:none; background:#f97316; color:#fff; font-weight:700; font-size:16px; cursor:pointer; }
    table { width:100%; border-collapse:collapse; margin-top:14px; }
    th, td { padding:10px 14px; border-bottom:1px solid #1e293b; text-align:left; font-size:15px; }
    th { background:#1e293b; color:#94a3b8; }
    .ok { color:#34d399; font-weight:700; }
    #cursor { position:fixed; width:18px; height:18px; border-radius:50%; background:rgba(249,115,22,0.85); border:2px solid #fff; pointer-events:none; transition:all 0.35s ease; left:40px; top:40px; }
  </style></head><body>
    <div id="cursor"></div>
    <div class="card">
      <h1>Autonomia Live Automation Portal — ${safeTopic}</h1>
      <div class="row">
        <input id="topicInput" placeholder="Enter automation target..." />
        <button id="runBtn" onclick="runBot()">Run Robot</button>
      </div>
      <div id="status" style="color:#94a3b8;font-size:15px;">Status: Waiting for trigger...</div>
      <table id="tbl"><thead><tr><th>Record</th><th>Stage</th><th>Confidence</th><th>Result</th></tr></thead><tbody></tbody></table>
    </div>
    <script>
      window.moveCursor = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const c = document.getElementById('cursor');
        c.style.left = (r.left + r.width/2) + 'px';
        c.style.top = (r.top + r.height/2) + 'px';
      };
      window.runBot = () => {
        document.getElementById('status').innerText = 'Status: Robot executing workflow...';
        const tbody = document.querySelector('#tbl tbody');
        const rows = [
          ['TXN-201', 'Initialize & Attach Target', '99.9%', 'VERIFIED'],
          ['TXN-202', 'Extract Structured Fields', '99.7%', 'VERIFIED'],
          ['TXN-203', 'Push to Orchestrator Queue', '100.0%', 'COMPLETED']
        ];
        rows.forEach((r, i) => {
          setTimeout(() => {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td>'+r[0]+'</td><td>'+r[1]+'</td><td class="ok">'+r[2]+'</td><td class="ok">'+r[3]+'</td>';
            tbody.appendChild(tr);
            if (i === rows.length - 1) {
              document.getElementById('status').innerText = 'Status: Completed with 0 errors.';
            }
          }, (i + 1) * 700);
        });
      };
    </script>
  </body></html>`);

  await page.waitForTimeout(400);
  await page.evaluate(() => window.moveCursor('#topicInput'));
  await page.waitForTimeout(450);
  await page.fill('#topicInput', topic.slice(0, 48));
  await page.waitForTimeout(350);
  await page.evaluate(() => window.moveCursor('#runBtn'));
  await page.waitForTimeout(450);
  await page.click('#runBtn');
  await page.waitForTimeout(2600);

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  console.log(JSON.stringify({ demoVideoPath: videoPath }));
}

const configPath = process.argv[2];
if (!configPath || !fs.existsSync(configPath)) {
  console.error('Usage: node chrome_scene_renderer.mjs <config.json>');
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
if (payload.mode === 'demo') {
  await runDemoRecording(payload);
} else {
  await runFrames(payload.jobs || []);
}
