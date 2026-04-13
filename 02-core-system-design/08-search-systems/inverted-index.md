# Inverted Index

## What Is an Inverted Index?

An inverted index is a data structure that maps **content** (words, terms, tokens) to **locations** (documents, positions) where that content appears. It is the foundational data structure behind virtually every full-text search engine -- Elasticsearch, Solr, Lucene, Google Search, and any system that needs to answer "which documents contain this word?" in sub-second time.

The name "inverted" comes from the fact that it inverts the natural relationship: instead of mapping **document -> words it contains**, it maps **word -> documents that contain it**.

---

## Forward Index vs Inverted Index

### Forward Index

A forward index stores what you naturally have: for each document, a list of terms it contains.

```
Forward Index
=============
doc1 -> ["uber", "ride", "sharing", "app", "uber"]
doc2 -> ["ride", "hailing", "market", "growth"]
doc3 -> ["uber", "earnings", "report", "quarterly"]
doc4 -> ["taxi", "app", "market", "disruption"]
doc5 -> ["uber", "ride", "sharing", "economy", "uber"]
```

**Problem**: To find all documents containing "uber", you must scan EVERY document. For 1 billion documents, that is impossibly slow.

### Inverted Index

An inverted index flips the mapping: for each term, store which documents contain it.

```
Inverted Index
==============
Term           Posting List (doc_id, term_frequency)
─────────────  ──────────────────────────────────────
"app"       -> [(doc1, 1), (doc4, 1)]
"disruption"-> [(doc4, 1)]
"earnings"  -> [(doc3, 1)]
"economy"   -> [(doc5, 1)]
"growth"    -> [(doc2, 1)]
"hailing"   -> [(doc2, 1)]
"market"    -> [(doc2, 1), (doc4, 1)]
"quarterly" -> [(doc3, 1)]
"report"    -> [(doc3, 1)]
"ride"      -> [(doc1, 1), (doc2, 1), (doc5, 1)]
"sharing"   -> [(doc1, 1), (doc5, 1)]
"taxi"      -> [(doc4, 1)]
"uber"      -> [(doc1, 2), (doc3, 1), (doc5, 2)]
```

**Lookup**: To find documents containing "uber", do a single dictionary lookup -- O(1) for the hash, then scan the posting list. For "uber" you immediately get [doc1, doc3, doc5].

### Comparison Table

| Aspect            | Forward Index               | Inverted Index              |
|-------------------|-----------------------------|-----------------------------|
| Structure         | doc_id -> [terms]           | term -> [doc_ids]           |
| Search speed      | O(N) -- scan all docs       | O(1) lookup + posting scan  |
| Index build time  | Fast (natural order)        | Slower (must invert)        |
| Use case          | Retrieval by doc_id         | Full-text search            |
| Storage           | Compact per document        | Duplicates doc_ids          |
| Update cost       | Cheap (append to one doc)   | Moderate (update many lists)|

**Key insight**: Search systems maintain BOTH. The forward index is used to retrieve the document once you know its ID. The inverted index is used to find which documents match a query.

---

## How an Inverted Index Is Built

### The Indexing Pipeline

```
                    Indexing Pipeline
                    =================

  Raw Document
       |
       v
  +-----------+     +-----------+     +-----------+
  | Tokenize  | --> | Normalize | --> |  Build    |
  | (split    |     | (lower,   |     |  Posting  |
  |  into     |     |  stem,    |     |  Lists    |
  |  tokens)  |     |  remove   |     |           |
  +-----------+     |  stops)   |     +-----------+
                    +-----------+           |
                                           v
                                    Inverted Index
                                    on Disk / Memory
```

### Step 1: Document Ingestion

Each document arrives with an ID and raw text:

```
doc1: "Uber's ride-sharing app disrupted the Taxi market in 2015!"
```

### Step 2: Tokenization

Split the raw text into individual tokens (words). Different tokenizers handle this differently:

```python
# Simple whitespace tokenization
text = "Uber's ride-sharing app disrupted the Taxi market in 2015!"
tokens = text.split()
# Result: ["Uber's", "ride-sharing", "app", "disrupted", "the", "Taxi", "market", "in", "2015!"]

# Better: regex-based tokenization
import re
tokens = re.findall(r'\b\w+\b', text)
# Result: ["Uber", "s", "ride", "sharing", "app", "disrupted", "the", "Taxi", "market", "in", "2015"]
```

Tokenization decisions matter enormously:
- Should "ride-sharing" be one token or two?
- Should "2015" be indexed as a number or text?
- Should "Uber's" keep the possessive?

### Step 3: Text Normalization Pipeline

```
Token Stream: ["Uber", "s", "ride", "sharing", "app", "disrupted", "the", "Taxi", "market", "in", "2015"]
      |
      v
  Lowercase:  ["uber", "s", "ride", "sharing", "app", "disrupted", "the", "taxi", "market", "in", "2015"]
      |
      v
  Remove Punctuation: (already clean after tokenization)
      |
      v
  Stop Word Removal: ["uber", "ride", "sharing", "app", "disrupted", "taxi", "market", "2015"]
      |                (removed: "s", "the", "in")
      v
  Stemming:   ["uber", "ride", "share", "app", "disrupt", "taxi", "market", "2015"]
      |        ("sharing" -> "share", "disrupted" -> "disrupt")
      v
  Final Tokens (ready for indexing)
```

### Step 4: Build the Posting Lists

For each normalized token, append the (doc_id, position) to the corresponding posting list:

```
Processing doc1 tokens: ["uber", "ride", "share", "app", "disrupt", "taxi", "market", "2015"]

"uber"    -> append (doc1, pos=0)
"ride"    -> append (doc1, pos=1)
"share"   -> append (doc1, pos=2)
"app"     -> append (doc1, pos=3)
"disrupt" -> append (doc1, pos=4)
"taxi"    -> append (doc1, pos=5)
"market"  -> append (doc1, pos=6)
"2015"    -> append (doc1, pos=7)
```

After processing all documents, you have the complete inverted index.

---

## Detailed Inverted Index Structure

```
Inverted Index with Positional Information
==========================================

Dictionary (sorted terms)           Posting Lists
┌──────────────┐
│ Term         │
├──────────────┤
│ "app"        │───> ┌─────────────────────┬─────────────────────┐
│              │     │ doc1, tf=1, [pos:3] │ doc4, tf=1, [pos:0] │
├──────────────┤     └─────────────────────┴─────────────────────┘
│ "disrupt"    │───> ┌──────────────────────┬─────────────────────┐
│              │     │ doc1, tf=1, [pos:4]  │ doc4, tf=1, [pos:3] │
├──────────────┤     └──────────────────────┴─────────────────────┘
│ "market"     │───> ┌─────────────────────┬─────────────────────┐
│              │     │ doc2, tf=1, [pos:2] │ doc4, tf=1, [pos:2] │
├──────────────┤     └─────────────────────┴─────────────────────┘
│ "ride"       │───> ┌──────────────────────┬──────────────────────┬──────────────────────┐
│              │     │ doc1, tf=1, [pos:1]  │ doc2, tf=1, [pos:0]  │ doc5, tf=1, [pos:1]  │
├──────────────┤     └──────────────────────┴──────────────────────┴──────────────────────┘
│ "share"      │───> ┌─────────────────────┬─────────────────────┐
│              │     │ doc1, tf=1, [pos:2] │ doc5, tf=1, [pos:2] │
├──────────────┤     └─────────────────────┴─────────────────────┘
│ "taxi"       │───> ┌─────────────────────┐
│              │     │ doc4, tf=1, [pos:5] │
├──────────────┤     └─────────────────────┘
│ "uber"       │───> ┌──────────────────────────┬─────────────────────┬──────────────────────────┐
│              │     │ doc1, tf=2, [pos:0,8]    │ doc3, tf=1, [pos:0] │ doc5, tf=2, [pos:0,7]    │
└──────────────┘     └──────────────────────────┴─────────────────────┴──────────────────────────┘

Each posting entry:
┌────────────────────────────────────────────────────┐
│ doc_id │ term_frequency │ [position1, position2...] │
└────────────────────────────────────────────────────┘
```

---

## Stemming vs Lemmatization

Both reduce words to a base form, but they work differently:

### Stemming (Fast, Crude)

Chops off suffixes using heuristic rules. The most common algorithm is **Porter Stemmer**.

```
Stemming Examples (Porter):
  "running"     -> "run"
  "runs"        -> "run"
  "runner"      -> "runner"     (imperfect!)
  "connected"   -> "connect"
  "connection"  -> "connect"
  "connecting"  -> "connect"
  "university"  -> "univers"    (not a real word!)
  "universe"    -> "univers"    (matches above -- good for search)
```

**Pros**: Fast (pure string manipulation), no dictionary needed.
**Cons**: Produces non-words, can be too aggressive or too conservative.

### Lemmatization (Slow, Accurate)

Uses vocabulary and morphological analysis to return the dictionary form (lemma).

```
Lemmatization Examples:
  "running"     -> "run"
  "runs"        -> "run"
  "runner"      -> "runner"     (correct! different word)
  "better"      -> "good"       (understands irregulars)
  "am", "are"   -> "be"
  "mice"        -> "mouse"
```

**Pros**: Linguistically correct, produces real words.
**Cons**: Slower (needs dictionary lookup), language-specific.

### Which to Use?

| Context              | Choice          | Why                                    |
|----------------------|-----------------|----------------------------------------|
| Search engine        | Stemming        | Speed matters, recall > precision       |
| NLP / chatbot        | Lemmatization   | Accuracy matters                        |
| Elasticsearch        | Stemming        | Uses Snowball stemmer by default        |
| Academic search      | Both            | Stem for recall, lemmatize for display  |

---

## Positional Index

A positional index stores the exact position of each term occurrence within a document. This enables **phrase queries** and **proximity queries**.

### Why Positions Matter

Without positions, you can only answer "does this document contain words X and Y?" but NOT "does this document contain the exact phrase 'X Y'?"

```
Positional Index Example
========================

Query: "ride sharing"

Term      Posting List with Positions
"ride"  -> [(doc1, [1]), (doc2, [0]), (doc5, [1])]
"share" -> [(doc1, [2]), (doc5, [2])]

Step 1: Find docs containing BOTH terms
  Intersection: doc1, doc5

Step 2: Check positions -- "share" must appear at position = "ride" position + 1
  doc1: ride at [1], share at [2] -> 2 = 1+1  YES -- phrase match
  doc5: ride at [1], share at [2] -> 2 = 1+1  YES -- phrase match

Result: [doc1, doc5]
```

### Proximity Queries

Positional indices also enable "near" queries:

```
Query: "uber" NEAR/5 "market"  (within 5 words of each other)

"uber"   -> [(doc1, [0,8]), (doc3, [0]), (doc5, [0,7])]
"market" -> [(doc2, [2]), (doc4, [2])]

Check each shared doc... no docs contain both terms!
Result: [] (empty)
```

### Storage Cost

Positional indices are 2-4x larger than non-positional indices because you store every position. This is the standard trade-off: more storage for richer query capabilities.

---

## Boolean Queries

Boolean retrieval is the simplest query model. Each document either matches or does not -- no ranking.

### AND (Intersection)

```
Query: "uber" AND "ride"

"uber" -> [doc1, doc3, doc5]
"ride" -> [doc1, doc2, doc5]

Intersection Algorithm (merge two sorted lists):

  p1 -> doc1  doc3  doc5       (uber)
  p2 -> doc1  doc2  doc5       (ride)

  Compare doc1 = doc1 -> MATCH, advance both
  Compare doc3 > doc2 -> advance p2
  Compare doc3 < doc5 -> advance p1
  Compare doc5 = doc5 -> MATCH, advance both
  Both exhausted -> done

Result: [doc1, doc5]
Time: O(n + m) where n, m are posting list lengths
```

### OR (Union)

```
Query: "uber" OR "taxi"

"uber" -> [doc1, doc3, doc5]
"taxi" -> [doc4]

Union: [doc1, doc3, doc4, doc5]
```

### NOT (Difference)

```
Query: "uber" AND NOT "ride"

"uber" -> [doc1, doc3, doc5]
"ride" -> [doc1, doc2, doc5]

Result: docs in "uber" but NOT in "ride" = [doc3]
```

### Optimization: Process Smallest List First

For AND queries, always start with the shortest posting list to minimize comparisons:

```
Query: "the" AND "uber" AND "quarterly"

Posting list sizes:
  "the"       -> 950,000 docs
  "uber"      -> 50,000 docs
  "quarterly" -> 2,000 docs

Optimal order: "quarterly" AND "uber" AND "the"
  Step 1: intersect 2,000 with 50,000 -> ~500 results
  Step 2: intersect 500 with 950,000  -> ~400 results

Bad order: "the" AND "uber" AND "quarterly"
  Step 1: intersect 950,000 with 50,000 -> ~45,000 results
  Step 2: intersect 45,000 with 2,000   -> ~400 results (same result, more work)
```

---

## Skip Lists for Efficient Intersection

When posting lists are very long, linear merging is slow. Skip lists add express lanes to jump ahead.

### Skip List Structure

```
Standard Posting List (linear scan):

  doc1 -> doc3 -> doc7 -> doc12 -> doc15 -> doc21 -> doc28 -> doc35 -> doc40 -> doc55

With Skip Pointers (every sqrt(n) elements):

  Level 1 (skip):  doc1 ─────────────> doc12 ─────────────> doc28 ─────────────> doc55
                     |                   |                    |                    |
  Level 0 (full):  doc1 -> doc3 -> doc7 -> doc12 -> doc15 -> doc21 -> doc28 -> doc35 -> doc40 -> doc55
```

### How Skip Lists Speed Up Intersection

```
Intersecting List A (with skips) and List B:

List A (skip): doc1 ──────> doc15 ──────> doc40
               |             |              |
List A (full): doc1 doc3 doc7 doc12 doc15 doc21 doc28 doc35 doc40 doc55

List B:        doc3 doc12 doc40 doc78

Step 1: A=doc1, B=doc3. A < B. Skip in A: next skip is doc15. 
        doc15 > doc3, so don't skip. Walk: doc1->doc3.
Step 2: A=doc3, B=doc3. MATCH!
Step 3: A=doc7, B=doc12. A < B. Skip in A: next skip is doc15.
        doc15 > doc12, so don't skip. Walk: doc7->doc12.
Step 4: A=doc12, B=doc12. MATCH!
Step 5: A=doc15, B=doc40. A < B. Skip in A: next skip is doc40.
        doc40 <= doc40, so SKIP to doc40.
Step 6: A=doc40, B=doc40. MATCH!

Result: [doc3, doc12, doc40]
Skipped: doc21, doc28, doc35 (saved 3 comparisons)
```

### Skip Pointer Placement

- **Rule of thumb**: Place skip pointers every sqrt(n) elements for posting list of length n
- Too many skips: waste space, rarely used
- Too few skips: don't save enough comparisons
- Lucene/Elasticsearch: use multi-level skip lists with configurable intervals

---

## Implementation: Simple Inverted Index in Python

```python
from collections import defaultdict
import re

class InvertedIndex:
    def __init__(self):
        self.index = defaultdict(list)          # term -> [(doc_id, [positions])]
        self.doc_store = {}                      # doc_id -> original text
        self.doc_count = 0

    def _tokenize(self, text):
        """Lowercase and split into alphanumeric tokens."""
        return re.findall(r'\b\w+\b', text.lower())

    def _stem(self, token):
        """Minimal suffix stripping (production: use NLTK or Snowball)."""
        for suffix in ['ing', 'ed', 'ly', 's']:
            if token.endswith(suffix) and len(token) - len(suffix) > 2:
                return token[:-len(suffix)]
        return token

    def add_document(self, doc_id, text):
        """Index a document."""
        self.doc_store[doc_id] = text
        self.doc_count += 1
        tokens = self._tokenize(text)
        # Track positions for each term in this document
        term_positions = defaultdict(list)
        for pos, token in enumerate(tokens):
            stemmed = self._stem(token)
            term_positions[stemmed].append(pos)
        # Append to global inverted index
        for term, positions in term_positions.items():
            self.index[term].append((doc_id, positions))

    def search_boolean_and(self, query):
        """AND query: return docs containing ALL query terms."""
        terms = [self._stem(t) for t in self._tokenize(query)]
        if not terms:
            return []
        # Get posting lists, sort by length (shortest first)
        postings = []
        for term in terms:
            doc_ids = {doc_id for doc_id, _ in self.index.get(term, [])}
            postings.append(doc_ids)
        postings.sort(key=len)
        # Intersect
        result = postings[0]
        for p in postings[1:]:
            result = result & p
        return sorted(result)

    def search_phrase(self, phrase):
        """Phrase query: return docs with exact phrase."""
        terms = [self._stem(t) for t in self._tokenize(phrase)]
        if not terms:
            return []
        # Get positional postings for each term
        term_postings = []
        for term in terms:
            posting_dict = {}
            for doc_id, positions in self.index.get(term, []):
                posting_dict[doc_id] = positions
            term_postings.append(posting_dict)
        # Find docs containing all terms
        common_docs = set(term_postings[0].keys())
        for tp in term_postings[1:]:
            common_docs &= set(tp.keys())
        # Check positional adjacency
        results = []
        for doc_id in common_docs:
            base_positions = term_postings[0][doc_id]
            for start_pos in base_positions:
                match = True
                for i in range(1, len(terms)):
                    if (start_pos + i) not in term_postings[i].get(doc_id, []):
                        match = False
                        break
                if match:
                    results.append(doc_id)
                    break
        return sorted(results)


# Usage
idx = InvertedIndex()
idx.add_document("doc1", "Uber ride sharing app is growing fast")
idx.add_document("doc2", "Ride hailing market sees rapid growth")
idx.add_document("doc3", "Uber earnings report shows strong growth")
idx.add_document("doc4", "Taxi app market faces disruption")
idx.add_document("doc5", "Uber ride sharing economy is booming")

print(idx.search_boolean_and("uber ride"))    # ['doc1', 'doc5']
print(idx.search_phrase("ride sharing"))       # ['doc1', 'doc5']
```

---

## Storage Formats and Compression

### Posting List Compression

Posting lists are stored as sorted doc IDs. Instead of storing raw IDs, store **gaps** (delta encoding):

```
Raw posting list:     [3, 15, 22, 87, 103, 155, 412]
Gap-encoded:          [3, 12,  7, 65,  16,  52, 257]
                       ^   ^   ^   ^    ^    ^    ^
                       3  15-3 22-15 ...

Benefit: gaps are smaller numbers -> compress better with variable-byte encoding
```

### Variable-Byte Encoding (VByte)

Encode integers using fewer bytes for smaller numbers:

```
Number    Binary             VByte Encoding
5         00000101           [10000101]                  (1 byte, high bit = end)
130       10000010           [00000001, 10000010]        (2 bytes)
10000     10011100010000     [00000100, 11110000]        (2 bytes)
```

### Compression Ratios

| Encoding        | Avg bits per gap | Compression vs raw 32-bit |
|-----------------|-----------------|---------------------------|
| Uncompressed    | 32              | 1x (baseline)             |
| VByte           | 8-16            | 2-4x                      |
| PForDelta       | 4-8             | 4-8x                      |
| Roaring Bitmaps | 2-6             | 5-16x                     |

---

## Real-World Inverted Index Implementations

### Apache Lucene (Foundation of Elasticsearch, Solr)

- Dictionary stored as an **FST** (Finite State Transducer) -- compressed trie-like structure
- Posting lists use **block-based compression** (PForDelta)
- Segments are immutable; new docs go to new segments; segments are periodically merged
- Skip lists with 16-element blocks for fast intersection

### Google

- Distributed inverted index across thousands of machines
- Sharded by document (each shard has a complete inverted index for its documents)
- Also sharded by term for very popular terms
- Custom compression optimized for their hardware

### Key Takeaway for Interviews

When asked "how would you build a search system?", the inverted index is always the starting point. Key points to mention:
1. Build inverted index from documents through a tokenization and normalization pipeline
2. Use positional indexing for phrase queries
3. Boolean intersection for multi-term queries (start with shortest posting list)
4. Compress posting lists with gap encoding + variable-byte encoding
5. Skip lists or block-based structures for fast intersection of long posting lists
6. Immutable segments with periodic merging (Lucene model) for concurrent reads and writes
