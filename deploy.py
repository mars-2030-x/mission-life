"""Deploy Mission Life to Netlify Drop (no auth required)"""
import http.client
import json
import os
import hashlib
import zipfile
import io
import sys

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

def get_all_files(base_dir):
    """Get all files in directory with their paths"""
    files = {}
    for root, dirs, filenames in os.walk(base_dir):
        # Skip hidden dirs and deploy script 
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
        for f in filenames:
            if f.startswith('.') or f == 'deploy.py':
                continue
            full_path = os.path.join(root, f)
            rel_path = '/' + os.path.relpath(full_path, base_dir).replace('\\', '/')
            files[rel_path] = full_path
    return files

def sha1_file(path):
    """Calculate SHA1 hash of file"""
    h = hashlib.sha1()
    with open(path, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def create_zip(base_dir):
    """Create zip of the project"""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        files = get_all_files(base_dir)
        for rel_path, full_path in files.items():
            arcname = rel_path.lstrip('/')
            zf.write(full_path, arcname)
    return buf.getvalue()

def deploy():
    print("📦 Creating deployment package...")
    zip_data = create_zip(PROJECT_DIR)
    print(f"   ZIP size: {len(zip_data)} bytes")
    
    print("🚀 Deploying to Netlify...")
    conn = http.client.HTTPSConnection("api.netlify.com")
    
    headers = {
        'Content-Type': 'application/zip',
    }
    
    conn.request('POST', '/api/v1/sites', body=zip_data, headers=headers)
    resp = conn.getresponse()
    data = resp.read().decode()
    
    if resp.status in (200, 201):
        result = json.loads(data)
        url = result.get('ssl_url') or result.get('url') or f"https://{result.get('subdomain')}.netlify.app"
        site_id = result.get('id', 'unknown')
        print(f"\n✅ 배포 성공!")
        print(f"🌐 URL: {url}")
        print(f"🆔 Site ID: {site_id}")
        return url
    else:
        print(f"❌ 배포 실패 (HTTP {resp.status})")
        print(data[:500])
        return None

if __name__ == '__main__':
    deploy()
