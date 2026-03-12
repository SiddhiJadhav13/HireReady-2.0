import nbformat as nbf
import os

nb_path = r'c:\Users\Pooja\Documents\hire-ready_main\HireReady-2.0\jobs-skills.ipynb'

with open(nb_path, 'r', encoding='utf-8') as f:
    nb = nbf.read(f, as_version=4)

# Find the training cell
train_target = '# 4. Split and Train'
eval_target = '# 5. Professional Confusion Matrix Visualization'

train_idx = -1
eval_idx = -1

for i, cell in enumerate(nb.cells):
    if cell.cell_type == 'code':
        if train_target in cell.source:
            train_idx = i
        if eval_target in cell.source:
            eval_idx = i

if train_idx != -1 and eval_idx != -1:
    # Create the new accuracy block
    accuracy_source = """# 4.5 Calculate Overall Accuracy Metrics
from sklearn.metrics import accuracy_score, hamming_loss

y_pred = classifier.predict(X_test)
subset_acc = accuracy_score(y_test, y_pred)
hamming_acc = 1 - hamming_loss(y_test, y_pred)

print(f"--- Model Accuracy Summary ---")
print(f"Exact Match (Subset) Accuracy: {subset_acc*100:.2f}%")
print(f"Label-wise (Hamming) Accuracy: {hamming_acc*100:.2f}%")
"""
    accuracy_cell = nbf.v4.new_code_cell(accuracy_source)
    
    # Insert it between train and eval
    nb.cells.insert(train_idx + 1, accuracy_cell)
    
    # Also add a markdown explanation
    explanation = nbf.v4.new_markdown_cell(
        "### Accuracy Metrics Explained\n"
        "- **Subset Accuracy**: Strictest metric. Requires 100% correct skills for a role.\n"
        "- **Hamming Accuracy**: More flexible. Measures correctness per individual skill checkbox."
    )
    nb.cells.insert(train_idx + 2, explanation)

with open(nb_path, 'w', encoding='utf-8') as f:
    nbf.write(nb, f)

print("Notebook updated with a dedicated accuracy block between training and evaluation.")
