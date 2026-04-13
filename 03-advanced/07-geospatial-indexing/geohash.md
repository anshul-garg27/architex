# Geohash: Encoding Geography into Strings

## What Is a Geohash?

A **geohash** is a geocoding system that encodes a latitude/longitude coordinate into a
short alphanumeric string. The critical property: **nearby locations share a common prefix**.

```
San Francisco (37.7749, -122.4194) --> "9q8yyk"
Nearby point   (37.7750, -122.4190) --> "9q8yym"
                                         ^^^^^ -- shared prefix means proximity
```

Invented by Gustavo Niemeyer in 2008, geohashes are used internally by Redis (GEOADD),
Elasticsearch, DynamoDB location patterns, and dozens of proximity-search systems.

---

## How It Works: Step by Step

### Step 1 -- Interleave Longitude and Latitude Bits

The algorithm alternates between bisecting the **longitude** range and the **latitude** range.
Longitude gets the even-indexed bits (0, 2, 4, ...) and latitude gets the odd-indexed bits
(1, 3, 5, ...).

```
Bit index:   0    1    2    3    4    5    6    7   ...
Dimension:  LON  LAT  LON  LAT  LON  LAT  LON  LAT ...
```

For each dimension, we repeatedly halve the interval:

```
If the coordinate falls in the LOWER half --> bit = 0
If the coordinate falls in the UPPER half --> bit = 1
```

### Step 2 -- Binary Bisection (Longitude Example)

Encode longitude = -122.4194:

```
Iteration  Range              Midpoint   Value Side  Bit
-------------------------------------------------------
1          [-180, 180]         0.0        LEFT   0
2          [-180, 0]          -90.0       LEFT   0
3          [-180, -90]       -135.0       RIGHT  1
4          [-135, -90]       -112.5       LEFT   0
5          [-135, -112.5]   -123.75       RIGHT  1
6          [-123.75, -112.5] -118.125     LEFT   0
7          [-123.75, -118.125]-120.9375   LEFT   0
8          [-123.75, -120.9375]-122.3438  LEFT   0
9          [-123.75, -122.3438]-123.0469  RIGHT  1
10         [-123.0469, -122.3438]-122.6953 RIGHT  1
...
```

Longitude bits (first 10): `0 0 1 0 1 0 0 0 1 1 ...`

### Step 3 -- Binary Bisection (Latitude Example)

Encode latitude = 37.7749:

```
Iteration  Range              Midpoint   Value Side  Bit
-------------------------------------------------------
1          [-90, 90]           0.0        RIGHT  1
2          [0, 90]            45.0        LEFT   0
3          [0, 45]            22.5        RIGHT  1
4          [22.5, 45]         33.75       RIGHT  1
5          [33.75, 45]        39.375      LEFT   0
6          [33.75, 39.375]    36.5625     RIGHT  1
7          [36.5625, 39.375]  37.96875    LEFT   0
8          [36.5625, 37.96875]37.265625   RIGHT  1
9          [37.265625, 37.96875]37.617188 RIGHT  1
10         [37.617188, 37.96875]37.792969 LEFT   0
...
```

Latitude bits (first 10): `1 0 1 1 0 1 0 1 1 0 ...`

### Step 4 -- Interleave the Bits

Combine longitude (even positions) and latitude (odd positions):

```
Position:  0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 ...
Source:   LO LA LO LA LO LA LO LA LO LA LO LA LO LA LO LA LO LA LO LA
Bits:      0  1  0  0  1  1  0  0  1  1  0  0  0  1  0  0  1  1  1  0 ...
```

### Step 5 -- Base32 Encoding

Group the interleaved bits into 5-bit chunks and map to Base32:

```
Binary:  01001  10011  00001  00110  11100 ...
Decimal:   9     19      1      6     28
Base32:    9      q      8      y      y   ...

Geohash Base32 alphabet:
0  1  2  3  4  5  6  7  8  9  b  c  d  e  f  g
h  j  k  m  n  p  q  r  s  t  u  v  w  x  y  z
(no a, i, l, o -- to avoid confusion)
```

**Result: (37.7749, -122.4194) --> "9q8yyk"**

---

## Worked Example in Python

```python
BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"

def encode_geohash(lat: float, lon: float, precision: int = 6) -> str:
    """Encode lat/lon into a geohash string of given precision."""
    lat_range = (-90.0, 90.0)
    lon_range = (-180.0, 180.0)
    
    bits = []
    is_lon = True  # start with longitude (even bits)
    
    # Each Base32 char = 5 bits, so we need precision * 5 bits total
    while len(bits) < precision * 5:
        if is_lon:
            mid = (lon_range[0] + lon_range[1]) / 2
            if lon >= mid:
                bits.append(1)
                lon_range = (mid, lon_range[1])
            else:
                bits.append(0)
                lon_range = (lon_range[0], mid)
        else:
            mid = (lat_range[0] + lat_range[1]) / 2
            if lat >= mid:
                bits.append(1)
                lat_range = (mid, lat_range[1])
            else:
                bits.append(0)
                lat_range = (lat_range[0], mid)
        is_lon = not is_lon
    
    # Group into 5-bit chunks --> Base32
    geohash = ""
    for i in range(0, len(bits), 5):
        chunk = bits[i:i+5]
        idx = sum(b << (4 - j) for j, b in enumerate(chunk))
        geohash += BASE32[idx]
    
    return geohash

# Test
print(encode_geohash(37.7749, -122.4194, 6))  # --> "9q8yyk"
print(encode_geohash(37.7749, -122.4194, 9))  # --> "9q8yyk8yu"
```

---

## ASCII Diagram: Recursive Grid Subdivision

Each geohash character adds 5 bits of precision, subdividing the cell further.

```
LEVEL 0: Entire world (1 character = "9")
+---------------------------------------+
|                                       |
|                                       |
|                 "9"                    |
|          (Western US region)          |
|                                       |
|                                       |
+---------------------------------------+

LEVEL 1: Add second character ("9q")
+-------------------+-------------------+
|                   |                   |
|       "9r"        |       "9x"       |
|                   |                   |
+-------------------+-------------------+
|                   |                   |
|   --> "9q" <--    |       "9w"       |
|   (SF Bay area)   |                   |
+-------------------+-------------------+

LEVEL 2: Add third character ("9q8")
+--------+--------+---------+---------+
|  "9qb" | "9qc"  |  "9qf"  | "9qg"  |
+--------+--------+---------+---------+
|  "9q8" | "9q9"  |  "9qd"  | "9qe"  |
| (SF!)  |        |         |         |
+--------+--------+---------+---------+
|  "9q2" | "9q3"  |  "9q6"  | "9q7"  |
+--------+--------+---------+---------+
|  "9q0" | "9q1"  |  "9q4"  | "9q5"  |
+--------+--------+---------+---------+

LEVEL 3: Add fourth character ("9q8y")
+----+----+----+----+----+----+----+----+
|9q8p|9q8r|    |    |    |    |    |    |
+----+----+----+----+----+----+----+----+
|9q8n|9q8q|    |    |    |    |    |    |
+----+----+----+----+----+----+----+----+
|9q8w|9q8x| -->|9q8y| <--|    |    |    |
+----+----+----+----+----+----+----+----+
|9q8t|9q8v|9q8s|9q8u|    |    |    |    |
+----+----+----+----+----+----+----+----+

Each additional character subdivides the cell into 32 sub-cells.
```

---

## Precision Levels Table

| Geohash Length | Bits | Lat Error    | Lon Error    | Cell Size (approx)      |
|:--------------:|:----:|:-------------|:-------------|:------------------------|
| 1              | 5    | +/- 23 deg   | +/- 23 deg   | ~5,000 km x 5,000 km   |
| 2              | 10   | +/- 2.8 deg  | +/- 5.6 deg  | ~1,250 km x 625 km     |
| 3              | 15   | +/- 0.7 deg  | +/- 0.7 deg  | ~156 km x 156 km       |
| 4              | 20   | +/- 0.087 deg| +/- 0.18 deg | ~39 km x 19.5 km       |
| 5              | 25   | +/- 0.022 deg| +/- 0.022 deg| ~4.9 km x 4.9 km       |
| 6              | 30   | +/- 0.0027   | +/- 0.0055   | ~1.2 km x 0.6 km       |
| 7              | 35   | +/- 0.00068  | +/- 0.00068  | ~153 m x 153 m         |
| 8              | 40   | +/- 0.000085 | +/- 0.00017  | ~38 m x 19 m           |
| 9              | 45   | +/- 0.000021 | +/- 0.000021 | ~4.8 m x 4.8 m         |
| 10             | 50   | +/- 0.0000027| +/- 0.0000053| ~1.2 m x 0.6 m         |
| 11             | 55   | +/- 0.00000067| +/- 0.00000067| ~15 cm x 15 cm        |
| 12             | 60   | +/- 0.000000083| +/- 0.00000017| ~3.7 cm x 1.9 cm     |

**Interview tip:** For ride-sharing, precision 6 (~1.2 km) is common for coarse proximity.
Precision 7-8 for fine-grained matching.

---

## Proximity Search Using Geohash

### Basic Approach: Prefix Matching

All points in geohash cell "9q8y" start with that prefix. A database query:

```sql
-- Find all drivers in cell "9q8y" and its sub-cells
SELECT * FROM drivers WHERE geohash LIKE '9q8y%';

-- Or more efficiently with range scan:
SELECT * FROM drivers
WHERE geohash >= '9q8y' AND geohash < '9q8z';
```

This works because Base32 is lexicographically ordered within a cell.

### The Edge Problem (CRITICAL Interview Point)

```
+----------+----------+
|          |          |
|   "9q8x" |  "9q8y"  |
|          |  B       |
|       A  |          |
+----------+----------+

Points A and B are physically 10 meters apart,
but they have COMPLETELY DIFFERENT geohash prefixes!

A = "9q8x..." (different cell)
B = "9q8y..." (our query cell)

A prefix query for "9q8y%" would MISS point A entirely.
```

This is the **edge effect** -- the most important geohash gotcha.

### Solution: Query Current Cell + 8 Neighbors

```
+-----------+-----------+-----------+
|           |           |           |
| neighbor  | neighbor  | neighbor  |
|   NW      |    N      |   NE      |
+-----------+-----------+-----------+
|           |           |           |
| neighbor  |  CURRENT  | neighbor  |
|    W      |   CELL    |    E      |
+-----------+-----------+-----------+
|           |           |           |
| neighbor  | neighbor  | neighbor  |
|   SW      |    S      |   SE      |
+-----------+-----------+-----------+

Query ALL 9 cells (current + 8 neighbors), then filter by actual distance.
```

```python
import geohash2  # pip install geohash2

def find_nearby(lat: float, lon: float, precision: int = 6):
    """Find all points near a location using geohash + neighbors."""
    center = geohash2.encode(lat, lon, precision)
    neighbors = geohash2.neighbors(center)  # returns 8 neighbors
    
    all_cells = [center] + list(neighbors.values())
    # all_cells = ["9q8yy", "9q8yz", "9q8yw", "9q8yx", ...]
    
    candidates = []
    for cell in all_cells:
        # Range query in database for each cell prefix
        candidates.extend(db_query_prefix(cell))
    
    # Post-filter: compute actual Haversine distance
    return [c for c in candidates if haversine(lat, lon, c.lat, c.lon) <= radius]
```

### Choosing the Right Precision for Your Radius

```python
def precision_for_radius(radius_meters: float) -> int:
    """Pick geohash precision that covers at least the search radius."""
    # Each cell at precision P has a known width/height
    # Choose the largest precision where cell size >= search radius
    precisions = {
        1: 5_000_000,   # 5000 km
        2: 1_250_000,   # 1250 km
        3: 156_000,     # 156 km
        4: 39_000,      # 39 km
        5: 4_900,       # 4.9 km
        6: 1_200,       # 1.2 km
        7: 153,         # 153 m
        8: 38,          # 38 m
    }
    for p, size in sorted(precisions.items()):
        if size <= radius_meters * 2:
            return p
    return 8
```

---

## Geohash in Databases

### Redis: Built-in Geohash Support

Redis uses geohash internally for its GEO commands. The 52-bit geohash is stored
as the score of a sorted set.

```python
import redis
r = redis.Redis()

# Add driver locations
r.geoadd("drivers", -122.4194, 37.7749, "driver:1001")
r.geoadd("drivers", -122.4089, 37.7837, "driver:1002")
r.geoadd("drivers", -122.4000, 37.7900, "driver:1003")

# Find all drivers within 2 km of a rider
nearby = r.georadius(
    "drivers",
    longitude=-122.4150,
    latitude=37.7780,
    radius=2,
    unit="km",
    withcoord=True,
    withdist=True,
    sort="ASC",   # closest first
    count=10      # limit to 10 results
)
# Returns: [("driver:1001", 0.45, (-122.4194, 37.7749)), ...]

# Get the geohash of a specific member
geohash = r.geohash("drivers", "driver:1001")
# Returns: ["9q8yyk0d80"]
```

**How Redis does it under the hood:**
1. Converts lat/lon to a 52-bit geohash integer
2. Stores it as the score in a sorted set (ZSET)
3. GEORADIUS computes the geohash range for the bounding box
4. Performs ZRANGEBYSCORE for efficient range retrieval
5. Filters by exact Haversine distance

### DynamoDB: Geohash as Sort Key

```python
# DynamoDB table design for geospatial queries
# Partition key: geohash prefix (e.g., first 4 chars)
# Sort key: full geohash + entity ID

# Table: NearbyDrivers
# PK: "geo#9q8y"
# SK: "9q8yyk#driver:1001"

import boto3
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("NearbyDrivers")

def query_nearby(geohash_prefix: str):
    """Query all items in a geohash cell."""
    response = table.query(
        KeyConditionExpression=(
            Key("pk").eq(f"geo#{geohash_prefix}") &
            Key("sk").begins_with(geohash_prefix)
        )
    )
    return response["Items"]

# Query current cell + 8 neighbors
for cell in [center_cell] + neighbor_cells:
    results.extend(query_nearby(cell[:4]))
```

**DynamoDB Geospatial Pattern:**
```
+-------------------------------------------------------+
| Table: NearbyEntities                                  |
+---------------+-----------------------+--------+-------+
| PK (Partition)| SK (Sort)             | lat    | lon   |
+---------------+-----------------------+--------+-------+
| geo#9q8y      | 9q8yyk#driver:1001    | 37.774 |-122.41|
| geo#9q8y      | 9q8yym#driver:1002    | 37.775 |-122.41|
| geo#9q8y      | 9q8yyn#restaurant:50  | 37.776 |-122.42|
| geo#9q8z      | 9q8zz1#driver:1003    | 37.780 |-122.40|
+---------------+-----------------------+--------+-------+

PK = geohash prefix (precision 4) --> ~39 km cells
SK = full geohash + entity ID --> range scans within cell
```

### PostgreSQL: PostGIS vs Manual Geohash

**Option A: PostGIS (Preferred)**
```sql
-- PostGIS uses R-Tree indexes, not geohash, but is the gold standard
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    name TEXT,
    location GEOMETRY(Point, 4326)  -- SRID 4326 = WGS84
);

CREATE INDEX idx_drivers_location ON drivers USING GIST(location);

-- Find drivers within 2 km
SELECT id, name,
       ST_Distance(location::geography,
                   ST_MakePoint(-122.415, 37.778)::geography) AS dist_meters
FROM drivers
WHERE ST_DWithin(location::geography,
                 ST_MakePoint(-122.415, 37.778)::geography,
                 2000)  -- 2000 meters
ORDER BY dist_meters;
```

**Option B: Manual Geohash Column**
```sql
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    name TEXT,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    geohash VARCHAR(12)
);

CREATE INDEX idx_drivers_geohash ON drivers (geohash);

-- Prefix-based proximity search (precision 6 ~ 1.2 km)
SELECT * FROM drivers
WHERE geohash LIKE '9q8yyk%'
   OR geohash LIKE '9q8yym%'
   -- ... (include 8 neighbor prefixes)
;
```

---

## Advantages of Geohash

| Advantage                      | Why It Matters                                      |
|:-------------------------------|:----------------------------------------------------|
| **String-based**               | Works with any DB that supports string indexing      |
| **Prefix = containment**       | "9q8y" contains all "9q8y*" -- hierarchy for free    |
| **Easy to implement**          | Simple algorithm, no special libraries needed        |
| **Compact representation**     | 6-12 chars encode a precise location                 |
| **Range queries are fast**     | Sorted strings enable B-tree range scans             |
| **Adjustable precision**       | Truncate string = zoom out; append = zoom in         |
| **Cross-platform**             | Same encoding everywhere -- Redis, DynamoDB, etc.    |

---

## Disadvantages of Geohash

### 1. Edge Effects (The Boundary Problem)
Already discussed above. Two points 1 meter apart can have completely different
geohash prefixes if they fall on a cell boundary.

**Mitigation:** Always query 9 cells (current + 8 neighbors).

### 2. Non-Uniform Cell Sizes Near Poles

Geohash cells are defined in lat/lon space, but the Earth is a sphere. Near the
equator, 1 degree of longitude = ~111 km. Near the poles, 1 degree of longitude
approaches 0 km.

```
Near equator:    cell is roughly square
                 +--------+
                 |        |
                 |        |
                 +--------+

Near poles:      cell is very tall and narrow
                 +--+
                 |  |
                 |  |
                 |  |
                 |  |
                 |  |
                 +--+
```

This means "nearby" in geohash-space does not always mean "nearby" in physical
distance. For global systems (Uber operates worldwide), this matters.

### 3. Z-Order Curve Discontinuities

Geohash uses a Z-order (Morton) curve to map 2D space to 1D. This curve has
discontinuities -- sometimes incrementing the geohash string jumps to a
spatially distant cell.

```
Z-order curve traversal:
+---+---+---+---+
| 0 | 1 | 4 | 5 |     Cells 3 and 4 are adjacent in 1D
+---+---+---+---+     but far apart in 2D!
| 2 | 3 | 6 | 7 |
+---+---+---+---+     Hilbert curves (used by S2) avoid this.
| 8 | 9 | C | D |
+---+---+---+---+
| A | B | E | F |
+---+---+---+---+
```

### 4. Fixed Grid (No Adaptive Resolution)

Unlike quadtrees, every cell at a given precision is the same size. Manhattan has
10,000 drivers in one cell. Rural Wyoming has 0 in the next cell. Both cells cost
the same to query, but Manhattan needs finer resolution.

---

## Geohash vs Other Spatial Indexes (Quick Comparison)

| Criterion           | Geohash         | Quadtree       | S2 Geometry     | H3            |
|:--------------------|:----------------|:---------------|:----------------|:--------------|
| Type                | Hash / string   | Tree / memory  | Sphere-aware    | Hexagonal grid|
| Edge effects        | Yes (boundary)  | No             | Minimal         | Minimal       |
| Pole distortion     | Yes             | Yes            | No              | No            |
| Storage             | String in any DB| In-memory      | 64-bit int      | 64-bit int    |
| Dynamic resolution  | Per-query       | Per-region      | Per-cell        | Per-cell      |
| Best for            | Simple proximity| Non-uniform data| Global-scale   | Hexagonal ops |

---

## Interview Cheat Sheet

**When the interviewer asks: "How would you find nearby drivers?"**

1. Store each driver's geohash (precision 6) in a database/Redis
2. When a rider requests, compute rider's geohash at same precision
3. Find the 9 cells: current cell + 8 neighbors
4. Query all drivers in those 9 cells (range/prefix scan)
5. Post-filter by Haversine distance to get actual radius
6. Return top K closest drivers

**Time complexity:**
- Geohash computation: O(precision) -- constant
- Database range query: O(log N + M) where M = results in cell
- Post-filtering: O(M)
- Overall: dominated by database I/O, not computation

**When to choose Geohash over alternatives:**
- You need a simple, database-friendly solution
- Your data fits in a relational DB or Redis
- You do not need perfect accuracy near poles
- You want something any engineer can understand and maintain
