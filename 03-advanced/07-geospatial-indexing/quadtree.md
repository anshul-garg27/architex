# Quadtree: Adaptive Spatial Subdivision

## What Is a Quadtree?

A **quadtree** is a tree data structure where each internal node has exactly four children,
representing the four quadrants of a 2D space (NW, NE, SW, SE). The space is recursively
subdivided until each leaf node contains at most **K** points (the bucket capacity).

```
Key insight: unlike geohash's fixed grid, a quadtree ADAPTS to data density.
Manhattan (dense) gets many small cells. Kansas (sparse) stays as one large cell.
```

This makes quadtrees ideal for ride-sharing, where driver density varies enormously
across a city.

---

## How It Works

### Building a Quadtree

1. Start with a bounding box covering the entire region of interest
2. All points go into the root node
3. If a node exceeds capacity K, split it into 4 equal quadrants
4. Redistribute points to the appropriate child quadrant
5. Repeat recursively until every leaf has <= K points

### ASCII Diagram: Quadtree with 3 Levels

**The space with 9 points (drivers):**
```
+-------------------------------+
|               |               |
|   A           |          B    |
|       C       |               |
|               |               |
|               |   D           |
+---------------+---------------+
|               |               |
|               |   E  F        |
|               |         G     |
|   H           |   I           |
|               |               |
+---------------+---------------+
```

**After quadtree subdivision (K=2, max 2 points per leaf):**
```
+-------------------------------+
|       |       |               |
|   A   |       |          B    |
+---+---+  C    |               |
|   |   |       |               |
|   |   |       |   D           |
+-------+-------+-------+-------+
|               |   E  F|       |
|               +---+---+  G    |
|               |   |   |       |
|   H           | I |   |       |
|               |   |   |       |
+---------------+---+---+-------+

NW quadrant: had 3 points (A, C, and empty), split further
SE quadrant: had 4 points (E, F, G, I), split further
NE quadrant: only 2 points (B, D), stays as leaf
SW quadrant: only 1 point (H), stays as leaf
```

**The corresponding tree structure:**
```
                        ROOT
                   [A,B,C,D,E,F,G,H,I]
                  /      |      |      \
                NW       NE     SW      SE
             [A,C,?]   [B,D]   [H]   [E,F,G,I]
            / | | \                   / | | \
          NW NE SW SE               NW NE SW SE
         [A][ ][C][ ]            [E,F][ ][ ][G,I]
                                   ^           ^
                              (capacity 2)  (could split
                               so leaf OK)   if needed)
```

---

## Point Quadtree vs Region Quadtree

### Region Quadtree (Used for Proximity Search)

- Divides space into **equal quadrants** regardless of where points are
- Each split creates 4 children of equal area
- This is what Uber and most proximity systems use
- Also called a **PR Quadtree** (Point-Region)

```
Region Quadtree split:
+---+---+       Always divides at the midpoint
|NW |NE |       of the bounding box.
+---+---+
|SW |SE |       Equal-area children.
+---+---+
```

### Point Quadtree

- Each point in the dataset becomes an internal node
- The point's coordinates define the split lines (like a 2D BST)
- Rarely used for dynamic proximity search

```
Point Quadtree split at point P(5,6):
           x=5
      +-----+-----+
      |     |     |
 y=6 -+  NW | NE  +
      |     |     |
      +-----P-----+
      |     |     |
      |  SW | SE  |
      |     |     |
      +-----+-----+

Split lines go through the point itself.
Different points create different tree shapes.
```

**For Uber interviews: always discuss Region Quadtree.**

---

## Operations

### Insert

```
insert(point):
    node = root
    while node is not a leaf:
        quadrant = determine_quadrant(node, point)
        node = node.children[quadrant]
    
    node.points.append(point)
    if len(node.points) > K:
        split(node)   # create 4 children, redistribute points
```

**Time complexity:** O(depth) = O(log(N/K)) for uniform data, O(N) worst case.

### Search: Range Query (Find All Points in Rectangle)

```
range_query(node, search_rect):
    if node is None:
        return []
    if not intersects(node.boundary, search_rect):
        return []       # PRUNE -- this entire branch is irrelevant
    
    results = []
    if node is leaf:
        for point in node.points:
            if contains(search_rect, point):
                results.append(point)
    else:
        for child in node.children:
            results.extend(range_query(child, search_rect))
    return results
```

### Search: K-Nearest Neighbors

This is the classic **"find nearest K drivers"** query:

```
knn(node, target, k):
    # Use a max-heap of size k to track best candidates
    heap = MaxHeap(capacity=k)
    
    def search(node):
        if node is None:
            return
        
        # Pruning: if this node's closest possible point is farther
        # than our current k-th best, skip it
        if heap.size == k and min_distance(node.boundary, target) > heap.peek():
            return
        
        if node is leaf:
            for point in node.points:
                d = distance(target, point)
                if heap.size < k or d < heap.peek():
                    heap.push(d, point)
        else:
            # Visit children in order of distance to target
            children_by_dist = sorted(node.children,
                key=lambda c: min_distance(c.boundary, target))
            for child in children_by_dist:
                search(child)
    
    search(root)
    return heap.items()
```

**Pruning is the key optimization.** Without pruning, you search the entire tree.
With pruning, you skip branches that cannot possibly contain a closer point.

---

## In-Memory Implementation in Python

```python
from dataclasses import dataclass, field
from typing import List, Optional, Tuple
import math

@dataclass
class Point:
    x: float       # longitude
    y: float       # latitude
    data: dict     # e.g., {"driver_id": "1001", "status": "available"}

@dataclass
class BoundingBox:
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    
    def contains(self, point: Point) -> bool:
        return (self.x_min <= point.x <= self.x_max and
                self.y_min <= point.y <= self.y_max)
    
    def intersects(self, other: 'BoundingBox') -> bool:
        return not (other.x_min > self.x_max or
                    other.x_max < self.x_min or
                    other.y_min > self.y_max or
                    other.y_max < self.y_min)
    
    def quadrants(self) -> Tuple['BoundingBox', ...]:
        mx = (self.x_min + self.x_max) / 2
        my = (self.y_min + self.y_max) / 2
        return (
            BoundingBox(self.x_min, my, mx, self.y_max),       # NW
            BoundingBox(mx, my, self.x_max, self.y_max),       # NE
            BoundingBox(self.x_min, self.y_min, mx, my),       # SW
            BoundingBox(mx, self.y_min, self.x_max, my),       # SE
        )
    
    def min_distance_to(self, point: Point) -> float:
        """Minimum possible distance from any point in box to target."""
        dx = max(self.x_min - point.x, 0, point.x - self.x_max)
        dy = max(self.y_min - point.y, 0, point.y - self.y_max)
        return math.sqrt(dx * dx + dy * dy)


class QuadTreeNode:
    MAX_CAPACITY = 4   # bucket size K
    MAX_DEPTH = 20
    
    def __init__(self, boundary: BoundingBox, depth: int = 0):
        self.boundary = boundary
        self.depth = depth
        self.points: List[Point] = []
        self.children: Optional[List['QuadTreeNode']] = None  # None = leaf
    
    @property
    def is_leaf(self) -> bool:
        return self.children is None
    
    def insert(self, point: Point) -> bool:
        if not self.boundary.contains(point):
            return False
        
        if self.is_leaf:
            self.points.append(point)
            if (len(self.points) > self.MAX_CAPACITY and
                    self.depth < self.MAX_DEPTH):
                self._split()
            return True
        
        for child in self.children:
            if child.insert(point):
                return True
        return False
    
    def _split(self):
        quads = self.boundary.quadrants()
        self.children = [
            QuadTreeNode(q, self.depth + 1) for q in quads
        ]
        # Redistribute existing points
        for point in self.points:
            for child in self.children:
                if child.insert(point):
                    break
        self.points = []  # internal nodes hold no points
    
    def query_range(self, search_box: BoundingBox) -> List[Point]:
        """Find all points within a bounding box."""
        results = []
        if not self.boundary.intersects(search_box):
            return results
        
        if self.is_leaf:
            results.extend(p for p in self.points
                           if search_box.contains(p))
        else:
            for child in self.children:
                results.extend(child.query_range(search_box))
        return results
    
    def query_radius(self, center: Point, radius: float) -> List[Point]:
        """Find all points within radius of center."""
        # Use bounding box for coarse filter, then exact distance
        search_box = BoundingBox(
            center.x - radius, center.y - radius,
            center.x + radius, center.y + radius
        )
        candidates = self.query_range(search_box)
        return [p for p in candidates
                if math.dist((center.x, center.y), (p.x, p.y)) <= radius]
    
    def delete(self, point: Point) -> bool:
        """Remove a point from the quadtree."""
        if not self.boundary.contains(point):
            return False
        
        if self.is_leaf:
            for i, p in enumerate(self.points):
                if p.x == point.x and p.y == point.y:
                    self.points.pop(i)
                    return True
            return False
        
        for child in self.children:
            if child.delete(point):
                # Check if we can collapse (merge children back)
                total = sum(
                    len(c.points) for c in self.children if c.is_leaf
                )
                all_leaves = all(c.is_leaf for c in self.children)
                if all_leaves and total <= self.MAX_CAPACITY:
                    self.points = []
                    for c in self.children:
                        self.points.extend(c.points)
                    self.children = None  # collapse back to leaf
                return True
        return False


# --- Usage Example ---
world = BoundingBox(-180, -90, 180, 90)
tree = QuadTreeNode(world)

# Insert drivers
tree.insert(Point(-122.4194, 37.7749, {"id": "driver:1001"}))
tree.insert(Point(-122.4089, 37.7837, {"id": "driver:1002"}))
tree.insert(Point(-122.4000, 37.7900, {"id": "driver:1003"}))

# Find drivers near a rider
nearby = tree.query_radius(
    center=Point(-122.4150, 37.7780, {}),
    radius=0.02  # ~2 km in degrees (approximate)
)
print([p.data["id"] for p in nearby])
```

---

## Dynamic Updates: Moving Drivers

This is the critical challenge for ride-sharing: **drivers move constantly**.

### Approach 1: Delete + Re-Insert

```python
def update_driver_location(tree, driver_id, old_point, new_point):
    """Move a driver by removing old position and inserting new one."""
    tree.delete(old_point)
    tree.insert(new_point)
```

**Problem:** Every location update is O(depth) delete + O(depth) insert. With
millions of drivers sending updates every 3-5 seconds, this is expensive.

### Approach 2: Lazy Updates with Periodic Rebuild

```python
class DriverQuadTree:
    def __init__(self):
        self.tree = QuadTreeNode(BoundingBox(-180, -90, 180, 90))
        self.driver_locations = {}  # driver_id -> Point (source of truth)
    
    def update_location(self, driver_id: str, lat: float, lon: float):
        """Update driver's location. Only modifies the hash map."""
        self.driver_locations[driver_id] = Point(lon, lat, {"id": driver_id})
    
    def rebuild(self):
        """Periodically rebuild the entire tree from scratch."""
        self.tree = QuadTreeNode(BoundingBox(-180, -90, 180, 90))
        for point in self.driver_locations.values():
            self.tree.insert(point)
    
    def query_nearby(self, lat: float, lon: float, radius: float):
        """Query the tree (may be slightly stale)."""
        return self.tree.query_radius(Point(lon, lat, {}), radius)
```

**Rebuild frequency:** Every 10-15 seconds is common. This is what Uber's
earlier systems approximated.

### Approach 3: Sharded Quadtrees by City

```
+-----------------------------------------------+
|              Global Dispatcher                 |
+-------+---------+---------+---------+---------+
        |         |         |         |
    +---+---+ +---+---+ +---+---+ +---+---+
    | SF    | | NYC   | | London| | Tokyo |
    | Tree  | | Tree  | | Tree  | | Tree  |
    +-------+ +-------+ +-------+ +-------+
    
Each city has its own quadtree in memory.
Driver updates only affect the local city tree.
Cross-city moves trigger a migration.
```

---

## Complexity Analysis

| Operation            | Average Case      | Worst Case (skewed) |
|:---------------------|:------------------|:--------------------|
| Insert               | O(log(N/K))       | O(N)                |
| Delete               | O(log(N/K))       | O(N)                |
| Range query          | O(log(N/K) + M)   | O(N)                |
| K-nearest neighbors  | O(log(N/K) + K)   | O(N)                |
| Build tree (N pts)   | O(N log(N/K))     | O(N^2)              |
| Space                | O(N)              | O(N)                |

Where N = total points, K = bucket capacity, M = results returned.

**Worst case** happens when all points cluster in the same region, creating a
very deep, unbalanced tree. In practice, geographic data is well-distributed
enough that average-case dominates.

---

## Advantages of Quadtrees

| Advantage                          | Why It Matters for Uber                        |
|:-----------------------------------|:-----------------------------------------------|
| **Adapts to data density**         | Dense downtown areas get fine cells; suburbs stay coarse |
| **Efficient spatial queries**      | Pruning eliminates irrelevant regions quickly    |
| **Supports K-nearest neighbors**   | Exactly what "find closest drivers" needs        |
| **Variable resolution**            | Different areas can have different granularity   |
| **Simple to implement**            | Can build from scratch in an interview           |
| **Range queries are natural**      | "Find all drivers in this rectangle" is trivial  |

---

## Disadvantages of Quadtrees

| Disadvantage                       | Impact                                          |
|:-----------------------------------|:------------------------------------------------|
| **In-memory only**                 | Cannot efficiently persist to disk / database    |
| **Unbalanced for skewed data**     | All NYC drivers in one branch, empty elsewhere   |
| **No built-in DB support**         | Must implement as an application-level index     |
| **Rebuild cost**                   | Full rebuild is O(N log N), needed for moving objects |
| **Not thread-safe by default**     | Need locking or lock-free structures for concurrent access |
| **Sphere distortion**              | Works in Cartesian coordinates, not spherical    |

---

## Real-World Usage

### Uber (Early Architecture)
Uber's original dispatch system used an in-memory quadtree (one per city) to index
active drivers. Every few seconds, the tree was rebuilt from the latest driver
location updates. Queries for "nearest available drivers" used KNN on the quadtree.

Later, Uber migrated to H3 (hexagonal indexing) for most use cases, but quadtree
concepts remain fundamental to how spatial proximity works.

### Game Engines (Collision Detection)
Game engines use quadtrees (2D) and octrees (3D) to partition space and quickly
determine which objects might collide. Only objects in the same or adjacent
quadrants need collision checks.

```
Game World Quadtree:
+-------+-------+-------+-------+
|       |  @    |       |       |
|       | player|       |       |
+---+---+---+---+       |       |
| # |   |   | * |       |       |
|wall|   |   |gem|       |       |
+---+---+---+---+-------+-------+
|       |       |       |       |
|       |       |  !    |       |
|       |       | enemy |       |
+-------+-------+-------+-------+

Only check collision between objects in the same / adjacent cells.
Player (@) does NOT need to check against enemy (!) -- different quadrant.
```

### Geographic Information Systems (GIS)
QGIS and other GIS tools use quadtrees to index spatial features for fast
rendering and querying at different zoom levels.

---

## Interview Template: Quadtree for Nearest Drivers

When the interviewer asks "How would you find the nearest drivers using a quadtree?":

**Step 1: Build the tree**
- Bounding box = city limits (or a generous buffer)
- Insert all active drivers (lat/lon + driver metadata)
- Bucket capacity K = 10-50 (tune based on density)
- Max depth = 20 (prevents infinite subdivision)

**Step 2: Query for nearest K**
- Rider sends (lat, lon)
- Run KNN search starting from root
- Traverse to the leaf containing the rider's location
- Expand search to neighboring quadrants
- Use distance-based pruning to skip irrelevant branches
- Return K closest drivers sorted by distance

**Step 3: Handle updates**
- Drivers send location updates every 3-5 seconds
- Option A: delete + re-insert (simple, works at moderate scale)
- Option B: periodic rebuild (better for high update rates)
- Option C: sharded per city, rebuild each city independently

**Step 4: Scale discussion**
- One quadtree per city, each on a dedicated server
- Rider request is routed to the correct city's server
- Tree fits in memory: 1M drivers x ~100 bytes = ~100 MB
- Rebuild takes milliseconds for a city-sized tree
- For global scale, consider H3 or S2 instead
