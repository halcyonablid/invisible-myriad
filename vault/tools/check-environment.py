"""Report desktop prerequisites without installing or writing anything."""
import subprocess,json,shutil,platform
def run(cmd):
    try:
        p=subprocess.run(cmd,capture_output=True,text=True,timeout=15)
        return {'available':p.returncode==0,'version':(p.stdout or p.stderr).strip()[:300]}
    except (OSError,subprocess.TimeoutExpired):return {'available':False}
print(json.dumps({'read_only':True,'platform':platform.system(),'node':run(['node','--version']),'python312_x64':run(['py','-3.12','-c','import sys,struct; print(sys.version); print(struct.calcsize("P")*8); sys.exit(0 if struct.calcsize("P")==8 else 1)']),'pandoc':run(['pandoc','--version']),'latex_for_pandoc_pdf':bool(shutil.which('xelatex') or shutil.which('pdflatex')),'obsidian_host':'Check plugin-inventory.json minAppVersion. Native GUI acceptance required.','network_features':'BRAT updates, Excalidraw online fonts/AI and remote embeds require network; credentials are never supplied.'},ensure_ascii=False,indent=2))
