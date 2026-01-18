"""
ValuAI Model Training Script
Trains a Linear Regression model for startup valuation prediction
"""

import os
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'files', 'final_valuation_dataset.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'valuation_model.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'scaler.pkl')
ENCODER_PATH = os.path.join(BASE_DIR, 'encoder.pkl')


def clean_currency(value):
    """Convert currency strings like '$5M' to numeric values"""
    if pd.isna(value):
        return 0
    if isinstance(value, (int, float)):
        return float(value)
    
    value = str(value).strip().upper()
    value = value.replace('$', '').replace(',', '')
    
    multiplier = 1
    if 'B' in value:
        multiplier = 1_000_000_000
        value = value.replace('B', '')
    elif 'M' in value:
        multiplier = 1_000_000
        value = value.replace('M', '')
    elif 'K' in value:
        multiplier = 1_000
        value = value.replace('K', '')
    
    try:
        return float(value) * multiplier
    except ValueError:
        return 0


def load_and_clean_data():
    """Load and clean the dataset"""
    print("📂 Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"   Loaded {len(df)} rows, {len(df.columns)} columns")
    
    # Check if we have the preprocessed dataset (with one-hot encoded columns)
    # or a raw dataset
    if 'Revenue (M USD)' in df.columns:
        # Preprocessed dataset - extract what we need
        print("📊 Processing preprocessed dataset...")
        
        # Get numeric features
        revenue = df['Revenue (M USD)'].fillna(0).values
        employees = df['Employees'].fillna(1).values
        
        # Extract industry from one-hot encoded columns
        industry_cols = [col for col in df.columns if col.startswith('Industry_')]
        if industry_cols:
            # Find which industry column is True for each row
            industries = []
            for idx, row in df.iterrows():
                found = False
                for col in industry_cols:
                    if row[col] == True or row[col] == 1:
                        industries.append(col.replace('Industry_', ''))
                        found = True
                        break
                if not found:
                    industries.append('Other')
            industry = industries
        else:
            industry = ['Other'] * len(df)
        
        # Get valuation (target)
        valuation = df['valuation'].fillna(0).values
        
        # Create clean dataframe
        clean_df = pd.DataFrame({
            'revenue': revenue,
            'team_size': employees,
            'industry': industry,
            'valuation': valuation
        })
        
    else:
        # Raw dataset - clean it
        print("📊 Cleaning raw dataset...")
        
        # Map column names (adjust based on actual column names)
        column_mapping = {
            'Revenue': 'revenue',
            'Team Size': 'team_size', 
            'Employees': 'team_size',
            'Industry': 'industry',
            'Valuation': 'valuation'
        }
        
        clean_df = df.rename(columns=column_mapping)
        
        # Clean currency columns
        if 'revenue' in clean_df.columns:
            clean_df['revenue'] = clean_df['revenue'].apply(clean_currency)
        if 'valuation' in clean_df.columns:
            clean_df['valuation'] = clean_df['valuation'].apply(clean_currency)
        
        # Fill missing values
        clean_df['revenue'] = clean_df['revenue'].fillna(0)
        clean_df['team_size'] = clean_df['team_size'].fillna(1)
        clean_df['industry'] = clean_df['industry'].fillna('Other')
        clean_df['valuation'] = clean_df['valuation'].fillna(0)
    
    # Remove rows with zero valuation
    clean_df = clean_df[clean_df['valuation'] > 0]
    
    print(f"   Cleaned dataset: {len(clean_df)} rows")
    print(f"   Industries: {clean_df['industry'].unique()}")
    
    return clean_df


def train_model(df):
    """Train the Linear Regression model"""
    print("\n🤖 Training model...")
    
    # Encode industry
    encoder = LabelEncoder()
    df['industry_encoded'] = encoder.fit_transform(df['industry'])
    
    # Prepare features and target
    X = df[['revenue', 'team_size', 'industry_encoded']].values
    y = df['valuation'].values
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    model = LinearRegression()
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"   MSE: {mse:,.2f}")
    print(f"   R² Score: {r2:.4f}")
    print(f"   Model coefficients: {model.coef_}")
    
    return model, scaler, encoder


def save_artifacts(model, scaler, encoder):
    """Save model and preprocessing artifacts"""
    print("\n💾 Saving artifacts...")
    
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    print(f"   Saved: {MODEL_PATH}")
    
    with open(SCALER_PATH, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"   Saved: {SCALER_PATH}")
    
    with open(ENCODER_PATH, 'wb') as f:
        pickle.dump(encoder, f)
    print(f"   Saved: {ENCODER_PATH}")


def main():
    print("=" * 50)
    print("🚀 ValuAI Model Training")
    print("=" * 50)
    
    # Load and clean data
    df = load_and_clean_data()
    
    # Train model
    model, scaler, encoder = train_model(df)
    
    # Save artifacts
    save_artifacts(model, scaler, encoder)
    
    print("\n✅ Training complete!")
    print("=" * 50)


if __name__ == '__main__':
    main()
