'use client';

import React, { useState, useMemo } from 'react';
import { 
  Stethoscope, AlertTriangle, CheckCircle, Info, Sliders, 
  RefreshCw, Zap, BarChart2, TrendingUp, Heart, ShieldAlert 
} from 'lucide-react';
import PipelineAnimation from './PipelineAnimation';

export default function DoctorPortal({ initialPatients }: { initialPatients: any[] }) {
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatients[0]?.patient_id || 'HUNT-70012');
  
  const selectedPatient = useMemo(() => {
    return initialPatients.find(p => p.patient_id === selectedPatientId) || initialPatients[0];
  }, [selectedPatientId, initialPatients]);

  // Simulator Sliders State
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

  // Real-time counterfactual hazard computation
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

  const isCritical = selectedPatient.adverse_risk_score >= 60;
  const isElevated = selectedPatient.adverse_risk_score >= 35 && !isCritical;

  return (
    <div className="space-y-6">
      {/* Animated Pipeline Overview */}
      <PipelineAnimation />

      {/* Patient Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Select Monitored Patient (HUNT 70+ Cohort)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {initialPatients.map((p) => {
            const isSelected = p.patient_id === selectedPatient.patient_id;
            const isHigh = p.adverse_risk_score >= 50;
            return (
              <button
                key={p.patient_id}
                onClick={() => handleSelectPatient(p.patient_id)}
                className={`p-2.5 rounded-lg text-left transition-all border ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-slate-800">{p.patient_id}</div>
                <div className="text-[11px] text-slate-500">{p.age}y, {p.sex[0]}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isHigh ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
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

      {/* Main 3-Column Doctor Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Danger Gauge & Clinical Deficit Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{selectedPatient.patient_id}</h2>
              <p className="text-xs text-slate-500">
                {selectedPatient.age} years old | {selectedPatient.sex} | {selectedPatient.municipality}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isCritical ? 'bg-red-100 text-red-700' :
              isElevated ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {selectedPatient.risk_level} Risk
            </span>
          </div>

          {/* Animated Clinical Danger Gauge */}
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-inner relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                12-Month Threat Level
              </span>
              <span className="text-[10px] font-mono text-slate-400">LightGBM Calibrated</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-extrabold tracking-tight">
                  {selectedPatient.adverse_risk_score}%
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Adverse Event Hazard (Fall/Hospitalization)
                </div>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${isCritical ? 'text-red-500' : isElevated ? 'text-amber-500' : 'text-emerald-500'}`}
                    strokeDasharray={`${selectedPatient.adverse_risk_score}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold">
                  {selectedPatient.rockwood_frailty_index} FI
                </span>
              </div>
            </div>

            {/* Projected Danger Trajectory */}
            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-slate-400">3 Months</div>
                <div className="text-xs font-mono font-bold text-slate-200">
                  {Math.round(selectedPatient.adverse_risk_score * 0.35)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">6 Months</div>
                <div className="text-xs font-mono font-bold text-slate-200">
                  {Math.round(selectedPatient.adverse_risk_score * 0.68)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">12 Months</div>
                <div className="text-xs font-mono font-bold text-amber-300">
                  {selectedPatient.adverse_risk_score}%
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Conditions & Deficit Badges */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Identified Clinical Deficits (Suffering From)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {selectedPatient.clinical_vitals.gait_speed_ms < 0.8 && (
                <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-medium">
                  Sarcopenia / Severe Gait Impairment
                </span>
              )}
              {selectedPatient.clinical_vitals.num_prescriptions >= 5 && (
                <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-medium">
                  Polypharmacy ({selectedPatient.clinical_vitals.num_prescriptions} drugs)
                </span>
              )}
              {selectedPatient.clinical_vitals.mna_score < 22 && (
                <span className="px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-[11px] font-medium">
                  Malnutrition Risk (MNA: {selectedPatient.clinical_vitals.mna_score})
                </span>
              )}
              {selectedPatient.clinical_vitals.falls_past_year > 0 && (
                <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-medium">
                  Recurrent Faller ({selectedPatient.clinical_vitals.falls_past_year} falls)
                </span>
              )}
              {selectedPatient.clinical_vitals.moca_score < 24 && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[11px] font-medium">
                  Mild Cognitive Impairment (MoCA: {selectedPatient.clinical_vitals.moca_score})
                </span>
              )}
            </div>
          </div>

          {/* Action Pathways */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-700" />
              Recommended Trondheim Kommune Action
            </h4>
            <ul className="text-xs text-blue-800 space-y-1.5 list-disc list-inside">
              {selectedPatient.recommended_interventions.map((rec: string, i: number) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Middle Column: SHAP Waterfall Explainability */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-600" />
                SHAP Explainability Waterfall
              </h3>
              <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono font-medium">
                TreeExplainer
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Exact quantitative attribution showing how each patient biomarker elevates or suppresses the 12-month hazard.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {selectedPatient.shap_explanation.map((item: any, index: number) => {
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
                    <span>{isPositive ? 'Increases Risk' : 'Protective Factor'}</span>
                    <span>SHAP Value</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Doctor-Facing Explanation
            </div>
            <p>
              {selectedPatient.shap_explanation[0]?.direction === 'increases_risk'
                ? `Primary risk amplifier is ${selectedPatient.shap_explanation[0]?.feature.replace(/_/g, ' ')}. Prioritize immediate rehabilitation or medication review.`
                : `Strong functional reserve in ${selectedPatient.shap_explanation[0]?.feature.replace(/_/g, ' ')} provides protective resilience.`}
            </p>
          </div>
        </div>

        {/* Right Column: Real-Time Counterfactual Simulator */}
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-5 ring-1 ring-blue-500/10">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                What-If Clinical Simulator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate targeted clinical interventions in real time
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
                <span>Grip Strength (Resistance Training)</span>
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
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Gait Speed (Otago Balance Training)</span>
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
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Nutritional Score (MNA / Protein Supplement)</span>
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
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Medication Count (STOPP/START Deprescribing)</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
