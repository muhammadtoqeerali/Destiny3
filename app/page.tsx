'use client';

import React, { useState } from 'react';
import { Shield, Stethoscope } from 'lucide-react';

import benchmarkData from '../public/data/benchmark_results.json';
import curvesData from '../public/data/curves_data.json';
import shapImportanceData from '../public/data/shap_importance.json';
import initialPatients from '../public/data/patients.json';
import datasetSummary from '../public/data/dataset_summary.json';

import DoctorPortal from '../components/DoctorPortal';
import AdminPortal from '../components/AdminPortal';

export default function DigiFrailApp() {
  const [activeTab, setActiveTab] = useState<'doctor' | 'admin'>('doctor');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Header */}
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
              <p className="text-xs text-slate-400">Postdoctoral Research & Clinical Decision Support System</p>
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

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'doctor' ? (
          <DoctorPortal initialPatients={initialPatients} />
        ) : (
          <AdminPortal 
            benchmarkData={benchmarkData}
            curvesData={curvesData}
            shapImportanceData={shapImportanceData}
            datasetSummary={datasetSummary}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          NTNU Faculty of Medicine and Health Sciences | Trøndelag Health Study (HUNT) Machine Learning Interface | Digi-FrailCare Pilot
        </p>
      </footer>
    </div>
  );
}
