"""Verify the shipped AI documentation package without writing to the vault."""
from pathlib import Path
import hashlib,json,os
ROOT=Path(__file__).resolve().parent/'ai-context'

def main():
 manifest=json.loads((ROOT/'package-manifest.json').read_text(encoding='utf-8'))
 assert manifest['format']=='daqian-ai-context-v1'
 names=set()
 for row in manifest['files']:
  name=row['path'];p=ROOT/name
  assert not Path(name).is_absolute() and '..' not in Path(name).parts and ':' not in name
  assert name not in names;names.add(name)
  for parent in (p,*p.parents):
   assert not parent.is_symlink() and not(getattr(parent.lstat(),'st_file_attributes',0)&0x400)
  b=p.read_bytes();assert len(b)==row['bytes'] and hashlib.sha256(b).hexdigest()==row['sha256'],name
 actual=set()
 for base,dirs,files in os.walk(ROOT):
  dirs[:]=[d for d in dirs if d not in ('results','__pycache__')]
  actual.update((Path(base)/f).relative_to(ROOT).as_posix() for f in files)
 assert actual==names|{'package-manifest.json'},'Unexpected or missing package files'
 print(json.dumps({'pass':True,'package_files':len(names)+1,'external_references':manifest['external_reference_count']}))
if __name__=='__main__':main()
