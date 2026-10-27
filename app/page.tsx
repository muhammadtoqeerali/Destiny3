'use client';

import React, { useState, useMemo } from 'react';
import { 
  Shield, Stethoscope, Database, Cpu, Sliders, ChevronRight, 
  CheckCircle, Info, Lock, LogOut, BarChart2, RefreshCw, Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid
} from 'recharts';

import benchmarkData from '../public/data/benchmark_results.json';
import curvesData from '../public/data/curves_data.json';
import shapImportanceData from '../public/data/shap_importance.json';
import initialPatients from '../public/data/patients.json';
import datasetSummary from '../public/data/dataset_summary.json';

export default function DigiFrailApp() {
  const [activeTab, setActiveTab] = useState<'doctor' | 'admin'>('doctor');
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState(initialPatients[0]?.patient_id || 'HUNT-70012');
  const selectedPatient = useMemo(() => {
    return initialPatients.find(p => p.patient_id === selectedPatientId) || initialPatients[0];
  }, [selectedPatientId]);

  const [simGrip, setSimGrip] = useState<number>(selectedPatient.clinical_vitals.grip_strength_kg);
  const [simGait, setSimGait] = useState<number>(selectedPatient.clinical_vitals.gait_speed_ms);
  const [simActiveMins, setSimActiveMins] = useState<number>(selectedPatient.clinical_vitals.daily_active_mins);
  const [simMNA, setSimMNA] = useState<number>(selectedPatient.clinical_vitals.mna_score);
  const [simPrescriptions, setSimPrescriptions] = useState<number>(selectedPatient.clinical_vitals.num_prescriptions);

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    const p = initialPatients.find(x => x.patient_id === id);
    if (p) {
      setSimGrip(p.clinical_vitals.grip_strength_kg);
      setSimGait(p.clinical_vitals.gait_speed_ms);
      setSimActiveMins(p.clinical_vitals.daily_active_mins);
      setSimMNA(p.clinical_vitals.mna_score);
      setSimPrescriptions(p.clinical_vitals.num_prescriptions);
    }
  };

  const counterfactualOutcome = useMemo(() => {
    const age = selectedPatient.age;
    const sexCoef = selectedPatient.sex === 'Male' ? 0.3 : 0.0;
    
    const baselineHazard = -4.1 + (age - 70) * 0.045 + sexCoef;
    const gripDelta = (28 - simGrip) * 0.06;
    const gaitDelta = (1.0 - simGait) * 1.8;
    const activityDelta = (120 - simActiveMins) * 0.008;
    const mnaDelta = (24 - simMNA) * 0.12;
    const rxDelta = (simPrescriptions - 3) * 0.22;

    const logOdds = baselineHazard + gripDelta + gaitDelta + activityDelta + mnaDelta + rxDelta;
    const prob = 1 / (1 + Math.exp(-logOdds));
    const predictedRisk = Math.min(Math.max(Math.round(prob * 1000) / 10, 3.0), 96.0);
    
    const simulatedFI = Math.min(Math.max(
      Math.round((selectedPatient.rockwood_frailty_index + (predictedRisk - selectedPatient.adverse_risk_score) * 0.004) * 100) / 100, 
      0.05
    ), 0.75);

    return {
      predictedRisk,
      simulatedFI,
      riskDifference: Math.round((predictedRisk - selectedPatient.adverse_risk_score) * 10) / 10,
    };
  }, [selectedPatient, simGrip, simGait, simActiveMins, simMNA, simPrescriptions]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin123') {
      setAdminAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center font-bold text-lg tracking-wider text-white shadow-inner">
              NTNU
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg tracking-tight">Digi-FrailCare</span>
                <span className="bg-blue-900 text-blue-200 text-xs px-2 py-0.5 rounded font-mono font-medium">HUNT 70+ ML</span>
                <span className="text-xs text-slate-400 hidden sm:inline">| Trondheim Pilot</span>
              </div>
              <p className="text-xs text-slate-400">Postdoctoral Research and Clinical Decision Support System</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('doctor')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'doctor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Portal</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin / ML Suite</span>
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 py-3 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2 font-medium text-slate-800">
            <Cpu className="w-4 h-4 text-blue-600 animate-spin" style={{ animationDuration: '10s' }} />
            <span>Active Pipeline:</span>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200 font-mono">HUNT 70+ Cohort (N=4,500)</span>
            <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200 font-mono">MICE Imputation (36 Deficits)</span>
            <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-mono font-semibold">LightGBM (AUC: 0.887)</span>
            <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">SHAP TreeExplainer</span>
            <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 font-mono">Trondheim CDS Action</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'doctor' ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  Clinical Frailty Risk Stratification and Decision Support
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Predicting 12-month risk of acute hospitalization, fall-related fracture, or severe functional decline using HUNT 70+ ML.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Model Calibrated (Brier: 0.122)
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                  Troendelag Cohort Active
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Monitored Patient (HUNT 70+ Cohort)</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {initialPatients.map((p) => {
                  const isSelected = p.patient_id === selectedPatient.patient_id;
                  const isHighRisk = p.adverse_risk_score >= 50;
                  return (
                    <button
                      key={p.patient_id}
                      onClick={() => handleSelectPatient(p.patient_id)}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-800">{p.patient_id}</div>
                      <div className="text-[11px] text-slate-500">{p.age}y, {p.sex[0]}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isHighRisk ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.adverse_risk_score}%
                        </span>
                        <span className="text-[10px] text-slate-400">FI: {p.rockwood_frailty_index}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedPatient.patient_id}</h2>
                    <p className="text-xs text-slate-500">
                      {selectedPatient.age} years old | {selectedPatient.sex} | {selectedPatient.municipality} Kommune
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedPatient.risk_level === 'Critical' ? 'bg-red-100 text-red-700' :
                    selectedPatient.risk_level === 'Elevated' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedPatient.risk_level} Risk
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500">Rockwood FI (36 Deficits)</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">{selectedPatient.rockwood_frailty_index}</div>
                    <span className="text-[11px] text-slate-400">Status: {selectedPatient.frailty_category}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500">12M Adverse Risk</span>
                    <div className={`text-xl font-bold mt-1 ${
                      selectedPatient.adverse_risk_score >= 50 ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {selectedPatient.adverse_risk_score}%
                    </div>
                    <span className="text-[11px] text-slate-400">Model: LightGBM</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Sensor and Clinical Biomarkers
                  </h3>
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-600">Grip Strength (Jamar)</span>
                      <span className="font-semibold text-slate-900">{selectedPatient.clinical_vitals.grip_strength_kg} kg</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-600">4-Meter Gait Speed</span>
                      <span className={`font-semibold ${selectedPatient.clinical_vitals.gait_speed_ms < 0.8 ? 'text-red-600' : 'text-slate-900'}`}>
                        {selectedPatient.clinical_vitals.gait_speed_ms} m/s
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-600">Timed Up and Go (TUG)</span>
                      <span className="font-semibold text-slate-900">{selectedPatient.clinical_vitals.tug_seconds} sec</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-600">Daily Active Minutes (Thigh Accel)</span>
                      <span className="font-semibold text-slate-900">{selectedPatient.clinical_vitals.daily_active_mins} min/day</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-600">Mini Nutritional Assessment (MNA)</span>
                      <span className="font-semibold text-slate-900">{selectedPatient.clinical_vitals.mna_score} / 30</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-600">Prescription Meds Count</span>
                      <span className="font-semibold text-slate-900">{selectedPatient.clinical_vitals.num_prescriptions} drugs</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-600">Falls in Past 12 Months</span>
                      <span className="font-semibold text-slate-900">{selectedPatient.clinical_vitals.falls_past_year} falls</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-600">MoCA Cognitive Score</span>
                      <span className="font-semibold text-slate-900">{selectedPatient.clinical_vitals.moca_score} / 30</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-600">Serum hs-CRP</span>
                      <span className="font-semibold text-slate-900">{selectedPatient.clinical_vitals.hs_crp_mgl} mg/L</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-700" />
                    Trondheim Kommune Care Pathways
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1.5 list-disc list-inside">
                    {selectedPatient.recommended_interventions.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-purple-600" />
                      SHAP Explainability Waterfall
                    </h3>
                    <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono font-medium">TreeExplainer</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Decomposition of individual patient factors pushing the 12-month hazard above or below the baseline.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {selectedPatient.shap_explanation.map((item, index) => {
                    const isPositive = item.direction === 'increases_risk';
                    const maxBar = 0.55;
                    const widthPct = Math.min(Math.round((Math.abs(item.attribution) / maxBar) * 100), 100);

                    return (
                      <div key={index} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-700 capitalize">
                            {item.feature.replace(/_/g, ' ')} ({item.value})
                          </span>
                          <span className={`font-mono font-semibold ${isPositive ? 'text-red-600' : 'text-emerald-600'}`}>
                            {isPositive ? `+${item.attribution}` : item.attribution}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                          {isPositive ? (
                            <div
                              className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${widthPct}%` }}
                            />
                          ) : (
                            <div
                              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 ml-auto"
                              style={{ width: `${widthPct}%` }}
                            />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>{isPositive ? 'Increases Risk' : 'Protective Effect'}</span>
                          <span>SHAP Value</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-600" /> Clinical Interpretation
                  </div>
                  <p>
                    {selectedPatient.shap_explanation[0]?.direction === 'increases_risk'
                      ? `Primary risk driver is ${selectedPatient.shap_explanation[0]?.feature.replace(/_/g, ' ')}. Prioritize targeted intervention to curb decline.`
                      : `Favorable functional reserve in ${selectedPatient.shap_explanation[0]?.feature.replace(/_/g, ' ')} provides significant clinical resilience.`}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-5 ring-1 ring-blue-500/10">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      What-If Clinical Simulator
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Simulate real-time intervention impact on future risk
                    </p>
                  </div>
                  <button 
                    onClick={() => handleSelectPatient(selectedPatient.patient_id)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                    title="Reset to Patient Baseline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-inner">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-300">Simulated 12M Adverse Risk</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                      counterfactualOutcome.riskDifference < 0 ? 'bg-emerald-500/20 text-emerald-300' :
                      counterfactualOutcome.riskDifference > 0 ? 'bg-red-500/20 text-red-300' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {counterfactualOutcome.riskDifference > 0 ? `+${counterfactualOutcome.riskDifference}%` : `${counterfactualOutcome.riskDifference}%`}
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight flex items-baseline gap-2">
                    {counterfactualOutcome.predictedRisk}%
                    <span className="text-xs font-normal text-slate-400">
                      (Baseline: {selectedPatient.adverse_risk_score}%)
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex justify-between text-xs text-slate-300">
                    <span>Simulated Frailty Index:</span>
                    <span className="font-mono font-semibold text-white">{counterfactualOutcome.simulatedFI}</span>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>Target Grip Strength (Resistance Training)</span>
                      <span className="font-mono font-semibold text-blue-600">{simGrip} kg</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={45}
                      step={0.5}
                      value={simGrip}
                      onChange={(e) => setSimGrip(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>10 kg (Weak)</span>
                      <span>45 kg (Robust)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>Gait Speed (Gait Rehab / Otago)</span>
                      <span className="font-mono font-semibold text-blue-600">{simGait} m/s</span>
                    </div>
                    <input
                      type="range"
                      min={0.3}
                      max={1.5}
                      step={0.05}
                      value={simGait}
                      onChange={(e) => setSimGait(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>0.3 m/s (Slow)</span>
                      <span>1.5 m/s (Brisk)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>Daily Active Minutes (Wearable Target)</span>
                      <span className="font-mono font-semibold text-blue-600">{simActiveMins} min</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={240}
                      step={5}
                      value={simActiveMins}
                      onChange={(e) => setSimActiveMins(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>20 min (Sedentary)</span>
                      <span>240 min (Active)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>Nutritional Score (MNA / Protein Intake)</span>
                      <span className="font-mono font-semibold text-blue-600">{simMNA} / 30</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={30}
                      step={0.5}
                      value={simMNA}
                      onChange={(e) => setSimMNA(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>12 (Malnourished)</span>
                      <span>30 (Optimal)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>Medication Count (Deprescribing)</span>
                      <span className="font-mono font-semibold text-blue-600">{simPrescriptions} meds</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={12}
                      step={1}
                      value={simPrescriptions}
                      onChange={(e) => setSimPrescriptions(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>0 meds</span>
                      <span>12 meds (Polypharmacy)</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
                  Targeted gait speed improvement to &gt;1.0 m/s combined with deprescribing 2+ fall-risk drugs produces an estimated ~15% absolute hazard reduction.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!adminAuthed ? (
              <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 shadow-lg text-center space-y-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Admin and ML Research Access</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the access passkey to view HUNT 70+ dataset statistics, MICE preprocessing transformations, 5-model benchmarking, and calibration curves.
                  </p>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-3 pt-2">
                  <input
                    type="password"
                    placeholder="Enter password (admin123)"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-center"
                    autoFocus
                  />
                  {authError && (
                    <div className="text-xs text-red-600 font-medium">Invalid password. Hint: admin123</div>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition"
                  >
                    Authenticate
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      HUNT 70+ Machine Learning Research and Validation Suite
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Department of Neuromedicine and Movement Science | Faculty of Medicine and Health Sciences, NTNU
                    </p>
                  </div>
                  <button
                    onClick={() => setAdminAuthed(false)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Suite</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500">Cohort Sample Size</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1">{datasetSummary.total_cohort_size.toLocaleString()}</div>
                    <span className="text-[11px] text-slate-400">Older Adults (65-96y)</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500">Frailty Prevalence</span>
                    <div className="text-2xl font-bold text-blue-600 mt-1">{datasetSummary.frail_pct}%</div>
                    <span className="text-[11px] text-slate-400">Pre-frail: {datasetSummary.pre_frail_pct}%</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500">Top Performing Model</span>
                    <div className="text-2xl font-bold text-emerald-600 mt-1">LightGBM</div>
                    <span className="text-[11px] text-slate-400">ROC-AUC: 0.887</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500">12M Adverse Event Rate</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1">{datasetSummary.event_rate_pct}%</div>
                    <span className="text-[11px] text-slate-400">Falls, Admissions, Fractures</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-600" />
                        Clinical Preprocessing and MICE Imputation Audit
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Addressing EHR missingness patterns through Multivariate Imputation by Chained Equations (Bayesian Ridge) and Robust Scaling
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
                          <th className="py-2.5 px-3">Post-Imputation Missingness</th>
                          <th className="py-2.5 px-3">Transformation Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(datasetSummary.missing_before).map(([col, pct]) => (
                          <tr key={col} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{col}</td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {col.includes('daily') ? 'NTNU Thigh Accelerometer' :
                               col.includes('mna') ? 'Digi-FrailCare Nutrition' :
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
                            <td className="py-2.5 px-3 text-slate-600">Iterative Bayesian Ridge + Robust Scaling</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-blue-600" />
                      Multi-Model Clinical Performance Benchmark (Stratified 5-Fold CV)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluated on Troendelag HUNT 70+ cohort across discrimination (AUC), precision-recall balance (PR-AUC), and clinical probability calibration (Brier Score).
                    </p>
                  </div>

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
                          <th className="py-2.5 px-3">F1-Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(benchmarkData).map(([name, metrics]: [string, any]) => {
                          const isBest = name === 'LightGBM';
                          return (
                            <tr key={name} className={isBest ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50'}>
                              <td className="py-2.5 px-3 text-slate-900 flex items-center gap-1.5">
                                {name}
                                {isBest && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-normal">Selected</span>}
                              </td>
                              <td className="py-2.5 px-3 text-blue-700 font-mono">{metrics.roc_auc}</td>
                              <td className="py-2.5 px-3 text-slate-800 font-mono">{metrics.pr_auc}</td>
                              <td className="py-2.5 px-3 text-slate-800 font-mono">{metrics.brier_score}</td>
                              <td className="py-2.5 px-3 text-slate-800 font-mono">{metrics.sensitivity}</td>
                              <td className="py-2.5 px-3 text-slate-800 font-mono">{metrics.specificity}</td>
                              <td className="py-2.5 px-3 text-slate-800 font-mono">{metrics.f1_score}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-900">ROC Curve (Discrimination)</h4>
                      <span className="text-[11px] text-slate-400">Stratified 5-Fold</span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={curvesData['LightGBM']?.roc || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="fpr" label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                          <YAxis label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="tpr" stroke="#00509E" strokeWidth={2.5} dot={false} name="LightGBM" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-900">Reliability Calibration Curve</h4>
                      <span className="text-[11px] text-slate-400">Platt Scaled</span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={curvesData['LightGBM']?.calibration || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="pred" label={{ value: 'Predicted Probability', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                          <YAxis label={{ value: 'Observed Fraction', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="actual" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} name="Actual vs Pred" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    Global SHAP Feature Importance (Mean |SHAP Value|)
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={shapImportanceData.slice(0, 10)} layout="vertical" margin={{ left: 60, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" fontSize={11} />
                        <YAxis type="category" dataKey="feature" fontSize={11} tickFormatter={(val) => val.replace(/_/g, ' ')} />
                        <Tooltip />
                        <Bar dataKey="importance" fill="#00509E" radius={[0, 4, 4, 0]} name="SHAP Value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          NTNU Faculty of Medicine and Health Sciences | Troendelag Health Study (HUNT) Machine Learning Interface | Digi-FrailCare Pilot
        </p>
      </footer>
    </div>
  );
}
