# Used for training modify based on your core count. You can fiddle with this
# as using all cores may cause slower performance due to deadlocks.
CPU_COUNT = 32

LABEL_LIST = [
    "Dining",
    "Groceries",
    "Utilities",
    "Entertainment",
    "Health",
    "Subscription",
    "Auto & Transport",
    "Credit Card Payment",
    "General Goods",
    "Phone",
    "Home & Garden",
    "Home Loan",
    "Income",
    "Transfer",
    "Fidelity Transfer",
    "Kid Cash",
    "Moving Expense",
    "Combined Insurance",
    "Learning",
    "Other"
]

# Text transformation patterns
# This is used to simplify the desciption field to make it easier for the model to interpret.
# Add transactions lables here in the form of "pattern": "label" where the pattern is the label
# for a transaction and the lable is a simplified form. 
TEXT_TRANSFORMS = {
"NETFLIX": "netflix",
"AMAZON.COM": "amazon goods"
}