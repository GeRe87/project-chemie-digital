"""Renderer-independent histogram bin arithmetic, shared by projection/fallback tests."""
from bisect import bisect_right
import math

def edges_valid(edges):
    if not 2 <= len(edges) <= 513 or any(not math.isfinite(v) for v in edges) or any(not math.isfinite(b-a) or b <= a for a,b in zip(edges,edges[1:])):
        raise ValueError("Finite strictly increasing bin edges required (1–512 bins)")

def equal_width(edges):
    h=edges[1]-edges[0]
    return all(abs((b-a)-h) <= 1e-10*max(1,abs(h)) for a,b in zip(edges,edges[1:]))

def bin_index(value, edges):
    if not math.isfinite(value) or value < edges[0] or value > edges[-1]:
        raise ValueError("Bin edges must cover every finite observation")
    return min(len(edges)-2,bisect_right(edges,value)-1)

def bins(values, edges, normalization="count"):
    edges_valid(edges)
    if not values or normalization not in ("count","density"):
        raise ValueError("Nonempty histogram and declared normalization required")
    if normalization == "count" and not equal_width(edges):
        raise ValueError("Unequal bin widths require density heights")
    counts=[0]*(len(edges)-1)
    for value in values:counts[bin_index(value,edges)]+=1
    result=[dict(lower=a,upper=b,count=c,height=c if normalization=="count" else c/len(values)/(b-a),relativeFrequency=c/len(values)) for a,b,c in zip(edges,edges[1:],counts)]
    if any(not math.isfinite(b["height"]) for b in result):raise ValueError("Nonfinite histogram height")
    return result

def cells(data, edges, y_edges):
    edges_valid(edges);edges_valid(y_edges)
    nx,ny=len(edges)-1,len(y_edges)-1
    if not data or not equal_width(edges) or not equal_width(y_edges) or nx*ny > 4096:
        raise ValueError("2D histogram requires paired observations and an equal-width grid of at most 4096 cells")
    counts=[0]*(nx*ny)
    for d in data:counts[bin_index(d["y"],y_edges)*nx+bin_index(d["value"],edges)]+=1
    return [dict(xLower=edges[i%nx],xUpper=edges[i%nx+1],yLower=y_edges[i//nx],yUpper=y_edges[i//nx+1],count=c) for i,c in enumerate(counts)]
