"""Create a ZIP file of the Mission Life project for deployment"""
import zipfile
import os

BASE = os.path.dirname(os.path.abspath(__file__))
SKIP = {'.', '__pycache__', 'node_modules', '.git'}
SKIP_FILES = {'deploy.py', 'make_zip.py', 'mission-life.zip'}

def make_zip():
    with zipfile.ZipFile(os.path.join(BASE, 'mission-life.zip'), 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(BASE):
            dirs[:] = [d for d in dirs if d not in SKIP and not d.startswith('.')]
            for f in files:
                if f in SKIP_FILES or f.startswith('.'):
                    continue
                full = os.path.join(root, f)
                arc = os.path.relpath(full, BASE)
                zf.write(full, arc)
                print(f"  + {arc}")
    size = os.path.getsize(os.path.join(BASE, 'mission-life.zip'))
    print(f"\n✅ mission-life.zip created ({size:,} bytes)")

if __name__ == '__main__':
    make_zip()
