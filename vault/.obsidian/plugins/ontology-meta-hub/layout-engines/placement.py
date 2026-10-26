"""Isolated CP-SAT slot assignment; stdin fixture, stdout geometry. No runtime access."""
import json, sys, time, math
sys.dont_write_bytecode = True
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'python-deps'))
from ortools.sat.python import cp_model

f = json.load(sys.stdin)
started = time.perf_counter()
n = len(f['nodes'])
# Both axes are free. Occupied spans, not a preselected grid width, are bounded.
cols = rows = n
step_x = math.ceil(max(v['width'] for v in f['nodes'])) + 100
step_y = math.ceil(max(v['height'] for v in f['nodes'])) + 120
vw = max(1, f['viewport']['width'] - 60)
vh = max(1, f['viewport']['height'] - 60)
# Shape preference uses the node/group envelope plus the same 60px fit margin.
# Quantization is 1e-4; routing can enlarge this proxy and is validated later.
shapes = []
for c in range(1, n + 1):
    for r in range(1, n + 1):
        if abs(c-r) > 3 or c*r < n:
            continue
        width = (c-1)*step_x + step_x-100 + 28 + 60
        height = (r-1)*step_y + step_y-120 + 56 + 60
        extent = round(max(width/vw, height/vh)*10000)
        aspect_error = round(abs(math.log((width/height)/(vw/vh)))*10000)
        shapes.append(((extent, aspect_error, c*r), c, r))
shape_keys = sorted(set(key for key, _, _ in shapes))
shape_ranks = {key: rank for rank, key in enumerate(shape_keys)}
m = cp_model.CpModel()
x = [m.new_int_var(0, cols-1, f'x{i}') for i in range(n)]
y = [m.new_int_var(0, rows-1, f'y{i}') for i in range(n)]
slots = [m.new_int_var(0, cols*rows-1, f's{i}') for i in range(n)]
for i in range(n): m.add(slots[i] == y[i]*cols+x[i])
m.add_all_different(slots)
for gi, group in enumerate(f['groups']):
    members = group['members']
    left=m.new_int_var(0,cols-1,f'l{gi}');right=m.new_int_var(0,cols-1,f'r{gi}')
    top=m.new_int_var(0,rows-1,f't{gi}');bottom=m.new_int_var(0,rows-1,f'b{gi}')
    m.add_min_equality(left,[x[i] for i in members]);m.add_max_equality(right,[x[i] for i in members])
    m.add_min_equality(top,[y[i] for i in members]);m.add_max_equality(bottom,[y[i] for i in members])
    for i in range(n):
        if i in members: continue
        sides=[m.new_bool_var(f'o{gi}_{i}_{k}') for k in range(4)]
        for condition,b in zip([x[i]<left,x[i]>right,y[i]<top,y[i]>bottom],sides):m.add(condition).only_enforce_if(b)
        m.add_bool_or(sides)
maxx=m.new_int_var(0,cols-1,'maxx');maxy=m.new_int_var(0,rows-1,'maxy')
minx=m.new_int_var(0,cols-1,'minx');miny=m.new_int_var(0,rows-1,'miny')
m.add_max_equality(maxx,x);m.add_max_equality(maxy,y)
m.add_min_equality(minx,x);m.add_min_equality(miny,y)
m.add(minx==0);m.add(miny==0)
m.add(maxx-maxy <= 3); m.add(maxy-maxx <= 3)
shape_rank = m.new_int_var(0, len(shape_keys)-1, 'shape_rank')
m.add_allowed_assignments([maxx, maxy, shape_rank],
                          [(c-1, r-1, shape_ranks[key]) for key, c, r in shapes])
lengths=[]
for k,e in enumerate(f['edges']):
    dx=m.new_int_var(0,cols-1,f'dx{k}');dy=m.new_int_var(0,rows-1,f'dy{k}')
    m.add_abs_equality(dx,x[e['from']]-x[e['to']]);m.add_abs_equality(dy,y[e['from']]-y[e['to']])
    lengths.extend([dx*step_x,dy*step_y])
# Each edge is bounded by (n-1)*(step_x+step_y). One shape rank always wins
# over every possible edge-cost improvement; maximum objective stays < 2^53.
edge_bound = len(f['edges'])*(n-1)*(step_x+step_y)
m.minimize(shape_rank*(edge_bound+1)+sum(lengths))
# A viewport-fitted row-major hint is advisory, never a shape constraint.
_, hint_cols, _ = min(shapes)
for i in range(n):
    m.add_hint(x[i], i % hint_cols); m.add_hint(y[i], i // hint_cols)
s=cp_model.CpSolver();s.parameters.max_time_in_seconds=5;s.parameters.num_search_workers=1;s.parameters.random_seed=17
status=s.solve(m)
result={'solverStatus':s.status_name(status),'placementMs':(time.perf_counter()-started)*1000,'model':'CP-SAT free occupied spans; abs(columns-rows)<=3; viewport shape rank then physical edge length','timeLimitSeconds':5,'viewport':f['viewport'],'extentPrecision':0.0001}
if status in (cp_model.OPTIMAL,cp_model.FEASIBLE):
    result['positions']=[{'id':v['id'],'x':60+s.value(x[i])*step_x,'y':60+s.value(y[i])*step_y,'width':v['width'],'height':v['height']} for i,v in enumerate(f['nodes'])]
    result['objective']=s.objective_value;result['bestBound']=s.best_objective_bound
    result['grid']={'columns':s.value(maxx)+1,'rows':s.value(maxy)+1,'stepX':step_x,'stepY':step_y,'cells':[{'x':s.value(x[i]),'y':s.value(y[i])} for i in range(n)],'shapeRank':s.value(shape_rank)}
print(json.dumps(result))
