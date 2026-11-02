import numpy as np
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

def evaluate_regression(y_true, y_pred):
    """
    Computes MAE, RMSE, and R2 for regression models.
    """
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    return {
        'MAE': round(float(mae), 4),
        'RMSE': round(float(rmse), 4),
        'R2': round(float(r2), 4)
    }

def evaluate_naive_baseline(X_test, y_test, current_jassid_col='jassid_per_3_leaves'):
    """
    Naive baseline: Predict next-week Jassid using current week's jassid_per_3_leaves.
    """
    if current_jassid_col in X_test.columns:
        y_pred = X_test[current_jassid_col]
    else:
        # If model A (weather-only) has no jassid_per_3_leaves, use previous value from test series
        y_pred = y_test.shift(1).fillna(y_test.mean())
    
    return evaluate_regression(y_test, y_pred)

def evaluate_classification(y_true, y_pred):
    """
    Computes Accuracy, Precision, Recall, F1-score, and Confusion Matrix.
    """
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    cm = confusion_matrix(y_true, y_pred).tolist()
    
    return {
        'Accuracy': round(float(acc), 4),
        'Precision': round(float(prec), 4),
        'Recall': round(float(rec), 4),
        'F1': round(float(f1), 4),
        'Confusion_Matrix': cm
    }
