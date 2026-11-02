import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("ROBOFLOW_API_KEY")
print("ROBOFLOW_API_KEY present:", bool(api_key))

targets = [
    ("hc147", "cotton-jassid"),
    ("hc147", "cotton_jassid_allies"),
    ("cotton-plant-224mo", "leaf-hopper-jassids"),
    ("cotton-plant-224mo", "leaf-redding"),
    ("guava-segmentation", "cotton-data-qdtse")
]

for ws, proj in targets:
    url = f"https://api.roboflow.com/{ws}/{proj}?api_key={api_key}"
    try:
        r = requests.get(url, timeout=10)
        print(f"[{ws}/{proj}] HTTP {r.status_code}")
        if r.status_code == 200:
            info = r.json()
            versions = info.get("versions", [])
            print(f"  Project: {info.get('project', {}).get('name')}")
            for v in versions[:3]:
                print(f"  Version: {v.get('id')}, images: {v.get('images')}, classes: {v.get('classes')}")
        else:
            print(f"  Response: {r.text[:200]}")
    except Exception as e:
        print(f"  Error: {e}")
