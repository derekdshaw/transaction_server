import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
import re
from pathlib import Path
from utils.config import TEXT_TRANSFORMS

def transform_text(text, template):
    """
    Transforms text based on a template dictionary of patterns and replacements.
    If no pattern matches, returns the cleaned text in lowercase.
    
    Args:
        text (str): Input text to transform
        template (dict): Dictionary where keys are patterns to search for and 
                        values are the replacements
    
    Returns:
        str: Transformed text or cleaned lowercase text if no pattern matches
    """
    text = str(text)
    for pattern, replacement in template.items():
        if pattern in text:
            return replacement
    return clean_text(text)

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def preprocess_csv(input_path, output_path):
    """
    Preprocesses CSV file with text transformation template.
    
    Args:
        input_path (str): Path to input CSV file
        output_path (str): Path to save processed CSV file
    """
    df = pd.read_csv(input_path)
    df["clean_text"] = df["Extended Description"].apply(lambda x: transform_text(x, TEXT_TRANSFORMS))
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)

if __name__ == "__main__":
    preprocess_csv("data/raw/transactions.csv", "data/processed/transactions_clean.csv")