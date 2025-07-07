import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset
from utils.config import LABEL_LIST, CPU_COUNT
import torch

torch.set_num_threads(CPU_COUNT)
EPOCHS = 5

def train_model():
    df = pd.read_csv("data/processed/transactions_clean.csv")
    df = df[df["Category"].isin(LABEL_LIST)]
    label2id = {label: i for i, label in enumerate(LABEL_LIST)}
    df["label"] = df["Category"].map(label2id)
    dataset = Dataset.from_pandas(df)

    tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
    dataset = dataset.map(lambda x: tokenizer(x["clean_text"], truncation=True, padding=True), batched=True)

    model = BertForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=len(LABEL_LIST))

    training_args = TrainingArguments(
        output_dir="models/bert_classifier",
       # evaluation_strategy="epoch",
        per_device_train_batch_size=16,
        num_train_epochs=EPOCHS,
        weight_decay=0.01,
        # dataloader_num_workers=4 NOTE on windows with the torch cpu setting this hangs the script
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        eval_dataset=dataset,
    )

    trainer.train()
    model.save_pretrained("models/bert_classifier")
    tokenizer.save_pretrained("models/bert_classifier")

if __name__ == "__main__":
    train_model()