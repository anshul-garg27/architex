# S2 Geometry, Uber H3, and R-Trees

## Part 1: Google S2 Geometry

### What Is S2?

S2 is Google's geometry library for operations on the **sphere**. Unlike geohash,
which projects the sphere onto a flat rectangle (Mercator-like), S2 projects the
sphere onto the six faces of a **cube**, then applies a **Hilbert curve** mapping
to convert 2D cell coordinates into a 1D sortable integer.

```
Key insight: S2 works directly on the sphere's surface.
No edge distortion at poles. No discontinuities between cells.
This is why Google uses it for Maps, Earth, and Bigtable.
```

### How S2 Works: Sphere to Cube to Hilbert Curve

**Step 1: Project sphere onto cube (6 faces)**
```
            +-------+
            |       |
            | Face 2|
            | (top) |
            |       |
    +-------+-------+-------+-------+
    |       |       |       |       |
    | Face 3| Face 0| Face 1| Face 4|
    | (left)|(front)|(right)| (back)|
    |       |       |       |       |
    +-------+-------+-------+-------+
            |       |
            | Face 5|
            |(bottom)|
            |       |
            +-------+

Each point on Earth maps to a point on one of these 6 faces.
The cube projection minimizes area distortion compared to
rectangular projections (like Mercator).
```

**Step 2: Subdivide each face using a Hilbert curve**

Each face is recursively subdivided into 4 cells, and cells are numbered
along a Hilbert curve (not a Z-curve like geohash). The Hilbert curve has
a critical advantage: **adjacent cells on the curve are always spatially adjacent**.

```
Z-curve (geohash):              Hilbert curve (S2):
+---+---+---+---+              +---+---+---+---+
| 0 | 1 | 4 | 5 |              | 0 | 1 | E | F |
+---+---+---+---+              +---+---+---+---+
| 2 | 3 | 6 | 7 |              | 3 | 2 | D | C |
+---+---+---+---+              +---+---+---+---+
| 8 | 9 | C | D |              | 4 | 7 | 8 | B |
+---+---+---+---+              +---+---+---+---+
| A | B | E | F |              | 5 | 6 | 9 | A |
+---+---+---+---+              +---+---+---+---+

Z-curve: 3->4 jumps far!       Hilbert: every step is to a neighbor.
This means S2 range queries have fewer false positives.
```

### S2 Cell Hierarchy: 30 Levels

| Level | Cell Count    | Approx Cell Area    | Edge Length (approx) |
|:-----:|:-------------|:--------------------|:---------------------|
| 0     | 6             | ~85 million km^2    | ~7,842 km            |
| 1     | 24            | ~21 million km^2    | ~3,921 km            |
| 5     | 6,144         | ~83,000 km^2        | ~288 km              |
| 10    | 6,291,456     | ~81 km^2            | ~9 km                |
| 12    | 100,663,296   | ~5.1 km^2           | ~2.3 km              |
| 14    | 1.6 billion   | ~0.32 km^2          | ~560 m               |
| 16    | 25.7 billion  | ~0.020 km^2         | ~140 m               |
| 20    | 6.6 trillion  | ~0.078 m^2          | ~8.8 m               |
| 24    | 1.7 x 10^15   | ~0.0000049 m^2      | ~0.55 m              |
| 30    | 6.9 x 10^18   | ~0.48 cm^2          | ~0.7 cm              |

**Interview tip:** Level 12-14 is typical for ride-sharing proximity (2.3 km - 560 m cells).

### S2CellId: The 64-bit Integer

Every S2 cell is represented by a single **64-bit integer** (S2CellId).

```
S2CellId (64 bits):
+---+---+---+---+---+---+---+---+---+---+---+
| Face (3 bits) | Position along Hilbert curve (up to 60 bits) | 1 |
+---+---+---+---+---+---+---+---+---+---+---+

- 3 bits: which of the 6 cube faces (0-5)
- Up to 60 bits: position on Hilbert curve (2 bits per level, 30 levels)
- Trailing "1" bit: marks the level (position of the trailing 1 indicates depth)
```

**Critical properties:**
1. **Sortable**: S2CellIds are numerically ordered so that nearby cells have nearby IDs
2. **Containment by prefix**: a parent cell's ID range contains all children's IDs
3. **Efficient range queries**: "find all cells in region" = a set of integer ranges

### S2RegionCoverer: Covering Arbitrary Shapes

Given any region (circle, polygon, etc.), S2RegionCoverer finds a minimal set of
S2 cells that covers it. It uses cells of different levels to balance coverage
precision vs number of cells.

```
Covering a circular region around San Francisco:

      +----+----+----+----+
      |    |    |    |    |
      +----+--+-+----+----+
      |    | /   \   |    |
      +----+/ cir \--+----+
      |    |\ cle /  |    |
      +----+-\   /+--+----+
      |    |  +-+ |   |    |
      +----+----+----+----+

S2RegionCoverer output:
  - 3 large cells (Level 12) for the center
  - 8 medium cells (Level 13) for the edges
  - 12 small cells (Level 14) for fine border approximation

Total: ~23 cells cover the circle with minimal over/under-coverage.
Each cell is a range query on S2CellId in the database.
```

```python
# Using google-s2 (pip install s2geometry or s2sphere)
import s2sphere

# Create a point
latlng = s2sphere.LatLng.from_degrees(37.7749, -122.4194)
cell_id = s2sphere.CellId.from_lat_lng(latlng)

# Get cell at different levels
level_12_cell = cell_id.parent(12)
print(f"Level 12 cell ID: {level_12_cell.id()}")
print(f"Level 12 token:   {level_12_cell.to_token()}")

# Cover a circular region
region = s2sphere.Cap.from_axis_angle(
    s2sphere.LatLng.from_degrees(37.7749, -122.4194).to_point(),
    s2sphere.Angle.from_degrees(0.02)  # ~2 km radius
)

coverer = s2sphere.RegionCoverer()
coverer.min_level = 12
coverer.max_level = 16
coverer.max_cells = 20

covering = coverer.get_covering(region)
print(f"Covering uses {len(covering)} cells")
for cell in covering:
    print(f"  Cell: {cell.to_token()}, Level: {cell.level()}")
```

### Why Google Uses S2

| Use Case            | How S2 Is Used                                         |
|:--------------------|:-------------------------------------------------------|
| Google Maps         | Tile indexing, spatial search, geocoding                |
| Google Earth        | Hierarchical cell rendering at different zoom levels    |
| Bigtable            | S2CellId as row key for spatial range scans             |
| Spanner             | Geospatial indexes using S2 cell hierarchy              |
| Google Ads          | Location targeting ("show ad within 5 km of store")     |

**Bigtable pattern:**
```
Row key: <S2CellId_Level14>/<entity_type>/<entity_id>
         |                   |              |
         Spatial locality    Type filter    Unique ID

Range scan: all rows between S2CellId_min and S2CellId_max
from the RegionCoverer output.
```

### S2 Advantages Over Geohash

| Property              | Geohash              | S2 Geometry           |
|:----------------------|:---------------------|:----------------------|
| Projection            | Rectangular (lat/lon)| Cube (sphere-aware)   |
| Pole distortion       | Severe               | None                  |
| Space-filling curve   | Z-curve              | Hilbert curve         |
| Curve continuity      | Has jumps            | Always continuous     |
| Cell shape            | Rectangle            | Roughly square        |
| Region covering       | Manual (9 neighbors) | S2RegionCoverer       |
| Cell ID               | String               | 64-bit integer        |
| Database efficiency   | String prefix scan   | Integer range scan    |

---

## Part 2: Uber H3 (Hexagonal Hierarchical Index)

### Why Hexagons?

This is a favorite interview topic. Hexagons have a geometric property that squares
and triangles lack: **equidistant neighbors**.

```
SQUARE GRID:                       HEXAGONAL GRID:

+---+---+---+                         / \   / \
|   | N |   |                        / 2 \ / 3 \
+---+---+---+                       +-----+-----+
| W | X | E |  <-- Distance to N   / \   / \   / \
+---+---+---+      != distance    / 1 \ / X \ / 4 \
|   | S |   |      to NW!        +-----+-----+-----+
+---+---+---+                      \ 6 / \ 5 /
                                    \ /   \ /
X to N  = 1 unit                     +-----+
X to NW = sqrt(2) = 1.414 units
                                    X to ANY neighbor = 1 unit
Two different distances!            ALL neighbors equidistant!
```

**Why this matters for Uber:**
- ETA calculation: "How far away is the nearest driver?" With hexagons, all
  adjacent cells are the same distance away. With squares, diagonal neighbors
  are sqrt(2) further.
- Surge pricing: hex cells create smoother boundaries (no diagonal artifacts)
- Supply-demand balancing: equal area means equal comparison between cells

### H3 Resolution Levels

| Resolution | Avg Cell Area     | Avg Edge Length | Num Cells         |
|:----------:|:------------------|:----------------|:------------------|
| 0          | 4,357,449 km^2    | 1,108 km        | 122               |
| 1          | 609,788 km^2      | 419 km          | 842               |
| 2          | 86,745 km^2       | 158 km          | 5,882             |
| 3          | 12,393 km^2       | 59.8 km         | 41,162            |
| 4          | 1,770 km^2        | 22.6 km         | 288,122           |
| 5          | 252.9 km^2        | 8.5 km          | 2,016,842         |
| 6          | 36.13 km^2        | 3.2 km          | 14,117,882        |
| 7          | 5.161 km^2        | 1.2 km          | 98,825,162        |
| 8          | 0.7373 km^2       | 461 m           | 691,776,122       |
| 9          | 0.1053 km^2       | 174 m           | 4,842,432,842     |
| 10         | 0.01505 km^2      | 65.9 m          | 33,897,029,882    |
| 15         | 0.0000009 km^2    | 0.509 m         | ~5.7 x 10^14     |

**Uber's typical resolutions:**
- Resolution 7 (~1.2 km): surge pricing zones
- Resolution 8-9 (~450 m - 174 m): driver-rider matching
- Resolution 10 (~66 m): pickup point precision

### H3 Index: 64-bit Integer

```
H3 Index (64 bits):
+------+------+------+------+------+------+------+
| Mode | Res  |Base  | Digit| Digit| ...  | Digit|
|(4 bit)|(4bit)|Cell  |  1   |  2   |      |  15  |
|      |      |(7bit)|(3bit)|(3bit)|      |(3bit)|
+------+------+------+------+------+------+------+

- Mode: 1 = H3 cell index
- Resolution: 0-15
- Base cell: which of the 122 base icosahedron cells
- Digits: 0-6 for each child within the hexagonal parent
  (7 children per hex: center + 6 rotational positions)
```

### Key H3 Operations

```python
import h3

# --- Indexing ---
lat, lon = 37.7749, -122.4194

# Convert lat/lon to H3 cell at resolution 9
cell = h3.latlng_to_cell(lat, lon, 9)
print(cell)  # "8928308280fffff"

# Convert back to lat/lon (cell center)
center = h3.cell_to_latlng(cell)
print(center)  # (37.77487, -122.41941)

# Get cell boundary (for visualization)
boundary = h3.cell_to_boundary(cell)

# --- Neighbors (k-ring) ---

# Get all cells within k=1 ring (the cell + 6 immediate neighbors)
ring_1 = h3.grid_disk(cell, 1)
print(len(ring_1))  # 7 (center + 6 neighbors)

# k=2 ring: center + 6 + 12 = 19 cells
ring_2 = h3.grid_disk(cell, 2)
print(len(ring_2))  # 19

# Just the ring (not the filled disk)
ring_only = h3.grid_ring(cell, 2)
print(len(ring_only))  # 12 (only the outer ring)

# --- Hierarchy ---

# Get parent cell (lower resolution)
parent = h3.cell_to_parent(cell, 7)
print(parent)  # Resolution 7 parent

# Get children (higher resolution)
children = h3.cell_to_children(cell, 10)
print(len(children))  # ~7 children

# --- Polyfill: Cover a polygon with H3 cells ---
polygon = [
    (37.7749, -122.4194),
    (37.7849, -122.4094),
    (37.7649, -122.4094),
    (37.7749, -122.4194),  # close the polygon
]

# GeoJSON format for h3
geojson = {
    "type": "Polygon",
    "coordinates": [[(lon, lat) for lat, lon in polygon]]
}
cells = h3.geo_to_cells(geojson, 9)
print(f"Polygon covered by {len(cells)} cells at resolution 9")

# --- Distance ---
cell_a = h3.latlng_to_cell(37.7749, -122.4194, 9)
cell_b = h3.latlng_to_cell(37.7849, -122.4094, 9)
grid_dist = h3.grid_distance(cell_a, cell_b)
print(f"Grid distance: {grid_dist} cells")
```

### Why Uber Built H3

Uber created H3 because no existing system provided hexagonal hierarchical indexing
that met their needs:

**1. Surge Pricing**
```
Square grid surge zones:          Hexagonal surge zones:

+---+---+---+                      / \   / \   / \
|1.0|1.5|2.0|                     /1.0\ /1.5\ /2.0\
+---+---+---+  Diagonal          +-----+-----+-----+
|1.5|2.5|2.0|  boundaries         \1.5/ \2.5/ \2.0/
+---+---+---+  create              \ /   \ /   \ /
|1.0|1.5|1.0|  "staircase"         +-----+-----+
+---+---+---+  artifacts         /1.0\ /1.5\ /1.0\
                                 +-----+-----+-----+
Surge 2.5x zone has sharp         Smooth boundaries,
diagonal edges.                    natural transition.
```

**2. Supply-Demand Matching**
```
For each H3 cell at resolution 7:
  supply[cell] = count of available drivers in cell
  demand[cell] = count of ride requests in cell
  
  imbalance = demand[cell] - supply[cell]
  
  if imbalance > threshold:
      surge_multiplier = calculate_surge(imbalance)
      
  # Compare with k-ring neighbors for smoothing
  for neighbor in h3.grid_disk(cell, 1):
      ...
```

**3. ETA Estimation**
```
Pre-compute average travel time between H3 cells:
  eta_matrix[cell_a][cell_b] = historical_avg_minutes

When rider requests ETA:
  rider_cell = h3.latlng_to_cell(rider_lat, rider_lon, 9)
  driver_cell = h3.latlng_to_cell(driver_lat, driver_lon, 9)
  estimated_eta = eta_matrix[rider_cell][driver_cell]
```

### Hexagonal Grid vs Square Grid: Visual Comparison

```
SQUARE GRID (geohash-style):

     Searching "within 2 cells" of center X:
     +---+---+---+---+---+
     |   | * | * | * |   |
     +---+---+---+---+---+
     | * | * | * | * | * |    * = cells within distance 2
     +---+---+---+---+---+    X = center
     | * | * | X | * | * |
     +---+---+---+---+---+    Notice: corners are further away
     | * | * | * | * | * |    than edges. The "circle" is a
     +---+---+---+---+---+    jagged diamond shape.
     |   | * | * | * |   |
     +---+---+---+---+---+

HEXAGONAL GRID (H3-style):

     Searching k-ring k=2 around center X:

              / \   / \   / \
             / * \ / * \ / * \
            +-----+-----+-----+
           / \   / \   / \   / \
          / * \ / * \ / * \ / * \      * = cells within k=2
         +-----+-----+-----+-----+    X = center
          \ * / \ * / \ X / \ * /
           \ /   \ /   \ /   \ /      The k-ring is a much
            +-----+-----+-----+       better approximation
           / \   / \   / \   / \      of a circle!
          / * \ / * \ / * \ / * \
         +-----+-----+-----+-----+
          \   / \ * / \ * / \ * /
           \ /   \ /   \ /   \ /
            +-----+-----+-----+

     19 cells (k=2 disk) approximate a circle far better
     than the 25-cell square grid equivalent.
```

---

## Part 3: R-Tree

### What Is an R-Tree?

An R-Tree is a balanced tree where each node represents a **minimum bounding rectangle**
(MBR) that contains all of its children. Unlike quadtrees (which subdivide space),
R-Trees group nearby objects and enclose them in bounding boxes.

```
Key insight: R-Trees index OBJECTS (rectangles, polygons, lines),
not just points. This is why PostGIS and SpatiaLite use R-Trees.
```

### How R-Trees Work

```
Data: 7 spatial objects (A through G)

A = park (polygon)      E = road segment (line)
B = building (polygon)  F = lake (polygon)
C = building (polygon)  G = point of interest
D = building (polygon)

Step 1: Group nearby objects into bounding boxes

  +----------------------------------+
  |  R1                              |
  |  +---------+   +---------+      |
  |  |  A      |   | B       |      |
  |  | (park)  |   |(building)|     |
  |  +---------+   +---------+      |
  +----------------------------------+
  
  +----------------------------------+
  |  R2                              |
  |  +------+  +------+  +---+      |
  |  |  C   |  |  D   |  | G |      |
  |  +------+  +------+  +---+      |
  |       +------------------+       |
  |       |    E (road)      |       |
  |       +------------------+       |
  +----------------------------------+
  
  +------------------+
  |  R3              |
  |  +------------+  |
  |  |  F (lake)  |  |
  |  +------------+  |
  +------------------+

Step 2: Group bounding boxes into higher-level boxes

  +---------------------------------------------------+
  |  ROOT                                              |
  |                                                    |
  |  +------------------+  +------------------+        |
  |  | R_left           |  | R_right          |        |
  |  |  +----+ +----+   |  |  +----+ +----+   |       |
  |  |  | R1 | | R3 |   |  |  | R2 |          |       |
  |  |  +----+ +----+   |  |  +----+          |       |
  |  +------------------+  +------------------+        |
  +---------------------------------------------------+
```

**Tree structure:**
```
                    ROOT
                 [big MBR]
                /          \
           R_left          R_right
          [MBR_L]          [MBR_R]
          /     \              |
        R1       R3          R2
      [MBR]    [MBR]       [MBR]
      / \        |         / | \ \
     A   B       F        C  D  E  G
```

### R-Tree Operations

**Search (overlap query):**
```
search(node, query_rect):
    results = []
    for child in node.children:
        if child.MBR overlaps query_rect:
            if child is leaf:
                results.append(child.object)
            else:
                results.extend(search(child, query_rect))
    return results

Time: O(log N) average, O(N) worst case
The key: MBR overlap test quickly prunes irrelevant branches.
```

**Insert:**
```
insert(node, new_object):
    if node is leaf:
        add new_object to node
        if node overflows (> max entries):
            split node into two
            propagate split upward
    else:
        # Choose the child whose MBR needs least enlargement
        best_child = min(node.children,
                         key=lambda c: enlargement(c.MBR, new_object.MBR))
        insert(best_child, new_object)
        update node.MBR to include new_object
```

**Nearest Neighbor:**
```
nearest_neighbor(node, query_point):
    # Priority queue ordered by minimum distance to MBR
    pq = PriorityQueue()
    pq.push(root, distance=0)
    best_dist = infinity
    best_obj = None
    
    while not pq.empty():
        node, dist = pq.pop()
        if dist > best_dist:
            break  # cannot improve
        if node is leaf object:
            d = distance(query_point, node)
            if d < best_dist:
                best_dist = d
                best_obj = node
        else:
            for child in node.children:
                d = min_distance(query_point, child.MBR)
                if d < best_dist:
                    pq.push(child, d)
    return best_obj
```

### R*-Tree: Improved R-Tree

The R*-Tree improves upon the basic R-Tree with better insertion heuristics:

1. **Forced reinsert:** When a node overflows, instead of immediately splitting,
   remove 30% of entries and reinsert them. This often prevents the split entirely
   and produces better tree quality.

2. **Combined optimization:** Considers overlap minimization AND area minimization
   when choosing subtrees for insertion.

3. **Better splits:** Uses the split algorithm that minimizes both overlap and
   dead space.

**R*-Tree is the default in PostGIS** (via GIST index).

### R-Tree in Practice

```sql
-- PostGIS uses R-Tree (GiST index) internally
CREATE INDEX idx_buildings_geom ON buildings USING GIST(geom);

-- This query uses the R-Tree index:
SELECT * FROM buildings
WHERE ST_Intersects(geom, ST_MakeEnvelope(-122.42, 37.77, -122.41, 37.78, 4326));

-- SpatiaLite (SQLite) also uses R-Tree:
-- CREATE VIRTUAL TABLE idx_buildings_geom USING rtree(...)
```

---

## Part 4: Comparison Table

### Geohash vs Quadtree vs S2 vs H3 vs R-Tree

| Criterion          | Geohash        | Quadtree        | S2 Geometry     | Uber H3         | R-Tree          |
|:-------------------|:---------------|:----------------|:----------------|:----------------|:----------------|
| **Type**           | Hash/String    | In-memory tree  | Sphere cells    | Hex grid        | Balanced tree   |
| **Cell shape**     | Rectangle      | Rectangle       | ~Square on cube | Hexagon         | Rectangle (MBR) |
| **Hierarchy**      | Prefix-based   | Tree depth      | 30 levels       | 16 resolutions  | Tree depth      |
| **Cell ID**        | String         | Node pointer    | 64-bit int      | 64-bit int      | Node pointer    |
| **Projection**     | Lat/lon flat   | Cartesian       | Cube/sphere     | Icosahedron     | N/A             |
| **Pole handling**  | Distorted      | Distorted       | No distortion   | No distortion   | N/A             |
| **Edge effects**   | Severe         | None            | Minimal         | Minimal         | None            |
| **Adaptivity**     | Fixed grid     | Data-adaptive   | Fixed levels    | Fixed levels    | Data-adaptive   |
| **Objects indexed**| Points only    | Points only     | Points/regions  | Points/regions  | Any geometry    |
| **DB friendly**    | Very (string)  | No (in-memory)  | Yes (int ranges)| Yes (int ranges)| Yes (GiST/etc.) |
| **Update cost**    | O(1) per point | O(depth) or rebuild | O(1) per point | O(1) per point | O(log N)       |
| **Best for**       | Simple apps    | Dynamic points  | Global-scale    | Hex analytics   | Spatial objects |
| **Used by**        | Redis, Elasticsearch | Uber (early) | Google Maps  | Uber            | PostGIS, SQLite |

### Decision Matrix for Interviews

```
"What spatial index should I use?"

Do you need to index polygons/lines (not just points)?
  YES --> R-Tree (PostGIS)
  NO  --> continue

Is your data global (not just one city)?
  YES --> Do you need hexagonal analytics?
           YES --> H3
           NO  --> S2 Geometry
  NO  --> continue

Is your data highly non-uniform (dense cities + empty areas)?
  YES --> Quadtree (adapts to density)
  NO  --> continue

Do you need the simplest possible solution?
  YES --> Geohash (works with any database)
  NO  --> S2 or H3 for better accuracy
```

### Performance Characteristics

```
Operation: "Find all entities within R km of point P"

Geohash:
  - Compute geohash of P at appropriate precision
  - Query 9 cells (current + 8 neighbors)
  - Post-filter by Haversine distance
  - DB queries: 9 range scans
  - False positives: moderate (rectangular cells)

Quadtree:
  - Traverse from root to leaf containing P
  - Expand to neighboring quadrants as needed
  - Prune branches outside radius
  - DB queries: N/A (in-memory)
  - False positives: low (precise traversal)

S2:
  - Use S2RegionCoverer for circle of radius R
  - Get ~8-20 cell ranges
  - Query database with integer range scans
  - Post-filter by exact distance
  - False positives: low (good covering)

H3:
  - Compute cell of P at appropriate resolution
  - grid_disk(cell, k) for k-ring neighbors
  - Query all cells in the disk
  - Post-filter by distance
  - False positives: low (hexagonal approximation)

R-Tree:
  - Create bounding box around search circle
  - Traverse tree, prune non-overlapping nodes
  - Post-filter by exact distance
  - DB queries: single index scan
  - False positives: low (tight MBRs)
```

---

## Interview Quick Reference

### "Tell me about S2" (30-second version)
S2 projects the Earth onto a cube, then uses a Hilbert curve to map each face into
a sortable 64-bit integer. It has 30 levels of hierarchy (1 cm resolution at the
finest). Parent-child relationships are encoded in the integer, so containment
queries are simple range scans. Google uses it for Maps, Earth, and Bigtable row keys.

### "Tell me about H3" (30-second version)
H3 is Uber's hexagonal spatial index. Hexagons are better than squares because all
neighbors are equidistant. H3 has 16 resolution levels, and each cell is a 64-bit
integer. Uber uses it for surge pricing (each hex is a pricing zone), supply-demand
balancing, and ETA estimation. The key operation is grid_disk(cell, k) which returns
all cells within k rings.

### "When would you use an R-Tree?" (30-second version)
R-Trees are for indexing spatial objects with extent -- polygons, lines, rectangles --
not just points. Each node stores a minimum bounding rectangle that contains its
children. PostGIS uses R*-Trees (via GiST indexes) for all spatial queries. Use an
R-Tree when you need to index geographic features like buildings, roads, or delivery
zones, not just point locations.
