# Transaction Classifier

A BERT-based NLP pipeline to classify checking account transaction descriptions into categories.

## Structure

- `scripts/`: Core logic for preprocessing, training, inference.
- `utils/`: Helper configs.
- `data/`: Input/output CSVs.
- `models/`: Trained model storage.

## Configure

The utils/config.py file contains the following configurable parameters:

- CPU_COUNT: Number of CPU cores to use for training. Adjust based on your system's capabilities.
- LABEL_LIST: List of categories to classify transactions into. Modify based on your needs.
- TEXT_TRANSFORMS: Dictionary of text transformations to apply to the transaction descriptions. Modify based on your needs.

The scripts/infer.py file contains the following configurable parameters:

- CONFIDENCE_THRESHOLD: The minimum confidence score for a prediction to be considered valid. Adjust based on your needs.

The scripts/train.py file contains the following configurable parameters:

- EPOCHS: The number of epochs to train for. Adjust based on your needs.

## Usage

First create your python environment:
```bash
python -m venv .venv
.venv\Scripts\activate
```
You can also run the activate.ps1 script in the root directory, if you are on Windows. Then run
```bash
pip install -r requirements.txt
```

Place a file named transactions.csv in the data/raw directory. This will be the initial transaction data you want to train on, then classify. This file should have a column named "Extended Description".

Then run the following commands:

1. Preprocess the data:
   ```bash
   python scripts/preprocess.py

Once you have a transactions_clean.csv file you will want to create a column called "Category" that contains the category of each transaction. This will be used to train the model. You can use the utils/config.py file to define the categories you want to use. Then fill in the categories for about 100 or so transactions. More is better, but not necessary.

2. Train the model:
   ```bash
   python scripts/train.py

3. Infer on new data:
   ```bash
   python scripts/infer.py

The output will be a CSV file named transactions_classified.csv in the data/processed directory. This file will have the same columns as the input file, plus two additional columns: "Predicted_Category" and "Confidence_Score". Examine the Predicted_Category vs the Category column to see how well the model is doing. Adjust the CONFIDENCE_THRESHOLD in the infer.py file to get the desired level of confidence. You can also modify the Extended Description column to vary the description a little to help the model learn to handle different variations of the same transaction. Once you have the model working as you like the transactions_classified.csv file will have your newly classified data in it. You can then use that data in what ever way you see fit.

## Model

The model is stored in the models/bert_classifier directory. The model is a BERT model that has been fine-tuned on my personal transaction data. It may or may not be useful for you if you don't want to train on your own data.




