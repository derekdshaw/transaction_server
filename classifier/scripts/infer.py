import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
import torch
from transformers import BertTokenizer, BertForSequenceClassification
from utils.config import LABEL_LIST
import torch.nn.functional as F

CONFIDENCE_THRESHOLD = 0.0  # Set this to what you're comfortable with

def predict_category(text, model, tokenizer):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        logits = model(**inputs).logits
    probs = F.softmax(logits, dim=-1)
    max_conf, predicted_index = torch.max(probs, dim=1)
    confidence = max_conf.item()
    
    if confidence < CONFIDENCE_THRESHOLD:
        return "Other", confidence
    return LABEL_LIST[predicted_index.item()], confidence

def classify_csv(input_csv, output_csv):
    df = pd.read_csv(input_csv)
    tokenizer = BertTokenizer.from_pretrained("models/bert_classifier")
    model = BertForSequenceClassification.from_pretrained("models/bert_classifier")
    model.eval()
    
    # Create new columns for predictions and confidence scores
    predictions = []
    confidences = []
    
    for text in df["clean_text"]:
        prediction, confidence = predict_category(text, model, tokenizer)
        predictions.append(prediction)
        confidences.append(confidence)
    
    df["Predicted_Category"] = predictions
    df["Confidence_Score"] = confidences
    df.to_csv(output_csv, index=False)

if __name__ == "__main__":
    classify_csv("data/processed/transactions_clean.csv", "data/processed/transactions_classified.csv")