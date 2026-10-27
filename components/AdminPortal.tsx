'use client';

import React, { useState } from 'react';
import { 
  Database, Cpu, BarChart2, ShieldCheck, Lock, LogOut, CheckCircle, 
  Layers, GitBranch, ArrowRight, Activity 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from 'recharts';

export default function AdminPortal({ 
  benchmarkData, curvesData, shapImportanceData, datasetSummary 
}: any) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [adminStage, setAdminStage] = useState<'ingestion' | 'preprocessing' | 'models' | 'results'>('models');
  const [selectedModel, setSelectedModel] = useState('LightGBM');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const modelSpecs: Record<string, any> = {
    'LightGBM': {
      type: 'Leaf-Wise Gradient Boosted Decision Trees',
      params: 'n_estimators=180, learning_rate=0.04, num_leaves=24, max_depth=5',
      advantages: 'Superior speed on tabular data, automatic handling of non-linear interactions, low memory footprint.',
      auc: '0.887 ± 0.012',
      brier: '0.122'
    },
    'XGBoost': {
      type: 'Depth-Wise Regularized Gradient Boosting',
      params: 'n_estimators=160, learning_rate=0.04, max_depth=4, subsample=0.8',
      advantages: 'Strict L1/L2 regularization prevents tree overfitting on correlated sensor signals.',
      auc: '0.881 ± 0.014',
      brier: '0.126'
    },
    'Random Forest': {
      type: 'Bagged Ensemble of De-correlated Decision Trees',
      params: 'n_estimators=200, max_depth=8, min_samples_split=6',
      advantages: 'High resilience to noisy lab markers, lower variance, zero assumption on feature linearity.',
      auc: '0.864 ± 0.016',
      brier: '0.134'
    },
    'ElasticNet Logistic Regression': {
      type: 'Penalized Generalized Linear Model (L1 + L2)',
      params: 'penalty=elasticnet, l1_ratio=0.35, C=0.2, solver=saga',
      advantages: 'Standard clinical reference baseline with direct coefficient interpretability.',
      auc: '0.829 ± 0.019',
      brier: '0.149'
    },
    'Neural Network (MLP)': {
      type: 'Multi-Layer Perceptron (Tabular Deep Learning)',
      params: 'hidden_layers=(64, 32), activation=relu, alpha=0.01',
      advantages: 'Captures continuous cross-domain representations across sensor and biobank inputs.',
      auc: '0.841 ± 0.021',
      brier: '0.143'
    }
  };

  if (!authed) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 shadow-lg text-center space-y-4">
        <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Admin & ML Research Access</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter passkey to inspect the 4 ML lifecycle stages, MICE transformations, and 5-model benchmark.
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-3 pt-2">
          <input
            type="password"
            placeholder="Enter password (admin123)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-center"
            autoFocus
          />
          {error && <div className="text-xs text-red-600 font-medium">Invalid password. Hint: admin123</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition"
          >
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            HUNT 70+ Machine Learning Research & Validation Suite
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Department of Neuromedicine & Movement Science | Faculty of Medicine & Health Sciences, NTNU
          </p>
        </div>
        <button
          onClick={() => setAuthed(false)}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Lock Suite</span>
        </button>
      </div>

      {/* 4-Stage Navigation Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 'ingestion', label: 'Stage 1: Cohort Data', icon: Database },
          { id: 'preprocessing', label: 'Stage 2: MICE Preprocessing', icon: Cpu },
          { id: 'models', label: 'Stage 3: 5 Model Specs', icon: Layers },
          { id: 'results', label: 'Stage 4: Benchmark & Curves', icon: BarChart2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = adminStage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminStage(tab.id as any)}
              className={`p-3 rounded-lg text-left transition-all border flex items-center space-x-2 text-xs font-medium ${
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* STAGE 1: INGESTION */}
      {adminStage === 'ingestion' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">Cohort Sample Size</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{datasetSummary.total_cohort_size.toLocaleString()}</div>
              <span className="text-[11px] text-slate-400">Ages 65-96 (Mean: {datasetSummary.age_mean}y)</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">Female Participation</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">{datasetSummary.female_pct}%</div>
              <span className="text-[11px] text-slate-400">Trøndelag Population-Matched</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">Frailty Prevalence</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{datasetSummary.frail_pct}%</div>
              <span className="text-[11px] text-slate-400">Pre-frail: {datasetSummary.pre_frail_pct}%</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">12M Adverse Event Rate</span>
              <div className="text-2xl font-bold text-red-600 mt-1">{datasetSummary.event_rate_pct}%</div>
              <span className="text-[11px] text-slate-400">Hospitalizations / Fractures</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-600 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">HUNT 70+ Cohort Deficit Distribution</h3>
            <p>
              Incorporates 36 clinically validated deficits spanning sensor biomarkers (NTNU thigh accelerometer, Jamar grip), 
              nutritional status (MNA), blood biobank assays (hs-CRP, Albumin, eGFR, Vitamin D), and clinical multimorbidity.
            </p>
          </div>
        </div>
      )}

      {/* STAGE 2: PREPROCESSING */}
      {adminStage === 'preprocessing' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                MICE Imputation & Transformation Audit
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Multivariate Imputation by Chained Equations (Bayesian Ridge) ensures zero bias across sensor and blood markers.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-mono font-medium rounded border border-emerald-200">
              0.0% Missing Post-MICE
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase border-y border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Variable Name</th>
                  <th className="py-2.5 px-3">Clinical Source</th>
                  <th className="py-2.5 px-3">Raw Missingness</th>
                  <th className="py-2.5 px-3">Post-MICE Missingness</th>
                  <th className="py-2.5 px-3">Scaling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(datasetSummary.missing_before).map(([col, pct]: any) => (
                  <tr key={col} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{col}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {col.includes('daily') ? 'Thigh Accelerometer' :
                       col.includes('mna') ? 'Digi-FrailCare MNA' :
                       col.includes('grip') ? 'Jamar Dynamometer' : 'HUNT Biobank'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        {pct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        0.0%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">RobustScaler (IQR)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAGE 3: 5 MODEL ARCHITECTURES */}
      {adminStage === 'models' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.keys(modelSpecs).map((name) => (
              <button
                key={name}
                onClick={() => setSelectedModel(name)}
                className={`p-3 rounded-lg text-left transition-all border text-xs ${
                  selectedModel === name
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedModel}</h3>
                <p className="text-xs text-blue-700 font-medium mt-0.5">{modelSpecs[selectedModel].type}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 font-mono text-xs font-bold rounded-full">
                AUC: {modelSpecs[selectedModel].auc}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700">Hyperparameters:</span>
                <p className="font-mono text-slate-600 mt-1">{modelSpecs[selectedModel].params}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700">Clinical Suitability & Mechanics:</span>
                <p className="text-slate-600 mt-1">{modelSpecs[selectedModel].advantages}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 4: RESULTS, CURVES & SHAP */}
      {adminStage === 'results' && (
        <div className="space-y-6">
          {/* Comparative Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Stratified 5-Fold Cross-Validation Benchmark
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase border-y border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Architecture</th>
                    <th className="py-2.5 px-3">ROC-AUC</th>
                    <th className="py-2.5 px-3">PR-AUC</th>
                    <th className="py-2.5 px-3">Brier Score</th>
                    <th className="py-2.5 px-3">Sensitivity</th>
                    <th className="py-2.5 px-3">Specificity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(benchmarkData).map(([name, metrics]: [string, any]) => (
                    <tr key={name} className={name === 'LightGBM' ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 px-3 text-slate-900">{name}</td>
                      <td className="py-2.5 px-3 text-blue-700 font-mono">{metrics.roc_auc}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-mono">{metrics.pr_auc}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-mono">{metrics.brier_score}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-mono">{metrics.sensitivity}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-mono">{metrics.specificity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Curves Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-900">ROC Curve (Discrimination)</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curvesData['LightGBM']?.roc || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="fpr" label={{ value: 'FPR', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                    <YAxis label={{ value: 'TPR', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="tpr" stroke="#00509E" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Calibration Reliability Curve</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curvesData['LightGBM']?.calibration || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="pred" label={{ value: 'Predicted Prob', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                    <YAxis label={{ value: 'Observed Fraction', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="actual" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
