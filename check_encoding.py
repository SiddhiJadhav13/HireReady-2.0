import chardet
with open(r'c:\Users\Pooja\Documents\hire-ready_main\HireReady-2.0\main.py', 'rb') as f:
    rawdata = f.read()
    print(chardet.detect(rawdata))
    if b'\x00' in rawdata:
        print("Null bytes found")
