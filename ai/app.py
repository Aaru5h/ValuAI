"""
ValuAI ML Service
Flask API for startup valuation predictions using trained ML model
"""

import os
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load model, scaler, and features
print("🔄 Loading ML model and preprocessors...")

try:
    with open(os.path.join(BASE_DIR, 'valuation_model.pkl'), 'rb') as f:
        model = pickle.load(f)
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

try:
    with open(os.path.join(BASE_DIR, 'scaler.pkl'), 'rb') as f:
        scaler = pickle.load(f)
    print("✅ Scaler loaded successfully")
except Exception as e:
    print(f"❌ Error loading scaler: {e}")
    scaler = None

try:
    with open(os.path.join(BASE_DIR, 'features.pkl'), 'rb') as f:
        feature_columns = pickle.load(f)
    print(f"✅ Features loaded successfully ({len(feature_columns)} features)")
except Exception as e:
    print(f"❌ Error loading features: {e}")
    feature_columns = None

# Define available options based on the dataset
INDUSTRIES = ['Cybersecurity', 'E-Commerce', 'EdTech', 'FinTech', 'Gaming', 'HealthTech', 'IoT']
REGIONS = ['Australia', 'Europe', 'North America', 'South America']
EXIT_STATUSES = ['IPO', 'Private']


def create_feature_vector(data):
    """
    Create a feature vector matching the training data format.
    
    Expected input data:
    - funding_rounds: int
    - funding_amount: float (in millions USD)
    - revenue: float (in millions USD)
    - employees: int
    - market_share: float (percentage)
    - profitable: bool/int (0 or 1)
    - year_founded: int
    - industry: str
    - region: str
    - exit_status: str
    """
    
    # Initialize feature dictionary with zeros for all one-hot encoded columns
    features = {}
    
    # Numeric features
    features['Funding Rounds'] = data.get('funding_rounds', 1)
    features['Funding Amount (M USD)'] = data.get('funding_amount', 0)
    features['Revenue (M USD)'] = data.get('revenue', 0)
    features['Employees'] = data.get('employees', 1)
    features['Market Share (%)'] = data.get('market_share', 0)
    features['Profitable'] = 1 if data.get('profitable', False) else 0
    features['Year Founded'] = data.get('year_founded', 2020)
    
    # Initialize all startup name columns to False (we don't have a specific startup)
    # These will be set to 0 by default in the DataFrame
    
    # Initialize all categorical one-hot encoded columns to 0
    for industry in INDUSTRIES:
        features[f'Industry_{industry}'] = 0
    
    for region in REGIONS:
        features[f'Region_{region}'] = 0
    
    for exit_status in EXIT_STATUSES:
        features[f'Exit Status_{exit_status}'] = 0
    
    # Set the correct one-hot encoded values
    industry = data.get('industry', '')
    if industry in INDUSTRIES:
        features[f'Industry_{industry}'] = 1
    
    region = data.get('region', 'North America')
    if region in REGIONS:
        features[f'Region_{region}'] = 1
    
    exit_status = data.get('exit_status', 'Private')
    if exit_status in EXIT_STATUSES:
        features[f'Exit Status_{exit_status}'] = 1
    
    # Create DataFrame with all feature columns
    # We need to match exactly what the model expects
    df = pd.DataFrame([features])
    
    # Ensure all columns from training are present
    if feature_columns is not None:
        for col in feature_columns:
            if col not in df.columns:
                df[col] = 0  # Default to 0 for missing columns (like Startup Name columns)
        
        # Reorder columns to match training order
        df = df[feature_columns]
    
    return df


@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'ValuAI ML Service is running',
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None,
        'features_loaded': feature_columns is not None
    })


@app.route('/health', methods=['GET'])
def health():
    """Detailed health check"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'components': {
            'model': 'loaded' if model else 'not loaded',
            'scaler': 'loaded' if scaler else 'not loaded',
            'features': f'{len(feature_columns)} features' if feature_columns else 'not loaded'
        }
    })


@app.route('/options', methods=['GET'])
def get_options():
    """Return available options for dropdowns"""
    return jsonify({
        'success': True,
        'options': {
            'industries': INDUSTRIES,
            'regions': REGIONS,
            'exit_statuses': EXIT_STATUSES
        }
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict startup valuation based on input features.
    
    Expected JSON body:
    {
        "funding_rounds": 3,
        "funding_amount": 50.0,
        "revenue": 25.0,
        "employees": 100,
        "market_share": 5.0,
        "profitable": false,
        "year_founded": 2018,
        "industry": "FinTech",
        "region": "North America",
        "exit_status": "Private"
    }
    """
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded'
            }), 500
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No input data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['revenue', 'employees', 'industry']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Create feature vector
        feature_df = create_feature_vector(data)
        
        # Apply scaler if available
        if scaler is not None:
            try:
                feature_array = scaler.transform(feature_df)
            except Exception as e:
                print(f"⚠️ Scaler transform failed, using raw features: {e}")
                feature_array = feature_df.values
        else:
            feature_array = feature_df.values
        
        # Make prediction
        prediction = model.predict(feature_array)
        
        # Get the valuation (convert from numpy to Python float)
        valuation = float(prediction[0])
        
        # Ensure valuation is positive and reasonable
        # The model outputs valuation in millions USD based on dataset
        valuation_usd = max(0, valuation) * 1_000_000  # Convert to USD
        
        print(f"📊 Prediction made: ${valuation_usd:,.2f}")
        
        return jsonify({
            'success': True,
            'predicted_valuation': valuation_usd,
            'valuation': valuation_usd,  # Alias for compatibility
            'valuation_millions': valuation,
            'input_summary': {
                'industry': data.get('industry'),
                'revenue_m': data.get('revenue'),
                'employees': data.get('employees'),
                'funding_amount_m': data.get('funding_amount'),
                'region': data.get('region'),
                'exit_status': data.get('exit_status')
            }
        })
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("""
╔════════════════════════════════════════════════╗
║                                                ║
║   🤖 ValuAI ML Service                         ║
║   ─────────────────────────────────────────    ║
║   📍 Running on: http://localhost:5000         ║
║   📊 Model: valuation_model.pkl                ║
║                                                ║
╚════════════════════════════════════════════════╝
    """)
    app.run(host='0.0.0.0', port=5000, debug=True)
