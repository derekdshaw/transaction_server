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
# TODO: Move this to a db, and load from there? Or perhaps another CSV file.
TEXT_TRANSFORMS = {
    "FIDELITY": "fidelity",
    "BK OF AMER VISA": "bank of america visa payment",
    "WA ST EMPLOY SEC  - UI BENEFIT": "unemployment benefit",
    "CITY OF SNOQUALMIE 38624 SE RIVER ST": "sewer and water utilities",
    "CITYOFSNOQUALMIE": "sewer and water utilities",
    "Withdrawal Transfer to 9345974472": "audi car payment",
    "Debit JPMorgan Chase": "subaru car payment",
    "VZWRLSS": "verizon wireless",
    "APPLE CASH SENT MONEY 1 INFINITE LOOP": "apple cash transfer",
    "CHEVRON": "fuel",
    "CHIPOTLE": "chipotle",
    "FARMERS INS": "farmers insurance",
    "NEWREZ-SHELLPOIN": "shellpoint mortgage servicing",
    "AMEX EPAYMENT": "american express payment",
    "NETFLIX": "netflix",
    "HAIRY HOUDINI": "dog poop pickup",
    "ZOOM.COM": "zoom subscription",
    "LOWE'S": "lowes",
    "PUGET SOUND ENER": "puget sound energy",
    "SAFEWAY FUEL": "fuel",
    "COMCAST CABLE": "comcast cable",
    "UPSTART NETWORK": "upstart loan payment",
    "AMAZON.COM": "amazon goods",
    "Infiniti  - Auto Lease": "infiniti lease",
    "MACYS  - ONLINE PMT": "macys credit card payment",
    "WASTE MANAGEMENT": "waste management",
    "Debit KEYBANKNA": "key bank line of credit payment",
    "******3532": "first tech primary mortgage",

}