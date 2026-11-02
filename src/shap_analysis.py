import numpy as np
import pandas as pd
import shap

def get_shap_explanation(model, X_sample, feature_names=None):
    """
    Computes SHAP feature attributions for a single sample or DataFrame.
    Returns list of dicts with feature name, value, and SHAP contribution.
    """
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)
    
    # Handle single sample array or DataFrame
    if isinstance(X_sample, pd.DataFrame):
        vals = X_sample.iloc[0].to_dict() if len(X_sample) > 0 else {}
        feature_names = X_sample.columns.tolist()
    elif isinstance(X_sample, np.ndarray):
        if X_sample.ndim == 1:
            X_sample = X_sample.reshape(1, -1)
        vals = {feature_names[i]: float(X_sample[0, i]) for i in range(len(feature_names))} if feature_names else {}
    else:
        vals = {}
    
    # Extract shap values array for 1st sample
    if isinstance(shap_values, list):
        # Classification (2 classes)
        s_vals = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
    elif shap_values.ndim == 2:
        s_vals = shap_values[0]
    else:
        s_vals = shap_values
        
    explanations = []
    if feature_names:
        for fname, s_val in zip(feature_names, s_vals):
            explanations.append({
                'feature': fname,
                'value': vals.get(fname, None),
                'contribution': round(float(s_val), 4)
            })
        # Sort by absolute SHAP contribution descending
        explanations.sort(key=lambda x: abs(x['contribution']), reverse=True)
        
    return explanations
