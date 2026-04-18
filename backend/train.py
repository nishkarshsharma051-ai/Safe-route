import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
import os

print("--- SAFE ROUTE AI: INITIATING ML TRAINING ---")

# 1. Generate Synthetic Danger Vectors (Next-Level Training Data)
# Variables: distance_km, mod_haz, high_haz, crit_haz
np.random.seed(42)
num_samples = 5000

print(f"Generating {num_samples} tactical scenarios...")
distances = np.random.uniform(0.1, 150.0, num_samples) # Routes from 100m to 150km
mod_haz = np.random.poisson(2, num_samples)            # Moderate threats
high_haz = np.random.poisson(0.5, num_samples)         # High severity threats
crit_haz = np.random.poisson(0.1, num_samples)         # Critical level threats (earthquakes, tornados)

# Base safety starts at 100
safety_scores = np.full(num_samples, 100.0)

# Apply dynamic real-world deductions to generate the "Target" labels
# - Distance tax
safety_scores -= (distances * 0.05) 
# - Hazard tax
safety_scores -= (mod_haz * 5.0)
safety_scores -= (high_haz * 15.0)
safety_scores -= (crit_haz * 55.0)

# Add some non-linear variance and noise (to make the model work harder than pure math)
noise = np.random.normal(0, 3, num_samples)
safety_scores += noise

# Cap logic
safety_scores = np.clip(safety_scores, 5.0, 99.0)

# Build DataFrame
df = pd.DataFrame({
    'distance_km': distances,
    'mod_haz': mod_haz,
    'high_haz': high_haz,
    'crit_haz': crit_haz,
    'safety_score': safety_scores
})

print("Dataset Constructed. Preview:")
print(df.head())

# 2. Train the Model (RandomForestRegressor is extremely robust for non-linear geographical data)
X = df[['distance_km', 'mod_haz', 'high_haz', 'crit_haz']]
y = df['safety_score']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("\nDeploying RandomForestRegressor algorithm...")
model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
model.fit(X_train, y_train)

score = model.score(X_test, y_test)
print(f"Model Training Complete! R^2 Accuracy Target: {score:.4f}")

# 3. Export the brain to a .pkl package
model_path = os.path.join(os.path.dirname(__file__), 'safety_model.pkl')
joblib.dump(model, model_path)
print(f"\n--- MISSION ACCOMPLISHED ---")
print(f"Safe Route AI physical model exported to: {model_path}")
