'use client';

import React, { useState, useEffect } from 'react';
import { Database, Cpu, Zap, BarChart2, ShieldCheck, ChevronRight, Activity } from 'lucide-react';

export default function PipelineAnimation() {
  const [activeStage, setActiveStage] = useState(2); // Default to LightGBM

  const stages = [
    {
      id: 0,
      title: '1. Ingestion',
      subtitle: 'HUNT 70+ Sensors & Labs',
      icon: Database,
      detail: 'Continuous ingestion of 100Hz thigh accelerometer data, Jamar grip dynamometry, and HUNT biobank blood biomarkers across 4,500 participants.',
      metric: '4,500 Cohort | 36 Deficits'
    },
    {
      id: 1,
      title: '2. Preprocessing',
      subtitle: 'MICE & Robust Scaling',
      icon: Cpu,
      detail: 'Iterative Bayesian Ridge imputation resolves EHR missingness without introducing bias, paired with Robust scaling against extreme biomarker outliers.',
      metric: '0.0% Missing Post-MICE'
    },
    {
      id: 2,
      title: '3. ML Inference',
      subtitle: 'Calibrated LightGBM',
      icon: Zap,
      detail: 'Ensemble gradient boosted trees predict 12-month acute adverse events (fall fractures, unplanned admissions) with calibrated probabilities.',
      metric: 'ROC-AUC: 0.887 | Brier: 0.122'
    },
    {
      id: 3,
      title: '4. Explainability',
      subtitle: 'SHAP TreeExplainer',
      icon: BarChart2,
      detail: 'Patient-level Shapley additive attributions decompose individual risk drivers into positive amplifiers and protective factors in under 15ms.',
      metric: 'Local & Global Attributions'
    },
    {
      id: 4,
      title: '5. Action',
      subtitle: 'Trondheim CDS Pathways',
      icon: ShieldCheck,
      detail: 'Actionable municipal referrals: targeted Otago physiotherapy, clinical nutrition supplementation, and STOPP/START deprescribing protocols.',
      metric: 'Targeted Interventions'
    }
  ];

  // Auto-cycle through pipeline stages every 6 seconds if idle
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % stages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [stages.length]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </div>
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            Live Clinical AI Pipeline Architecture
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            [HUNT 70+ to Trondheim CDS]
          </span>
        </div>
        <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono font-medium">
          Latency: 14ms (Real-time)
        </span>
      </div>

      {/* Stepper Pipeline Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = stage.id === activeStage;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`p-3 rounded-lg text-left transition-all border text-xs relative ${
                isActive
                  ? 'border-blue-600 bg-blue-50/80 shadow-sm ring-1 ring-blue-500/30'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-mono text-slate-400">0{stage.id + 1}</span>
              </div>
              <div className="font-bold text-slate-900">{stage.title}</div>
              <div className="text-[11px] text-slate-500 truncate">{stage.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Expanded Active Stage Detail Banner */}
      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
        <div className="flex items-start sm:items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-slate-700">
            <strong>{stages[activeStage].subtitle}:</strong> {stages[activeStage].detail}
          </span>
        </div>
        <span className="px-2 py-1 rounded bg-white border border-slate-200 font-mono text-[11px] text-blue-800 font-semibold self-start sm:self-auto flex-shrink-0">
          {stages[activeStage].metric}
        </span>
      </div>
    </div>
  );
}
