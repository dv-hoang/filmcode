# Downloads the asset packs named on the command line from the "assets" release; run by tools/fetch.sh.
import hashlib, json, os, shutil, subprocess, sys, tarfile, time, urllib.error, urllib.request
man = json.load(open('tools/assets.json'))
packs = sys.argv[1:]
missing = [p for p in packs if p not in man['packs']]
if missing:
    sys.exit(f'✗ {", ".join(missing)} is not published yet (tools/assets.json has no entry). Refresh the library '
             f'(update FilmCode) and try again.')


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''): h.update(chunk)
    return h.hexdigest()


def download(url, tmp, size):
    have = lambda: os.path.getsize(tmp) if os.path.exists(tmp) else 0
    if have() > size: os.remove(tmp)                                  # not a partial copy of this pack
    if have() == size: return
    print(f'↓ {os.path.basename(url)} ({size / 1e6:.0f} MB){f", resuming at {have() / 1e6:.0f} MB" if have() else ""}', flush=True)
    if shutil.which('curl'):                                          # resume, retries and a progress bar
        r = subprocess.run(['curl', '-L', '--fail', '--retry', '3', '--retry-delay', '2', '--connect-timeout', '20', '-C', '-', '-#', '-o', tmp, url])
        if r.returncode: sys.exit(f'✗ download failed (curl exit {r.returncode}); check the network and run the same command again to resume')
        return
    fails = 0
    try:
        while have() < size:
            req = urllib.request.Request(url, headers={'Range': f'bytes={have()}-'} if have() else {})
            try: r = urllib.request.urlopen(req, timeout=60)
            except urllib.error.HTTPError as e:                       # GitHub answers 5xx now and then: try again, resuming
                fails += 1
                if e.code < 500 or fails > 3: raise
                time.sleep(2 * fails); continue
            with r:
                append = have() > 0 and r.status == 206               # a server that ignores Range sends everything again
                with open(tmp, 'ab' if append else 'wb') as f:
                    done = have() if append else 0
                    while chunk := r.read(1 << 20):
                        f.write(chunk); done += len(chunk)
                        print(f'\r  {done / size * 100:5.1f} %', end='', flush=True)
        print()
    except OSError as e:
        sys.exit(f'\n✗ download failed ({e}); check the network and run the same command again to resume')


def extract(tmp):
    with tarfile.open(tmp) as t:
        if hasattr(tarfile, 'data_filter'):                           # Python 3.12+ and the patched 3.8-3.11
            t.extractall('.', filter='data')
            return
        root = os.path.realpath('.')                                  # older Pythons: refuse anything that could leave the folder
        for m in t.getmembers():
            dest = os.path.realpath(os.path.join(root, m.name))
            link = os.path.realpath(os.path.join(os.path.dirname(dest), m.linkname)) if m.issym() else os.path.realpath(os.path.join(root, m.linkname)) if m.islnk() else dest
            if os.path.isabs(m.name) or m.isdev() or not all(x == root or x.startswith(root + os.sep) for x in (dest, link)):
                sys.exit(f'✗ the pack contains an unsafe entry ({m.name}); nothing was unpacked')
        t.extractall('.')


os.makedirs('.release', exist_ok=True)
for name in packs:
    p = man['packs'][name]
    size, tmp = p['size'], os.path.join('.release', p['file'] + '.download')
    need, free = int(size * 2.2) - (os.path.getsize(tmp) if os.path.exists(tmp) else 0), shutil.disk_usage('.').free
    if free < need:
        sys.exit(f'✗ not enough disk space: {p["file"]} is {size / 1e9:.2f} GB and needs about {need / 1e9:.1f} GB free here while it downloads and unpacks; {free / 1e9:.1f} GB is available')
    download(f'https://github.com/{os.environ.get("FILMCODE_ASSETS_REPO", man["repo"])}/releases/download/{man["tag"]}/{p["file"]}', tmp, size)
    if sha256(tmp) != p['sha256']:
        os.remove(tmp)
        sys.exit('✗ checksum mismatch. The pack on the release was probably updated after your copy of the library was.\n'
                 '  Refresh the library (update FilmCode) and run this again. If it still fails, just retry.')
    extract(tmp)
    os.remove(tmp)
    print(f'✓ {name}')
try: os.rmdir('.release')                                             # ours only when nothing else is staged there
except OSError: pass
