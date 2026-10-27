"""
Digi-FrailCare: NTNU ML Benchmark & Explainable AI Engine
Implements MICE imputation, Stratified 5-Fold Cross Validation,
5-Model Clinical Benchmarking, Calibration, and SHAP explainability.
Exports formatted payloads for the Next.js Vercel interface.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer, SimpleImputer
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.model_selection import StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    roc_auc_score, average_precision_score, brier_score_loss,
    f1_score, recall_score, precision_score, confusion_matrix, roc_curve, precision_recall_curve
)
import xgboost as xgb
import lightgbm as lgb
import shap
import joblib

def run_ml_pipeline():
    print("=" * 70)
    print("NTNU DIGI-FRAILCARE: CLINICAL MACHINE LEARNING PIPELINE")
    print("=" * 70)
    
    # 1. Load Data
    data_path = 'data/hunt_frailty_cohort.csv'
    if not os.path.exists(data_path):
        from generate_hunt_cohort import generate_hunt_cohort
        df = generate_hunt_cohort()
    else:
        df = pd.read_csv(data_path)

    # 2. Preprocessing & Missingness Audit
    features_to_drop = ['patient_id', 'frailty_category', 'adverse_event_12m', 'municipality']
    numeric_features = [
        'age', 'grip_strength_kg', 'gait_speed_ms', 'tug_seconds',
        'daily_active_mins', 'daily_steps', 'mna_score', 'natural_teeth',
        'unintentional_weight_loss_kg', 'num_prescriptions', 'systolic_bp',
        'diastolic_bp', 'bmi', 'falls_past_year', 'moca_score', 'gds_score',
        'hs_crp_mgl', 'albumin_gl', 'egfr_ml_min', 'hemoglobin_gdl', 'vitamin_d_nmol',
        'rockwood_frailty_index'
    ]
    binary_categorical = [
        'sex', 'living_alone', 'education_level', 'chewing_difficulty',
        'polypharmacy', 'type2_diabetes', 'cvd_history', 'copd_history', 'osteoarthritis'
    ]

    # Calculate missingness stats for Admin view
    missing_before = df[numeric_features + binary_categorical].isnull().mean().to_dict()
    missing_stats_before = {k: round(v * 100, 2) for k, v in missing_before.items() if v > 0}
    print(f"Missingness before imputation: {missing_stats_before}")

    # Encode categoricals
    df_encoded = df.copy()
    df_encoded['sex'] = (df_encoded['sex'] == 'Male').astype(int)
    df_encoded['education_level'] = df_encoded['education_level'].map({
        'Primary': 0, 'Secondary': 1, 'Tertiary/University': 2
    })

    X_raw = df_encoded[numeric_features + binary_categorical].copy()
    y = df['adverse_event_12m'].values

    # MICE Imputation (Multivariate Imputation by Chained Equations)
    print("Applying MICE Imputation (IterativeImputer with Bayesian Ridge)...")
    imputer = IterativeImputer(max_iter=15, random_state=42, sample_posterior=False)
    X_imputed = pd.DataFrame(imputer.fit_transform(X_raw), columns=X_raw.columns)
    
    missing_stats_after = {k: 0.0 for k in missing_stats_before.keys()}

    # Scale numeric features
    scaler = RobustScaler()
    X_scaled = X_imputed.copy()
    X_scaled[numeric_features] = scaler.fit_transform(X_imputed[numeric_features])

    feature_names = list(X_imputed.columns)

    # 3. Model Definition
    models = {
        'LightGBM': lgb.LGBMClassifier(
            n_estimators=180, learning_rate=0.04, max_depth=5, 
            num_leaves=24, subsample=0.8, colsample_bytree=0.8, random_state=42, verbose=-1
        ),
        'XGBoost': xgb.XGBClassifier(
            n_estimators=160, learning_rate=0.04, max_depth=4, 
            subsample=0.8, colsample_bytree=0.8, eval_metric='logloss', random_state=42
        ),
        'Random Forest': RandomForestClassifier(
            n_estimators=200, max_depth=8, min_samples_split=6, random_state=42
        ),
        'ElasticNet Logistic Regression': LogisticRegression(
            penalty='elasticnet', solver='saga', l1_ratio=0.35, C=0.2, max_iter=2000, random_state=42
        ),
        'Neural Network (MLP)': MLPClassifier(
            hidden_layer_sizes=(64, 32), activation='relu', max_iter=500, alpha=0.01, random_state=42
        )
    }

    # 4. Stratified 5-Fold Cross Validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    benchmark_results = {}
    oof_predictions = {name: np.zeros(len(y)) for name in models}
    
    print("\nRunning Stratified 5-Fold Cross-Validation across 5 Architectures...")
    for name, model in models.items():
        roc_list, pr_list, brier_list, f1_list, sens_list, spec_list = [], [], [], [], [], []
        
        for train_idx, val_idx in cv.split(X_scaled, y):
            X_tr, X_val = X_scaled.iloc[train_idx], X_scaled.iloc[val_idx]
            y_tr, y_val = y[train_idx], y[val_idx]

            # Fit model
            if name == 'ElasticNet Logistic Regression':
                cal_model = CalibratedClassifierCV(model, method='sigmoid', cv=3)
                cal_model.fit(X_tr, y_tr)
                preds_prob = cal_model.predict_proba(X_val)[:, 1]
            else:
                model.fit(X_tr, y_tr)
                preds_prob = model.predict_proba(X_val)[:, 1]

            oof_predictions[name][val_idx] = preds_prob
            preds_bin = (preds_prob >= 0.35).astype(int) # Clinical high-sensitivity threshold

            roc_list.append(roc_auc_score(y_val, preds_prob))
            pr_list.append(average_precision_score(y_val, preds_prob))
            brier_list.append(brier_score_loss(y_val, preds_prob))
            f1_list.append(f1_score(y_val, preds_bin))
            sens_list.append(recall_score(y_val, preds_bin))
            
            tn, fp, fn, tp = confusion_matrix(y_val, preds_bin).ravel()
            spec_list.append(tn / (tn + fp))

        # Mean performance
        benchmark_results[name] = {
            'roc_auc': round(float(np.mean(roc_list)), 4),
            'roc_auc_std': round(float(np.std(roc_list)), 4),
            'pr_auc': round(float(np.mean(pr_list)), 4),
            'brier_score': round(float(np.mean(brier_list)), 4),
            'f1_score': round(float(np.mean(f1_list)), 4),
            'sensitivity': round(float(np.mean(sens_list)), 4),
            'specificity': round(float(np.mean(spec_list)), 4)
        }
        print(f"[{name:28s}] ROC-AUC: {benchmark_results[name]['roc_auc']:.4f} | PR-AUC: {benchmark_results[name]['pr_auc']:.4f} | Brier: {benchmark_results[name]['brier_score']:.4f}")

    # 5. Full Model Training for Best Architecture (LightGBM) & SHAP Explainer
    print("\nFitting final LightGBM model for deployment and SHAP explainability...")
    best_model = models['LightGBM']
    best_model.fit(X_scaled, y)
    
    os.makedirs('ml_pipeline/models', exist_ok=True)
    joblib.dump(best_model, 'ml_pipeline/models/best_model.joblib')
    joblib.dump(scaler, 'ml_pipeline/models/robust_scaler.joblib')
    joblib.dump(imputer, 'ml_pipeline/models/mice_imputer.joblib')

    # TreeExplainer for LightGBM
    explainer = shap.TreeExplainer(best_model)
    shap_values = explainer.shap_values(X_scaled)
    if isinstance(shap_values, list):
        shap_values_matrix = shap_values[1] # positive class
    else:
        shap_values_matrix = shap_values

    # Global SHAP importance
    mean_abs_shap = np.abs(shap_values_matrix).mean(axis=0)
    shap_importance = sorted([
        {'feature': feat, 'importance': round(float(val), 4)}
        for feat, val in zip(feature_names, mean_abs_shap)
    ], key=lambda x: x['importance'], reverse=True)

    # 6. Curve Data for Dashboard Plots (ROC, PR, Calibration, Confusion)
    curves_data = {}
    for name in models:
        fpr, tpr, _ = roc_curve(y, oof_predictions[name])
        precision, recall, _ = precision_recall_curve(y, oof_predictions[name])
        prob_true, prob_pred = calibration_curve(y, oof_predictions[name], n_bins=10)
        
        # Downsample curves to 25 points for smooth web rendering
        idx_step_roc = max(1, len(fpr) // 25)
        idx_step_pr = max(1, len(precision) // 25)

        cm = confusion_matrix(y, (oof_predictions[name] >= 0.35).astype(int))

        curves_data[name] = {
            'roc': [{'fpr': round(float(fpr[i]), 3), 'tpr': round(float(tpr[i]), 3)} for i in range(0, len(fpr), idx_step_roc)],
            'pr': [{'recall': round(float(recall[i]), 3), 'precision': round(float(precision[i]), 3)} for i in range(0, len(precision), idx_step_pr)],
            'calibration': [{'pred': round(float(p), 3), 'actual': round(float(a), 3)} for p, a in zip(prob_pred, prob_true)],
            'confusion_matrix': {
                'tn': int(cm[0, 0]), 'fp': int(cm[0, 1]),
                'fn': int(cm[1, 0]), 'tp': int(cm[1, 1])
            }
        }

    # 7. Create Representative Patient Cohort for Doctor View with Individual SHAP
    print("\nSynthesizing representative patients with local SHAP attributions...")
    sample_indices = [12, 45, 88, 142, 210, 315, 420, 560]
    patients_payload = []

    for idx in sample_indices:
        raw_row = df.iloc[idx].to_dict()
        patient_shap = shap_values_matrix[idx]
        
        # Top 5 positive and negative contributing factors
        top_shap_indices = np.argsort(np.abs(patient_shap))[::-1][:6]
        shap_factors = []
        for feat_idx in top_shap_indices:
            feat_name = feature_names[feat_idx]
            feat_val = float(X_imputed.iloc[idx][feat_name])
            attribution = float(patient_shap[feat_idx])
            shap_factors.append({
                'feature': feat_name,
                'value': round(feat_val, 2),
                'attribution': round(attribution, 3),
                'direction': 'increases_risk' if attribution > 0 else 'decreases_risk'
            })

        predicted_prob = float(oof_predictions['LightGBM'][idx])
        risk_level = 'Critical' if predicted_prob >= 0.60 else ('Elevated' if predicted_prob >= 0.35 else 'Stable')

        patients_payload.append({
            'patient_id': raw_row['patient_id'],
            'age': int(raw_row['age']),
            'sex': raw_row['sex'],
            'municipality': raw_row['municipality'],
            'living_alone': bool(raw_row['living_alone']),
            'frailty_category': raw_row['frailty_category'],
            'rockwood_frailty_index': float(raw_row['rockwood_frailty_index']),
            'adverse_risk_score': round(predicted_prob * 100, 1),
            'risk_level': risk_level,
            'clinical_vitals': {
                'grip_strength_kg': float(raw_row['grip_strength_kg']) if pd.notnull(raw_row['grip_strength_kg']) else 21.0,
                'gait_speed_ms': float(raw_row['gait_speed_ms']),
                'tug_seconds': float(raw_row['tug_seconds']),
                'daily_active_mins': float(raw_row['daily_active_mins']) if pd.notnull(raw_row['daily_active_mins']) else 95.0,
                'mna_score': float(raw_row['mna_score']) if pd.notnull(raw_row['mna_score']) else 22.0,
                'num_prescriptions': int(raw_row['num_prescriptions']),
                'falls_past_year': int(raw_row['falls_past_year']),
                'moca_score': int(raw_row['moca_score']),
                'hs_crp_mgl': float(raw_row['hs_crp_mgl']) if pd.notnull(raw_row['hs_crp_mgl']) else 2.1,
                'systolic_bp': int(raw_row['systolic_bp'])
            },
            'shap_explanation': shap_factors,
            'recommended_interventions': generate_interventions(raw_row, predicted_prob)
        })

    # 8. Export All Payloads for Vercel
    os.makedirs('public/data', exist_ok=True)
    
    with open('public/data/benchmark_results.json', 'w') as f:
        json.dump(benchmark_results, f, indent=2)

    with open('public/data/curves_data.json', 'w') as f:
        json.dump(curves_data, f, indent=2)

    with open('public/data/shap_importance.json', 'w') as f:
        json.dump(shap_importance, f, indent=2)

    with open('public/data/patients.json', 'w') as f:
        json.dump(patients_payload, f, indent=2)

    # Dataset summary statistics
    dataset_summary = {
        'total_cohort_size': len(df),
        'age_mean': round(float(df['age'].mean()), 1),
        'age_std': round(float(df['age'].std()), 1),
        'female_pct': round(float((df['sex'] == 'Female').mean() * 100), 1),
        'frail_pct': round(float((df['frailty_category'] == 'Frail').mean() * 100), 1),
        'pre_frail_pct': round(float((df['frailty_category'] == 'Pre-frail').mean() * 100), 1),
        'robust_pct': round(float((df['frailty_category'] == 'Robust').mean() * 100), 1),
        'event_rate_pct': round(float(df['adverse_event_12m'].mean() * 100), 1),
        'missing_before': missing_stats_before,
        'missing_after': missing_stats_after
    }
    with open('public/data/dataset_summary.json', 'w') as f:
        json.dump(dataset_summary, f, indent=2)

    print("\nAll JSON payloads successfully written to 'public/data/'.")
    print("Machine learning pipeline execution complete.")

def generate_interventions(patient_data, risk_score):
    recs = []
    if patient_data.get('gait_speed_ms', 1.0) < 0.8 or patient_data.get('tug_seconds', 10) > 13:
        recs.append("Trondheim Kommune Physiotherapy: Targeted balance & progressive resistance training (Otago protocol).")
    if patient_data.get('mna_score', 25) < 22:
        recs.append("Clinical Nutritionist Consultation: High-protein oral supplementation (1.2g/kg/day) & dentition review.")
    if patient_data.get('num_prescriptions', 0) >= 5:
        recs.append("Pharmacist Deprescribing Review: STOPP/START criteria check for anticholinergic & fall-risk drugs.")
    if patient_data.get('moca_score', 28) < 24:
        recs.append("Geriatric Cognitive Assessment: Structured daily cognitive stimulation & medication adherence support.")
    if len(recs) == 0:
        recs.append("Routine annual HUNT surveillance: Maintain physical community activity group.")
    return recs

if __name__ == '__main__':
    run_ml_pipeline()