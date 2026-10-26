"""Independent concave option: CP-SAT slots plus broad connected group tiles."""
import json, sys, math
from pathlib import Path
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent / 'python-deps'))
from ortools.sat.python import cp_model
f=json.load(sys.stdin); n=len(f['nodes'])
# Match the visible aspect ratio using physical card + routing clearance sizes.
# No flow direction or coordinate-preservation constraint is introduced.
aspect=f['viewport']['width']/f['viewport']['height']
cell_aspect=(max(v['width'] for v in f['nodes'])+100)/(max(v['height'] for v in f['nodes'])+120)
cols=min(n,8,max(1,round(math.sqrt(n*aspect/cell_aspect))))
rows=(n+cols-1)//cols+2; count=cols*rows
m=cp_model.CpModel()
slots=[m.new_int_var(0,count-1,f's{i}') for i in range(n)]
x=[m.new_int_var(0,cols-1,f'x{i}') for i in range(n)]
y=[m.new_int_var(0,rows-1,f'y{i}') for i in range(n)]
for i in range(n): m.add(slots[i]==y[i]*cols+x[i])
m.add_all_different(slots)
for banned in f.get('banned',[]): m.add_forbidden_assignments(slots,[banned])
at=[]
for i in range(n):
    row=[]
    for c in range(count):
        b=m.new_bool_var(f'at{i}_{c}');m.add(slots[i]==c).only_enforce_if(b);m.add(slots[i]!=c).only_enforce_if(b.Not());row.append(b)
    at.append(row)
def adjacent(c): return [d for d in range(count) if abs(c%cols-d%cols)+abs(c//cols-d//cols)==1]
regions=[]; area=[]
# Match the independent polygon reader at every vertex, including the outer
# grid border. Opposite diagonal tiles create a self-touch; 1/3 quadrants
# create a corner, while 0/4 or two adjacent quadrants do not.
def add_boundary_constraints(model,cells,cols,rows,tag):
    outside=model.new_constant(0)
    corners=[]
    for vy in range(rows+1):
        for vx in range(cols+1):
            quadrants=[cells[ty*cols+tx] if 0<=tx<cols and 0<=ty<rows else outside
                       for tx,ty in [(vx-1,vy-1),(vx,vy-1),(vx-1,vy),(vx,vy)]]
            corner=model.new_bool_var(f'corner{tag}_{vx}_{vy}')
            nw,ne,sw,se=quadrants
            model.add_bool_or([nw.Not(),ne,sw,se.Not()])
            model.add_bool_or([nw,ne.Not(),sw.Not(),se])
            pairs=model.new_int_var(0,2,f'cornerPairs{tag}_{vx}_{vy}')
            model.add(sum(quadrants)==2*pairs+corner)
            corners.append(corner)
    model.add(sum(corners)<=20)
    return corners

for gi,g in enumerate(f['groups']):
    members=set(g['members']); root=g['members'][0]
    cells=[m.new_bool_var(f'g{gi}_{c}') for c in range(count)]
    ranks=[m.new_int_var(0,count,f'r{gi}_{c}') for c in range(count)]
    for c in range(count):
        for i in range(n):m.add(cells[c]==(1 if i in members else 0)).only_enforce_if(at[i][c])
        m.add(ranks[c]==0).only_enforce_if(at[root][c])
        parents=[]
        for d in adjacent(c):
            b=m.new_bool_var(f'p{gi}_{c}_{d}');m.add_implication(b,cells[c]);m.add_implication(b,cells[d]);m.add(ranks[d]<ranks[c]).only_enforce_if(b);parents.append(b)
        m.add_bool_or([cells[c].Not(),at[root][c],*parents])
        # No long empty connecting tendrils: every occupied tile is at a member
        # or immediately adjacent to a member, and has full tile width.
        m.add_bool_or([cells[c].Not(),*[at[i][d] for i in members for d in [c,*adjacent(c)]]])
    m.add(sum(cells)<=len(members)*2+2)
    add_boundary_constraints(m,cells,cols,rows,gi)
    regions.append(cells);area.extend(cells)
maxx=m.new_int_var(0,cols-1,'maxx');maxy=m.new_int_var(0,rows-1,'maxy')
minx=m.new_int_var(0,cols-1,'minx');miny=m.new_int_var(0,rows-1,'miny')
m.add_max_equality(maxx,x);m.add_max_equality(maxy,y);m.add_min_equality(minx,x);m.add_min_equality(miny,y)
m.add(minx==0);m.add(miny==0);m.add(maxx==cols-1)
lengths=[]
for k,e in enumerate(f['edges']):
    dx=m.new_int_var(0,cols-1,f'dx{k}');dy=m.new_int_var(0,rows-1,f'dy{k}')
    m.add_abs_equality(dx,x[e['from']]-x[e['to']]);m.add_abs_equality(dy,y[e['from']]-y[e['to']]);lengths.extend([dx*3,dy*2])
m.minimize(maxy*100+sum(lengths)+sum(area)*5)
initial=f.get('initial',[])
if len(initial)==n:
    order=sorted(range(n),key=lambda i:(initial[i]['y'],initial[i]['x'],i))
    for rank,i in enumerate(order):m.add_hint(slots[i],rank)
s=cp_model.CpSolver();s.parameters.max_time_in_seconds=min(5,max(.1,f.get('solveSeconds',3)));s.parameters.num_search_workers=4;s.parameters.random_seed=17
status=s.solve(m);out={'solverStatus':s.status_name(status)}
if status in (cp_model.OPTIMAL,cp_model.FEASIBLE):
    out.update(slots=[s.value(v) for v in slots],cols=cols,rows=rows,regions=[[c for c,b in enumerate(cells) if s.value(b)] for cells in regions])
print(json.dumps(out))
