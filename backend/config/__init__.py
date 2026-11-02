import os
import json

CONFIG_DIR = os.path.dirname(__file__)
APP_CONFIG_PATH = os.path.join(CONFIG_DIR, "app_config.json")

def get_app_config() -> dict:
    if os.path.exists(APP_CONFIG_PATH):
        with open(APP_CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}
