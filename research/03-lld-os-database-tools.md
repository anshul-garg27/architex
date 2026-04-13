# LLD, OS & Database Tools Research

---

## LOW-LEVEL DESIGN TOOLS

### PlantUML — Richest text-based UML
- All 14 UML diagram types + ER, Gantt, MindMap, Network diagrams
- Text-based (version-controllable), VS Code/IntelliJ integration
- **Missing:** Dated rendering, no interactivity, requires Java

### Mermaid.js — Zero-install, GitHub-native
- Class, Sequence, Flowchart, State, ER, Gantt + 10 more types
- Renders in GitHub/GitLab markdown, Obsidian, Notion
- **Missing:** Less expressive than PlantUML, no code generation

### StarUML — Best desktop UML
- Full UML 2.x, bidirectional code engineering (Java, C++, C#, Python)
- $89.90 one-time. Clean UI.
- **Missing:** No web version, no collaboration

### Visual Paradigm — Most comprehensive
- Full UML + SysML + BPMN + ArchiMate + DFD + ERD
- Code generation in 10+ languages, round-trip engineering
- **Missing:** Expensive ($99-799/yr), steep learning curve

### Design Patterns — Refactoring.Guru is BEST
- All 23 GoF patterns with interactive structure diagrams
- Code examples in 10+ languages
- patterns.dev for modern JS/React patterns

### Code ↔ UML Tools
| Tool | Direction | Languages |
|---|---|---|
| StarUML | Bidirectional | Java, C++, C#, Python |
| Visual Paradigm | Bidirectional | 10+ languages |
| pyreverse | Code → UML | Python |
| tsuml2 | Code → UML | TypeScript |

---

## OS CONCEPTS

### Process Scheduling
- **Best:** boonsuen.com/process-scheduling-solver — all algorithms, Gantt chart, metrics
- **Algorithms:** FCFS, SJF, SRTF, Round Robin, Priority (preemptive/non-preemptive)

### Page Replacement
- **Best:** GitHub "page-replacement-visualizer" repos (React)
- OSTEP homework simulators (gold standard for OS learning)

### Deadlock Detection
- Academic projects only. No polished commercial tool.
- Banker's Algorithm step-through, resource allocation graphs

### Comprehensive: OSTEP (University of Wisconsin)
- Python CLI simulators for: scheduling, paging, TLBs, free-space, disk scheduling, RAID
- The gold standard for OS learning

---

## DATABASE TOOLS

### dbdiagram.io — Fastest ER diagramming
- DBML text-based syntax, auto-generates diagrams
- Export to PostgreSQL/MySQL/MSSQL/Oracle DDL
- **Missing:** No normalization, no query viz, 10 free diagrams

### ERDPlus — Academic ER (Chen notation)
- Proper Chen notation (circles, diamonds) — what textbooks use
- Auto-convert ER to relational schema + generate DDL
- **Missing:** Chen notation is verbose, dated UI

### SQL Query Plan Visualization
| Tool | Best For |
|---|---|
| **explain.dalibo.com (PEV2)** | PostgreSQL — paste EXPLAIN ANALYZE, get interactive tree |
| MySQL Workbench | MySQL Visual Explain |
| SSMS | SQL Server execution plans |

### B-Tree / Index Visualization
- **Best:** USFCA Galles — B-Tree and B+ Tree with adjustable order, step-by-step
- VisuAlgo also covers B-trees

### Normalization Tools
- GitHub "normalization calculator" repos — input FDs, compute closures, find keys, decompose
- RelaX (dbis-uibk.github.io/relax/) — relational algebra calculator

---

## SUMMARY: BEST TOOL PER NEED

| Need | Best Tool |
|---|---|
| Quick UML in docs | Mermaid.js |
| Complete UML modeling | Visual Paradigm |
| Code ↔ UML | StarUML |
| Design pattern learning | Refactoring.Guru |
| CPU scheduling | boonsuen.com scheduler |
| OS concepts (comprehensive) | OSTEP homework simulators |
| Fast ER diagramming | dbdiagram.io |
| Academic ER (Chen) | ERDPlus |
| SQL EXPLAIN viz | explain.dalibo.com |
| B-Tree viz | USFCA Galles |
