"""
ValuAI Flask API
ML Service for startup valuation predictions
Runs on Port 5000
"""

import os
import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'valuation_model.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'scaler.pkl')
ENCODER_PATH = os.path.join(BASE_DIR, 'encoder.pkl')

# Load model and preprocessors
print("🔄 Loading model and preprocessors...")

model = None
scaler = None
encoder = None

try:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    print("✅ Model loaded")
except Exception as e:
    print(f"⚠️ Could not load model: {e}")

try:
    with open(SCALER_PATH, 'rb') as f:
        scaler = pickle.load(f)
    print("✅ Scaler loaded")
except Exception as e:
    print(f"⚠️ Could not load scaler: {e}")

try:
    with open(ENCODER_PATH, 'rb') as f:
        encoder = pickle.load(f)
    print("✅ Encoder loaded")
except Exception as e:
    print(f"⚠️ Could not load encoder: {e}")

# Industry mapping (fallback if encoder not available)
INDUSTRIES = {
    'Technology': 0,
    'Healthcare': 1,
    'Finance': 2,
    'FinTech': 2,
    'E-commerce': 3,
    'E-Commerce': 3,
    'Manufacturing': 4,
    'EdTech': 5,
    'HealthTech': 1,
    'Cybersecurity': 6,
    'Gaming': 7,
    'IoT': 8,
    'Other': 9
}


@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'ValuAI ML Service is running',
        'model_loaded': model is not None,
        'port': 5000
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict startup valuation
    
    Expected JSON:
    {
        "revenue": 1000000,
        "team_size": 50,
        "industry": "Technology"
    }
    
    Returns:
    {
        "valuation": 5000000
    }
    """
    try:
        # Get JSON data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract features
        revenue = float(data.get('revenue', 0))
        team_size = int(data.get('team_size', 1))
        industry = data.get('industry', 'Other')
        
        # Encode industry
        if encoder is not None:
            try:
                industry_encoded = encoder.transform([industry])[0]
            except ValueError:
                # Unknown industry, use default
                industry_encoded = 0
        else:
            industry_encoded = INDUSTRIES.get(industry, INDUSTRIES['Other'])
        
        # Prepare features
        features = np.array([[revenue, team_size, industry_encoded]])
        
        # Scale features
        if scaler is not None:
            features_scaled = scaler.transform(features)
        else:
            features_scaled = features
        
        # Make prediction
        if model is not None:
            valuation = model.predict(features_scaled)[0]
            # Ensure positive valuation
            valuation = max(0, valuation)
        else:
            # Fallback calculation if model not loaded
            industry_multipliers = {
                'Technology': 8, 'FinTech': 10, 'Healthcare': 6,
                'HealthTech': 7, 'E-commerce': 4, 'E-Commerce': 4,
                'EdTech': 5, 'Cybersecurity': 9, 'Gaming': 5,
                'IoT': 6, 'Other': 3
            }
            multiplier = industry_multipliers.get(industry, 3)
            valuation = (revenue * multiplier) + (team_size * 50000)
        
        print(f"📊 Prediction: revenue={revenue}, team_size={team_size}, "
              f"industry={industry} → valuation={valuation:,.2f}")
        
        return jsonify({
            'valuation': round(valuation, 2)
        })
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("""
╔════════════════════════════════════════════════╗
║   🤖 ValuAI ML Service                         ║
║   ─────────────────────────────────────────    ║
║   📍 Running on: http://localhost:5000         ║
╚════════════════════════════════════════════════╝
    """)
    app.run(host='0.0.0.0', port=5000, debug=True)
