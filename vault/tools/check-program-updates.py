"""Read-only comparison. Never copy programs, reset settings, or overwrite examples."""
from pathlib import Path, PurePosixPath
import argparse,hashlib,json,stat
def safe_file(root,rel):
    p=PurePosixPath(rel)
    if p.is_absolute() or '..' in p.parts or '\\' in rel or ':' in rel or len(p.parts)<4 or p.parts[:2]!=('.obsidian','plugins'):raise ValueError('Unsafe program manifest path')
    current=root
    for part in p.parts:
        current=current/part
        if current.exists() and (current.is_symlink() or getattr(current.lstat(),'st_file_attributes',0)&getattr(stat,'FILE_ATTRIBUTE_REPARSE_POINT',0x400)):raise ValueError('Reparse refused')
    if not current.resolve().is_relative_to(root.resolve()):raise ValueError('Path escape')
    return current
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None
def candidates(folder):
    if not folder.is_dir():return []
    out=[]
    for f in folder.iterdir():
        legal=any(w in f.name.upper() for w in ('LICENSE','NOTICE','COPYING','COPYRIGHT'))
        if f.is_file() and (f.name in ('manifest.json','store-schema-v1.json') or legal or (f.suffix in ('.js','.cjs','.css') and '.test.' not in f.name and not f.name.startswith(('.','rollup')))):out.append(f)
    for name in ('vendor','layout-engines'):
        d=folder/name
        if d.is_dir():
            for f in d.rglob('*'):
                if f.is_file() and not any(x in ('__pycache__','.git','.cache') for x in f.relative_to(d).parts) and f.suffix not in ('.pyc','.pyo'):out.append(f)
    return out
def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--source-vault',type=Path);a=ap.parse_args()
    root=Path(__file__).resolve().parents[1];m=json.loads((root/'program-manifest.json').read_text(encoding='utf8'));changes=[];known=set()
    for e in m['files']:
        rel=e['path'];known.add(rel);local=digest(safe_file(root,rel));owned=e.get('origin')=='showcase'
        up=digest(safe_file(a.source_vault.resolve(),rel)) if a.source_vault and not owned else e['source_sha256']
        if local!=e['sha256'] or up!=e['source_sha256']:changes.append({'path':rel,'local_changed':local!=e['sha256'],'source_changed':up!=e['source_sha256'],'local_missing':local is None,'source_missing':up is None and not owned})
    additions=[];enabled_change=None
    if a.source_vault:
        source=a.source_vault.resolve();ids=json.loads((source/'.obsidian/community-plugins.json').read_text(encoding='utf-8-sig'));enabled_change={'added':sorted(set(ids)-set(m['enabled_ids'])),'removed':sorted(set(m['enabled_ids'])-set(ids))}
        for pid in ids:
            if '/' in pid or '\\' in pid or pid in ('.','..'):raise ValueError('Invalid enabled id')
            for f in candidates(source/'.obsidian/plugins'/pid):
                rel=f.relative_to(source).as_posix();safe_file(source,rel)
                if rel not in known:additions.append(rel)
    print(json.dumps({'read_only':True,'checked':len(known),'changes':changes,'new_source_files':additions,'enabled_changes':enabled_change,'note':'Review and back up selected program files; never overwrite owner data. Unknown new dependency directories require manual review.'},ensure_ascii=False,indent=2))
    raise SystemExit(1 if changes or additions or (enabled_change and any(enabled_change.values())) else 0)
if __name__=='__main__':main()
