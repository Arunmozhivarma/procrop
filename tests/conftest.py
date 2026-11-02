import os
import sys

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Set writable directories for matplotlib & numba
os.environ["MPLCONFIGDIR"] = os.path.join(PROJECT_ROOT, ".mplconfig")
os.environ["NUMBA_CACHE_DIR"] = os.path.join(PROJECT_ROOT, ".numbacache")
os.makedirs(os.environ["MPLCONFIGDIR"], exist_ok=True)
os.makedirs(os.environ["NUMBA_CACHE_DIR"], exist_ok=True)
