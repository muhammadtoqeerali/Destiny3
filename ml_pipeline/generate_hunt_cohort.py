"""
Digi-FrailCare: NTNU HUNT 70+ Longitudinal Cohort Generator
Generates statistically grounded synthetic health data mirroring published
epidemiological distributions from the HUNT Study (Helseundersokelsen i Trondelag).
"""

import numpy as np
import pandas as pd
import json
import os

np.random.seed(42)

def generate_hunt_cohort(n_samples=4500):
    print(f"Generating synthetic HUNT 70+ cohort (N={n_samples})...")
    
    # 1. Demographics
    age = np.random.normal(loc=76.8, scale=6.8, size=n_samples)
    age = np.clip(age, 65, 96).round(1)
    
    sex = np.random.choice(['Female', 'Male'], size=n_samples, p=[0.54, 0.46])
    living_alone = np.random.binomial(1, p=np.where(sex == 'Female', 0.44, 0.31))
    education_level = np.random.choice(['Primary', 'Secondary', 'Tertiary/University'], 
                                       size=n_samples, p=[0.38, 0.44, 0.18])
    municipality = np.random.choice(['Trondheim', 'Levanger', 'Stjordal', 'Steinkjer', 'Verdal'],
                                    size=n_samples, p=[0.48, 0.16, 0.14, 0.12, 0.10])
    
    # 2. Objective Physical Function & Wearable Sensor Features (NTNU Movement Science)
    # Jamar Dynamometer Grip Strength (kg): Normal male ~38kg (declines with age), female ~24kg
    base_grip = np.where(sex == 'Male', 42.0 - (age - 65) * 0.55, 26.5 - (age - 65) * 0.38)
    grip_strength = np.random.normal(loc=base_grip, scale=4.8).round(1)
    grip_strength = np.clip(grip_strength, 5.0, 60.0)
    
    # Gait Speed (m/s) over 4 meters: normal ~1.05 m/s, frail <0.8 m/s
    base_gait = 1.15 - (age - 65) * 0.015 - (grip_strength < 20) * 0.18
    gait_speed = np.random.normal(loc=base_gait, scale=0.18).round(2)
    gait_speed = np.clip(gait_speed, 0.25, 1.65)
    
    # Timed Up and Go (TUG, seconds): normal <10s, high risk >14s
    tug_seconds = np.random.normal(loc=9.2 + (age - 65) * 0.25 + (1.2 - gait_speed) * 4.0, scale=2.5).round(1)
    tug_seconds = np.clip(tug_seconds, 5.5, 38.0)
    
    # Daily Active Minutes from Thigh-worn Triaxial Accelerometer (NTNU Axivity/ActiGraph protocols)
    daily_active_mins = np.random.normal(loc=135.0 - (age - 65) * 2.2 - (gait_speed < 0.8) * 35.0, scale=32.0).round(1)
    daily_active_mins = np.clip(daily_active_mins, 12.0, 310.0)
    
    daily_steps = np.random.normal(loc=daily_active_mins * 38.0, scale=800.0).round(0)
    daily_steps = np.clip(daily_steps, 450, 14500)

    # 3. Digi-FrailCare Specific Pillars: Oral Health & Nutrition
    # Mini Nutritional Assessment (MNA) score (0 to 30; <17 malnourished, 17-23.5 at risk, >=24 normal)
    mna_score = np.random.normal(loc=24.2 - (age - 65) * 0.12 - living_alone * 1.5, scale=3.1).round(1)
    mna_score = np.clip(mna_score, 8.0, 30.0)
    
    natural_teeth = np.random.binomial(28, p=np.clip(0.75 - (age - 65) * 0.012, 0.1, 0.95))
    chewing_difficulty = np.random.binomial(1, p=np.clip(0.15 + (28 - natural_teeth) * 0.02, 0.05, 0.70))
    unintentional_weight_loss_kg = np.random.exponential(scale=1.2, size=n_samples).round(1)

    # 4. Clinical Multimorbidity & Polypharmacy
    num_prescriptions = np.random.poisson(lam=np.clip(3.2 + (age - 65) * 0.12, 1, 14), size=n_samples)
    polypharmacy = (num_prescriptions >= 5).astype(int)
    
    hypertension = np.random.binomial(1, p=0.62, size=n_samples)
    systolic_bp = np.random.normal(loc=138 + hypertension * 14, scale=16).round(0)
    diastolic_bp = np.random.normal(loc=78 + hypertension * 6, scale=9).round(0)
    bmi = np.random.normal(loc=26.8, scale=4.2, size=n_samples).round(1)
    bmi = np.clip(bmi, 16.0, 44.0)
    
    type2_diabetes = np.random.binomial(1, p=0.18, size=n_samples)
    cvd_history = np.random.binomial(1, p=0.24, size=n_samples)
    copd_history = np.random.binomial(1, p=0.11, size=n_samples)
    osteoarthritis = np.random.binomial(1, p=0.39, size=n_samples)
    falls_past_year = np.random.poisson(lam=np.clip(0.3 + (gait_speed < 0.8) * 0.8 + (tug_seconds > 14) * 0.6, 0.05, 5.0), size=n_samples)

    # 5. Cognitive & Mental Health
    # MoCA Score (0 to 30; >=26 normal, 18-25 MCI, <18 cognitive impairment)
    moca_score = np.random.normal(loc=26.4 - (age - 65) * 0.18 - (type2_diabetes) * 0.8, scale=2.9).round(0)
    moca_score = np.clip(moca_score, 10, 30).astype(int)
    
    # Geriatric Depression Scale (GDS-15; 0 to 15, >=5 indicates depression)
    gds_score = np.random.poisson(lam=np.clip(1.8 + living_alone * 1.2 + (mna_score < 20) * 1.5, 0.2, 12), size=n_samples)
    gds_score = np.clip(gds_score, 0, 15)

    # 6. HUNT Laboratory Blood Biomarkers
    hs_crp = np.random.lognormal(mean=0.8, sigma=0.65, size=n_samples).round(2) # mg/L
    albumin = np.random.normal(loc=42.5 - (age - 65) * 0.15 - (mna_score < 20) * 3.0, scale=3.5).round(1) # g/L
    egfr = np.random.normal(loc=74.0 - (age - 65) * 0.8, scale=14.0).round(1) # mL/min/1.73m2
    hemoglobin = np.where(sex == 'Male', 
                          np.random.normal(14.8, 1.2, n_samples),
                          np.random.normal(13.5, 1.1, n_samples)).round(1)
    vitamin_d = np.random.normal(loc=58.0, scale=18.0, size=n_samples).round(1) # nmol/L

    # 7. Derived Rockwood Frailty Index (36 Clinical & Functional Deficits)
    # Summing deficit proportion (0 to 1.0)
    deficits = [
        (grip_strength < (27 if sex_val == 'Male' else 16)) for sex_val in sex
    ]
    deficits.append(gait_speed < 0.8)
    deficits.append(tug_seconds > 13.5)
    deficits.append(daily_active_mins < 60)
    deficits.append(daily_steps < 3000)
    deficits.append(mna_score < 22)
    deficits.append(chewing_difficulty == 1)
    deficits.append(unintentional_weight_loss_kg > 3.0)
    deficits.append(num_prescriptions >= 5)
    deficits.append(num_prescriptions >= 8)
    deficits.append(hypertension == 1)
    deficits.append(systolic_bp > 150)
    deficits.append(diastolic_bp > 90)
    deficits.append(bmi < 20.0)
    deficits.append(bmi > 32.0)
    deficits.append(type2_diabetes == 1)
    deficits.append(cvd_history == 1)
    deficits.append(copd_history == 1)
    deficits.append(osteoarthritis == 1)
    deficits.append(falls_past_year >= 1)
    deficits.append(falls_past_year >= 2)
    deficits.append(moca_score < 24)
    deficits.append(moca_score < 18)
    deficits.append(gds_score >= 5)
    deficits.append(living_alone == 1)
    deficits.append(hs_crp > 3.0)
    deficits.append(albumin < 38.0)
    deficits.append(egfr < 60.0)
    deficits.append(hemoglobin < 12.0)
    deficits.append(vitamin_d < 40.0)
    deficits.append(age >= 80)
    deficits.append(age >= 85)
    
    deficit_matrix = np.column_stack(deficits).astype(float)
    frailty_index = (deficit_matrix.sum(axis=1) / deficit_matrix.shape[1]).round(3)
    
    # Frailty State Categories (Rockwood criteria)
    # Robust: <0.10, Pre-frail: 0.10 - 0.24, Frail: >=0.25
    frailty_category = np.where(frailty_index < 0.12, 'Robust',
                       np.where(frailty_index < 0.25, 'Pre-frail', 'Frail'))
    
    # 8. Primary Target Outcome: 12-Month Adverse Clinical Event
    # (Fall with fracture, Acute Unplanned Hospitalization, or Loss of Autonomy)
    # Derived from clinical logistic hazard
    log_odds = (
        -4.2
        + 5.8 * frailty_index
        + 0.04 * (age - 70)
        - 0.8 * (gait_speed - 1.0)
        + 0.35 * (falls_past_year > 0)
        + 0.45 * (num_prescriptions >= 6)
        + 0.30 * (hs_crp > 4.0)
        - 0.25 * (mna_score > 24)
    )
    event_prob = 1.0 / (1.0 + np.exp(-log_odds))
    adverse_event_12m = np.random.binomial(1, p=np.clip(event_prob, 0.02, 0.95))

    df = pd.DataFrame({
        'patient_id': [f"HUNT-{70000 + i}" for i in range(n_samples)],
        'age': age,
        'sex': sex,
        'living_alone': living_alone,
        'education_level': education_level,
        'municipality': municipality,
        'grip_strength_kg': grip_strength,
        'gait_speed_ms': gait_speed,
        'tug_seconds': tug_seconds,
        'daily_active_mins': daily_active_mins,
        'daily_steps': daily_steps,
        'mna_score': mna_score,
        'natural_teeth': natural_teeth,
        'chewing_difficulty': chewing_difficulty,
        'unintentional_weight_loss_kg': unintentional_weight_loss_kg,
        'num_prescriptions': num_prescriptions,
        'polypharmacy': polypharmacy,
        'systolic_bp': systolic_bp,
        'diastolic_bp': diastolic_bp,
        'bmi': bmi,
        'type2_diabetes': type2_diabetes,
        'cvd_history': cvd_history,
        'copd_history': copd_history,
        'osteoarthritis': osteoarthritis,
        'falls_past_year': falls_past_year,
        'moca_score': moca_score,
        'gds_score': gds_score,
        'hs_crp_mgl': hs_crp,
        'albumin_gl': albumin,
        'egfr_ml_min': egfr,
        'hemoglobin_gdl': hemoglobin,
        'vitamin_d_nmol': vitamin_d,
        'rockwood_frailty_index': frailty_index,
        'frailty_category': frailty_category,
        'adverse_event_12m': adverse_event_12m
    })

    # Introduce realistic EHR clinical missingness (5-10% in non-critical labs and sensors)
    missing_cols = ['daily_steps', 'daily_active_mins', 'vitamin_d_nmol', 'hs_crp_mgl', 'mna_score', 'grip_strength_kg']
    for col in missing_cols:
        mask = np.random.rand(n_samples) < 0.08  # 8% missingness
        df.loc[mask, col] = np.nan

    os.makedirs('data', exist_ok=True)
    df.to_csv('data/hunt_frailty_cohort.csv', index=False)
    print(f"HUNT 70+ cohort successfully saved to 'data/hunt_frailty_cohort.csv'.")
    print(f"Prevalence - Frail: {(df['frailty_category']=='Frail').mean():.1%}, Pre-frail: {(df['frailty_category']=='Pre-frail').mean():.1%}, Robust: {(df['frailty_category']=='Robust').mean():.1%}")
    print(f"12-Month Adverse Event Rate: {df['adverse_event_12m'].mean():.1%}")
    return df

if __name__ == '__main__':
    generate_hunt_cohort()