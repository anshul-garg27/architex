# Ranking and Relevance

## Why Ranking Matters

Boolean retrieval tells you which documents match. But when a query returns 10 million matches, you need to decide which 10 to show first. Ranking is the art and science of **ordering documents by relevance** to the user's query. Get it wrong, and users leave. Get it right, and you have Google.

---

## TF-IDF: Term Frequency x Inverse Document Frequency

### Intuition

Two key observations:
1. **A word that appears many times in a document is probably important to that document** (term frequency)
2. **A word that appears in almost every document is not useful for distinguishing documents** (inverse document frequency)

"The" appears everywhere -- low IDF, low value. "Kubernetes" appears rarely -- high IDF, very distinguishing.

### Formula

```
TF-IDF(t, d, D) = TF(t, d) x IDF(t, D)

Where:
  TF(t, d)  = frequency of term t in document d / total terms in d
  IDF(t, D) = log(N / df(t))
    N       = total number of documents
    df(t)   = number of documents containing term t
```

### Worked Example

```
Corpus: 5 documents, 3 terms of interest

Document counts:
  "uber"     appears in 3 out of 5 docs  -> df = 3
  "ride"     appears in 3 out of 5 docs  -> df = 3
  "earnings" appears in 1 out of 5 docs  -> df = 1

IDF values:
  IDF("uber")     = log(5/3) = 0.51
  IDF("ride")     = log(5/3) = 0.51
  IDF("earnings") = log(5/1) = 1.61    <-- rarer term, higher weight

For doc3 = "Uber earnings report shows strong quarterly growth" (7 words):
  TF("uber", doc3)     = 1/7 = 0.143
  TF("earnings", doc3) = 1/7 = 0.143

  TF-IDF("uber", doc3)     = 0.143 x 0.51 = 0.073
  TF-IDF("earnings", doc3) = 0.143 x 1.61 = 0.230  <-- "earnings" scores higher!

For query "uber earnings":
  Score(doc3) = TF-IDF("uber", doc3) + TF-IDF("earnings", doc3) = 0.073 + 0.230 = 0.303
```

### Limitations of TF-IDF

1. **No term frequency saturation**: A document mentioning "uber" 100 times scores 100x higher than one mentioning it once. This is easily gamed (keyword stuffing).
2. **No document length normalization**: A 10,000-word document naturally contains more terms, inflating scores unfairly.
3. **Bag of words**: Ignores word order, proximity, and semantics entirely.

---

## BM25: The Industry Standard

### What Is BM25?

BM25 (Best Matching 25) is a **probabilistic relevance function** that improves on TF-IDF. It is the default ranking function in Elasticsearch, Solr, and Lucene. Developed in the 1990s, it remains dominant because it works extremely well in practice.

### Formula

```
                         (k1 + 1) * tf(t,d)
BM25(d, Q) = SUM   IDF(t) * ──────────────────────────────────────
            t in Q           tf(t,d) + k1 * (1 - b + b * |d|/avgdl)

Where:
  tf(t,d)  = raw term frequency of t in document d
  |d|      = length of document d (in words)
  avgdl    = average document length across the corpus
  k1       = term frequency saturation parameter (typically 1.2)
  b        = document length normalization (typically 0.75)
  IDF(t)   = log((N - df(t) + 0.5) / (df(t) + 0.5) + 1)
```

### Key Improvements Over TF-IDF

#### 1. Term Frequency Saturation

```
TF-IDF: Score grows linearly with term frequency
  TF = 1  -> score = 1
  TF = 10 -> score = 10
  TF = 100 -> score = 100     (keyword stuffing wins!)

BM25: Score saturates (diminishing returns)
  TF = 1   -> score = 0.83
  TF = 10  -> score = 0.98
  TF = 100 -> score = 0.999   (barely higher than TF=10)

Saturation curve (k1 = 1.2):
Score
1.0 |                      ........................................
    |                .....
    |            ...
    |         ..
0.5 |       .
    |     .
    |   .
    |  .
    | .
0.0 +──────────────────────────────────────────
    0     5     10    15    20    25    30
                Term Frequency
```

#### 2. Document Length Normalization

The `b` parameter controls how much document length affects scoring:

```
b = 0: No length normalization (long docs scored same as short)
b = 1: Full normalization (strictly penalize long docs)
b = 0.75: Default. Moderate normalization.

Example:
  avgdl = 500 words

  Short doc (100 words):  length factor = 1 - 0.75 + 0.75 * (100/500) = 0.40
  Average doc (500 words): length factor = 1 - 0.75 + 0.75 * (500/500) = 1.00
  Long doc (2000 words):  length factor = 1 - 0.75 + 0.75 * (2000/500) = 3.25

  Short docs get a boost (denominator smaller -> higher score)
  Long docs get penalized (denominator larger -> lower score)
```

#### 3. Better IDF Formula

```
TF-IDF IDF:   log(N / df)
BM25 IDF:     log((N - df + 0.5) / (df + 0.5) + 1)

BM25's IDF handles edge cases better:
  - Very common terms (df close to N) get near-zero or negative IDF
  - The "+1" prevents negative values
  - More numerically stable
```

### BM25 Parameter Tuning

| Parameter | Default | Range    | Effect                                      |
|-----------|---------|----------|---------------------------------------------|
| k1        | 1.2     | 0 - 3   | Higher = less saturation, TF matters more   |
| b         | 0.75    | 0 - 1   | Higher = more length normalization          |

```
k1 = 0:  Term frequency is completely ignored (binary: present or not)
k1 = 1.2: Default balance between TF weight and saturation
k1 = 3:  TF matters a lot, slow saturation

b = 0:   Long and short documents treated equally
b = 0.75: Default. Long docs moderately penalized.
b = 1:   Strongly penalize long documents
```

---

## PageRank: Link-Based Authority

### The Key Insight

Google's original breakthrough: **links are votes**. A page linked to by many pages is probably important. A page linked to by important pages is even more important.

### The Random Surfer Model

Imagine a web surfer who:
1. Starts at a random page
2. With probability `d` (damping factor, typically 0.85), clicks a random link on the current page
3. With probability `1-d`, jumps to a completely random page

PageRank is the **steady-state probability** of the surfer being on each page.

### Formula

```
PR(A) = (1 - d) / N + d * SUM(PR(T) / C(T))
                         for each T linking to A

Where:
  d    = damping factor (0.85)
  N    = total number of pages
  C(T) = number of outbound links from page T
  PR(T) = PageRank of page T
```

### Iterative Computation

```
Pages: A, B, C
Links: A -> B, A -> C, B -> C, C -> A

Initial: PR(A) = PR(B) = PR(C) = 1/3

Iteration 1:
  PR(A) = 0.15/3 + 0.85 * PR(C)/1 = 0.05 + 0.85 * 0.333 = 0.333
  PR(B) = 0.15/3 + 0.85 * PR(A)/2 = 0.05 + 0.85 * 0.167 = 0.192
  PR(C) = 0.15/3 + 0.85 * (PR(A)/2 + PR(B)/1) = 0.05 + 0.85 * (0.167 + 0.333) = 0.475

Iteration 2:
  PR(A) = 0.05 + 0.85 * 0.475 = 0.454
  PR(B) = 0.05 + 0.85 * 0.333/2 = 0.192
  PR(C) = 0.05 + 0.85 * (0.333/2 + 0.192) = 0.355

... converges after ~50 iterations
```

### PageRank in Practice

- Computed offline in batch (not per-query)
- Combined with text-based scores: `final_score = alpha * BM25 + beta * PageRank`
- Modern Google uses hundreds of signals; PageRank is just one
- Vulnerable to link farms (led to more sophisticated signals)

---

## Learning to Rank (LTR)

### Why Machine Learning?

Hand-tuned formulas like `score = 0.6 * BM25 + 0.3 * PageRank + 0.1 * freshness` don't scale. With hundreds of features and complex interactions, **let the machine learn the optimal combination**.

### The Three Approaches

```
                   Learning to Rank Approaches
                   ===========================

  Pointwise             Pairwise              Listwise
  ─────────             ────────              ────────
  Predict absolute      Predict which of      Optimize the
  relevance score       two docs is more      entire ranked
  for each doc          relevant              list directly

  Input: (query, doc)   Input: (query,        Input: (query,
  Output: score 0-4     doc_a, doc_b)         [doc1..docN])
                        Output: A > B?        Output: ranked list

  Loss: MSE, cross-     Loss: hinge,          Loss: NDCG,
  entropy               logistic              MAP directly

  Example:              Example:              Example:
  Linear regression,    RankSVM,              LambdaMART,
  Neural net            RankNet               ListNet
```

### Feature Engineering for LTR

The power of LTR comes from combining many diverse signals:

```
Feature Categories for a Search Ranking Model
==============================================

Text Relevance Features:
  - BM25 score for title field
  - BM25 score for body field
  - TF-IDF score
  - Number of query terms matched
  - Exact phrase match (binary)
  - Query-document cosine similarity (embeddings)

Document Quality Features:
  - PageRank / domain authority
  - Document length
  - Spam score
  - Content freshness (days since last update)
  - Reading level

User Engagement Features:
  - Click-through rate (CTR) for this query-doc pair
  - Dwell time (how long users stay on this page)
  - Bounce rate
  - Number of times bookmarked / shared

Query Features:
  - Query length (number of terms)
  - Query intent class (navigational, informational, transactional)
  - Query popularity (how often searched)

Context Features:
  - User location
  - Device type (mobile / desktop)
  - Time of day
  - User language
```

### LambdaMART: The Industry Workhorse

LambdaMART combines **gradient-boosted decision trees** (MART) with **lambda gradients** that directly optimize ranking metrics like NDCG.

```
How LambdaMART Works:
  1. Compute BM25 + all features for each (query, document) pair
  2. Train gradient-boosted trees
  3. Lambda gradients push documents that would most improve NDCG
  4. Trees learn non-linear feature interactions automatically

Why it dominates:
  - Handles hundreds of features naturally
  - Captures non-linear interactions (e.g., freshness matters more for news queries)
  - Fast inference (tree traversal is fast)
  - Won most learning-to-rank competitions (2010-2020)
  - Used by: Bing, Yahoo, Airbnb, LinkedIn
```

---

## Semantic / Vector Search

### The Vocabulary Mismatch Problem

BM25 only matches **exact terms**. It fails when:
- User searches "automobile" but document says "car"
- User searches "how to fix a leaky faucet" but best article is titled "plumbing repair guide"
- User searches in English but relevant document is in Spanish

### Embeddings: Text to Dense Vectors

Neural models (BERT, Sentence-BERT, OpenAI embeddings) convert text into dense numerical vectors where **similar meanings are near each other**.

```
Embedding Space (simplified to 2D):
                    
  "car"  --------*
                  |  close together = similar meaning
  "automobile" --*
                              
                              "banana" ----*
                                            far away = different meaning
  "vehicle" -----*

  "uber rides" ------*
                      |  close together
  "ride sharing" ----*
```

### Similarity Metrics

```python
import numpy as np

def cosine_similarity(a, b):
    """Most common for normalized embeddings. Range: [-1, 1]."""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def dot_product(a, b):
    """Faster if vectors are already normalized."""
    return np.dot(a, b)

def euclidean_distance(a, b):
    """Lower = more similar."""
    return np.linalg.norm(a - b)

# Example
query_vec  = np.array([0.8, 0.2, 0.5])  # "uber rides"
doc1_vec   = np.array([0.7, 0.3, 0.6])  # "ride sharing service"
doc2_vec   = np.array([0.1, 0.9, 0.1])  # "banana smoothie recipe"

print(cosine_similarity(query_vec, doc1_vec))  # 0.97 (very similar)
print(cosine_similarity(query_vec, doc2_vec))  # 0.35 (not similar)
```

### Vector Search Indexes

Finding nearest neighbors in high-dimensional space (768 or 1536 dimensions) requires specialized data structures:

| Algorithm   | Type           | Recall  | Speed   | Used By           |
|-------------|----------------|---------|---------|-------------------|
| HNSW        | Graph-based    | ~99%    | Fast    | Elasticsearch, Pinecone, Weaviate |
| IVF         | Partition-based| ~95%    | Fast    | Faiss, Milvus     |
| PQ          | Compression    | ~90%    | Fastest | Faiss (with IVF)  |
| Flat/Brute  | Exact          | 100%    | Slow    | Small datasets    |

### Hybrid Search: BM25 + Vector

Neither BM25 nor vector search is universally better. The best systems combine both.

```
Hybrid Search Architecture
==========================

Query: "uber ride sharing earnings"
           |
     ┌─────┴──────┐
     v             v
  BM25 Search   Vector Search
  (exact terms) (semantic meaning)
     |             |
     v             v
  BM25 Results  Vector Results
  [doc3, doc1,  [doc3, doc5,
   doc5, doc2]   doc1, doc7]
     |             |
     └─────┬───────┘
           v
    Reciprocal Rank
    Fusion (RRF)
           |
           v
    Final Ranked List
    [doc3, doc1, doc5, doc7, doc2]
```

### Reciprocal Rank Fusion (RRF)

```
RRF_score(d) = SUM  1 / (k + rank_i(d))
              for each ranker i

Where k = 60 (constant, standard value)

Example:
  doc3: BM25 rank=1, vector rank=1
    RRF = 1/(60+1) + 1/(60+1) = 0.0164 + 0.0164 = 0.0328

  doc1: BM25 rank=2, vector rank=3
    RRF = 1/(60+2) + 1/(60+3) = 0.0161 + 0.0159 = 0.0320

  doc5: BM25 rank=3, vector rank=2
    RRF = 1/(60+3) + 1/(60+2) = 0.0159 + 0.0161 = 0.0320

  doc7: BM25 rank=not found, vector rank=4
    RRF = 0 + 1/(60+4) = 0.0156

Final order: doc3, doc1=doc5 (tie), doc7
```

---

## Query Understanding

Search is not just about ranking documents -- it is also about understanding what the user actually wants.

### Spell Correction

#### Edit Distance (Levenshtein Distance)

The minimum number of single-character edits (insert, delete, replace) to transform one word into another.

```
Levenshtein("uberr", "uber"):

      ""  u  b  e  r
  ""   0  1  2  3  4
  u    1  0  1  2  3
  b    2  1  0  1  2
  e    3  2  1  0  1
  r    4  3  2  1  0
  r    5  4  3  2  1    <- distance = 1 (delete one 'r')

Common approach:
  1. For each query term, find dictionary words within edit distance 1-2
  2. Rank candidates by: edit distance, term frequency, n-gram context
  3. "Did you mean: uber?" if confidence is high
```

#### Noisy Channel Model

```
P(correction | misspelling) proportional to P(misspelling | correction) * P(correction)

P(misspelling | correction) = error model (keyboard proximity, common typos)
P(correction) = language model (word frequency, bigram probability)

Example: user types "ubdr"
  Candidates within edit distance 2:
    "uber"  -> P(error) = high (d near e on keyboard) * P("uber") = high  -> BEST
    "under" -> P(error) = medium * P("under") = medium
```

### Synonym Expansion

```
Original query: "cheap flights to NYC"

Synonym expansion:
  "cheap"   -> "cheap" OR "affordable" OR "budget" OR "low-cost"
  "flights" -> "flights" OR "airfare" OR "tickets"
  "NYC"     -> "NYC" OR "New York City" OR "New York" OR "JFK"

Expanded query matches many more relevant documents.

Sources of synonyms:
  - Manual curated lists (WordNet)
  - Mined from query logs (users who search X also search Y)
  - Word embeddings (words close in vector space)
```

### Query Intent Classification

```
Query Intent Types:
==================

Navigational: User wants a specific website
  "facebook login"     -> show facebook.com
  "uber app download"  -> show app store link

Informational: User wants to learn something
  "how does uber work" -> show articles, Wikipedia
  "uber stock price"   -> show finance widget

Transactional: User wants to do something
  "book uber ride"     -> show Uber app / deep link
  "buy uber gift card" -> show purchase options

Classification approach:
  - Train a classifier on labeled query logs
  - Features: query length, presence of action words, domain terms
  - Impact: changes which results to show and how to display them
```

### Query Rewriting

```
Query rewriting pipeline:
  1. Tokenize: "uber eats promo code 2024" -> ["uber", "eats", "promo", "code", "2024"]
  2. Spell check: (all correct)
  3. Segment: "uber eats" is a known entity -> treat as single token
  4. Expand: "promo code" -> "promo code" OR "coupon" OR "discount"
  5. Remove stale: "2024" -> check if current year is different
  6. Classify intent: transactional (wants a coupon)
  7. Final rewritten query for ranking engine
```

---

## Evaluation Metrics

How do you measure if your ranking is good?

### Precision and Recall

```
                    Retrieved
                 ┌─────────────┐
                 │  Relevant &  │
  All Relevant   │  Retrieved   │  Retrieved but
  ┌──────────┐   │  (True Pos)  │  Not Relevant
  │          │   │              │  (False Pos)
  │  Missed  │   │              │
  │  (False  │   └─────────────┘
  │  Neg)    │
  └──────────┘

Precision = True Positives / (True Positives + False Positives)
  "Of what I returned, how much is relevant?"

Recall = True Positives / (True Positives + False Negatives)
  "Of all relevant docs, how many did I return?"
```

### Precision@K and Recall@K

```
Top-10 results for query "uber earnings":
  Rank 1:  relevant
  Rank 2:  relevant
  Rank 3:  not relevant
  Rank 4:  relevant
  Rank 5:  not relevant
  Rank 6:  not relevant
  Rank 7:  relevant
  Rank 8:  not relevant
  Rank 9:  not relevant
  Rank 10: not relevant

Precision@5 = 3/5 = 0.60
Precision@10 = 4/10 = 0.40
```

### NDCG (Normalized Discounted Cumulative Gain)

The standard metric for search ranking. Accounts for **position** -- relevant docs ranked higher are worth more.

```
DCG@k = SUM (2^rel_i - 1) / log2(i + 1)
         i=1 to k

NDCG@k = DCG@k / IDCG@k   (normalized by ideal ranking)

Example: relevance scores for top-5 results: [3, 2, 0, 1, 3]

DCG@5 = (2^3-1)/log2(2) + (2^2-1)/log2(3) + (2^0-1)/log2(4) + (2^1-1)/log2(5) + (2^3-1)/log2(6)
       = 7/1 + 3/1.585 + 0/2 + 1/2.322 + 7/2.585
       = 7 + 1.893 + 0 + 0.431 + 2.708 = 12.032

Ideal order: [3, 3, 2, 1, 0]
IDCG@5 = 7/1 + 7/1.585 + 3/2 + 1/2.322 + 0/2.585 = 7 + 4.416 + 1.5 + 0.431 + 0 = 13.347

NDCG@5 = 12.032 / 13.347 = 0.901  (pretty good!)
```

### Mean Reciprocal Rank (MRR)

For queries with a single correct answer (navigational queries):

```
MRR = average over all queries of (1 / rank of first relevant result)

Query 1: first relevant at rank 1 -> 1/1 = 1.0
Query 2: first relevant at rank 3 -> 1/3 = 0.33
Query 3: first relevant at rank 2 -> 1/2 = 0.5

MRR = (1.0 + 0.33 + 0.5) / 3 = 0.61
```

---

## Putting It All Together: Modern Search Ranking Stack

```
Modern Search Ranking Pipeline
==============================

User Query: "best uber alternatives for airport rides"
     |
     v
┌──────────────────────────────────┐
│ 1. QUERY UNDERSTANDING           │
│    - Spell check                 │
│    - Intent: informational       │
│    - Synonym expand: "airport    │
│      rides" -> "airport transfer"│
│    - Entity detect: "uber"       │
└──────────┬───────────────────────┘
           v
┌──────────────────────────────────┐
│ 2. CANDIDATE RETRIEVAL           │
│    - BM25: top 1000 from index   │
│    - Vector: top 1000 by         │
│      semantic similarity         │
│    - Merge via RRF: top 500      │
└──────────┬───────────────────────┘
           v
┌──────────────────────────────────┐
│ 3. RANKING (L1 - lightweight)    │
│    - Fast model (logistic reg)   │
│    - Features: BM25, doc quality │
│    - Reduce to top 100           │
└──────────┬───────────────────────┘
           v
┌──────────────────────────────────┐
│ 4. RE-RANKING (L2 - heavy)       │
│    - LambdaMART or neural model  │
│    - All features: text +        │
│      engagement + freshness +    │
│      personalization             │
│    - Reduce to top 20            │
└──────────┬───────────────────────┘
           v
┌──────────────────────────────────┐
│ 5. BUSINESS LOGIC                │
│    - Diversity (don't show 10    │
│      results from same site)     │
│    - Freshness boost             │
│    - Ads insertion               │
│    - A/B test treatment          │
└──────────┬───────────────────────┘
           v
     Top 10 Results to User
```

### Key Interview Takeaways

1. **BM25 is the baseline** -- always start here, it is surprisingly strong
2. **Vector search complements BM25** -- handles semantic matching that BM25 misses
3. **Learning to Rank** is how you combine hundreds of signals optimally
4. **Multi-stage ranking** (retrieve many, rank fewer, re-rank top) balances latency with quality
5. **Query understanding** is often the highest-ROI investment in search quality
6. **Measure with NDCG** -- it captures both relevance and position importance
