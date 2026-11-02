import os
import io
import zipfile
import time
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("ROBOFLOW_API_KEY")
os.makedirs("data/datasets", exist_ok=True)

def download_and_extract(url, target_dir):
    print(f"Downloading from {url} into {target_dir}...")
    os.makedirs(target_dir, exist_ok=True)
    r = requests.get(url, stream=True, timeout=60)
    if r.status_code == 200:
        z = zipfile.ZipFile(io.BytesIO(r.content))
        z.extractall(target_dir)
        print(f"Extracted {len(z.namelist())} files into {target_dir}")
        return True
    else:
        print(f"Download failed: status={r.status_code}")
        return False

# 1. hc147/cotton-jassid/4
jassid_url = "https://app.roboflow.com/ds/rwgkb6btpN?key=o6iNJa8QKm"
download_and_extract(jassid_url, "data/datasets/cotton_jassid")

# 2. Check pending exports
targets = [
    ("cotton-plant-224mo", "leaf-hopper-jassids", "1", "data/datasets/leaf_hopper_jassids"),
    ("cotton-plant-224mo", "leaf-redding", "1", "data/datasets/leaf_redding"),
    ("guava-segmentation", "cotton-data-qdtse", "3", "data/datasets/cotton_data_qdtse")
]

for ws, proj, ver, dest in targets:
    url = f"https://api.roboflow.com/{ws}/{proj}/{ver}/yolov8?api_key={api_key}"
    for attempt in range(5):
        try:
            r = requests.get(url, timeout=10)
            data = r.json()
            link = data.get("export", {}).get("link")
            if link:
                print(f"[{ws}/{proj}] Ready: {link}")
                download_and_extract(link, dest)
                break
            else:
                print(f"[{ws}/{proj}] Still processing (status {r.status_code}), waiting 5s...")
                time.sleep(5)
        except Exception as e:
            print(f"[{ws}/{proj}] Error: {e}")
            time.sleep(5)
