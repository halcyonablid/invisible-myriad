"""Verify and restore the complete vault using only the Python standard library."""
from pathlib import Path,PurePosixPath
import hashlib,json,os,shutil,sys
ROOT=Path(__file__).resolve().parent

def safe(root,name):
 p=PurePosixPath(name)
 if not name or p.is_absolute() or p.as_posix()!=name or '\\' in name or any(x in ('.','..') or ':' in x or x.endswith((' ','.')) or x.split('.')[0].upper() in {'CON','PRN','AUX','NUL',*[f'COM{i}' for i in range(1,10)],*[f'LPT{i}' for i in range(1,10)]} for x in p.parts):raise ValueError('Unsafe path')
 q=root.joinpath(*p.parts)
 for a in (q,*q.parents):
  if a.exists() or a.is_symlink():
   if a.is_symlink() or getattr(a.lstat(),'st_file_attributes',0)&0x400:raise ValueError('Link/reparse path')
 return q

def digest(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def verify():
 m=json.loads((ROOT/'vault-manifest.json').read_text(encoding='utf-8'))
 assert m['format']=='obsidian-vault-backup-v1'
 names={r['path'] for r in m['files']};assert len(names)==len(m['files'])==m['count']
 assert len({n.casefold() for n in names})==len(names)
 actual=set()
 for b,ds,fs in os.walk(ROOT/'vault',followlinks=False):
  for n in ds+fs:safe(ROOT/'vault',(Path(b)/n).relative_to(ROOT/'vault').as_posix())
  actual.update((Path(b)/n).relative_to(ROOT/'vault').as_posix() for n in fs)
 assert actual==names,'File set differs'
 for r in m['files']:
  p=safe(ROOT/'vault',r['path']);assert p.stat().st_size==r['bytes'] and digest(p)==r['sha256'],'Content differs: '+r['path']
 for d in m['directories']:
  if d!='.':safe(ROOT/'vault',d)
 return m

def main():
 mode=sys.argv[1] if len(sys.argv)>1 else 'verify'
 if mode not in ('verify','restore'):raise ValueError('Use verify or restore <new-output-directory>')
 m=verify()
 if mode=='restore':
  out=Path(sys.argv[2]).absolute();safe(out.parent,out.name)
  if out.exists():raise ValueError('Output must be a new directory')
  out.mkdir(parents=True)
  for d in m['directories']:
   if d!='.':safe(out,d).mkdir(parents=True,exist_ok=True)
  for r in m['files']:
   target=safe(out,r['path']);shutil.copyfile(safe(ROOT/'vault',r['path']),target)
   assert target.stat().st_size==r['bytes'] and digest(target)==r['sha256']
  dirs={'.'}
  for b,ds,fs in os.walk(out):dirs.update((Path(b)/d).relative_to(out).as_posix() for d in ds)
  assert dirs==set(m['directories'])
 print(json.dumps({'pass':True,'mode':mode,'files':m['count'],'bytes':m['bytes'],'directories':len(m['directories'])}))
if __name__=='__main__':main()
