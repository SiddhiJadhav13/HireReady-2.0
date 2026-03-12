import nbformat as nbf
from nbconvert.preprocessors import ExecutePreprocessor
import os

nb_path = r'c:\Users\Pooja\Documents\hire-ready_main\HireReady-2.0\jobs-skills.ipynb'

with open(nb_path, 'r', encoding='utf-8') as f:
    nb = nbf.read(f, as_version=4)

ep = ExecutePreprocessor(timeout=600, kernel_name='python3')

try:
    ep.preprocess(nb, {'metadata': {'path': r'c:\Users\Pooja\Documents\hire-ready_main\HireReady-2.0'}})
    with open(nb_path, 'w', encoding='utf-8') as f:
        nbf.write(nb, f)
    print("Notebook executed and saved.")
except Exception as e:
    print(f"Error executing notebook: {e}")
