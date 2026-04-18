from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import pandas as pd

app = Flask(__name__)
# Enable CORS so our React frontend can query the model locally without blocking
CORS(app)

print("Booting Safe Route AI...")
model_path = os.path.join(os.path.dirname(__file__), 'safety_model.pkl')

try:
    model = joblib.load(model_path)
    print("Machine Learning Safety Model (RandomForest) Activated & Loaded into Memory!")
except Exception as e:
    print(f"CRITICAL ERROR LOADING MODEL: {e}")
    model = None

@app.route('/predict_safety', methods=['POST'])
def predict_safety():
    """
    Receives JSON payload expecting batch list of route contexts:
    {
       "routes": [
          {"id": "route-0", "distance_km": 12.5, "mod_haz": 1, "high_haz": 0, "crit_haz": 0},
          ...
       ]
    }
    """
    if not model:
        return jsonify({"error": "Model offline."}), 500
        
    data = request.json
    if not data or 'routes' not in data:
        return jsonify({"error": "Invalid payload format. Expected { 'routes': [...] }"}), 400
        
    results = {}
    
    # We predict the batch dynamically
    try:
        df_predict = pd.DataFrame(data['routes'])
        # Isolate the exact features needed to feed into RandomForest
        features = df_predict[['distance_km', 'mod_haz', 'high_haz', 'crit_haz']]
        
        # Pure ML prediction processing
        predictions = model.predict(features)
        
        # Send predictions back mapped by route ID
        for i, route_data in enumerate(data['routes']):
            route_id = route_data['id']
            pred = predictions[i]
            # Ensure boundaries are completely logical for tactical UI
            safe_score = max(5, min(100, int(round(pred))))
            results[route_id] = safe_score
            
        return jsonify({"success": True, "predictions": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Running standard port 5000 for Flask
    app.run(port=5000, debug=True)
