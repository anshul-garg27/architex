# Modern Data Analytics: Enterprise Data Logistics

This architecture is designed for multi-petabyte scale data processing, moving from raw events to actionable business intelligence with a focus on data governance and processing performance.

## Component Rationale

### Medallion Storage Architecture (Bronze/Silver/Gold)
- **Why**: Decoupling raw data from refined analytical models.
- **Rationale**: Storing only "final" data is risky -- if your logic is buggy, you've lost the raw source. By keeping a **Bronze (Raw)** layer in S3, we can "replay" our entire pipeline if we ever discover an error in our transformation logic.
- **Implementation**: Use **Apache Parquet** for the Silver/Gold layers. Its columnar format allows our query engine to skip 90% of a file's data if we only need a few specific columns, drastically reducing I/O costs.

### Analytical Data Warehouse (BigQuery/Snowflake)
- **Why**: Serving high-concurrency SQL queries to BI tools.
- **Rationale**: While S3 is great for storage, it's slow for interactive queries. Modern warehouses separate **Compute** from **Storage**, allowing us to spin up massive CPU power for a 30-second query and then shut it down to save costs.
- **Trade-off**: Higher cost per query compared to Spark on S3. We mitigate this by only moving "Gold" (aggregated) data into the Warehouse for final reporting.

### Distributed Orchestrator (Airflow/Prefect)
- **Why**: Managing complex directed acyclic graphs (DAGs) of data dependencies.
- **Rationale**: Manual scripts for data move are brittle. Orchestrators provide automatic retries, dependency management (don't run Report B until Table A is ready), and detailed logging of pipeline health.

## Architectural Trade-offs

### ETL vs. ELT (Extract, Load, Transform)
- **Decision**: **ELT Strategy**.
- **Rationale**: Traditional ETL (cleaning data *before* loading) was necessary when database compute was expensive. Now, with cloud warehouses, it is faster and more flexible to load "as-is" and use the warehouse's massive SQL power to transform the data.
- **Benefit**: Faster ingestion times and "schema-on-read" flexibility.

### Lambda vs. Kappa Architecture
- **Decision**: **Lambda Architecture (Hybrid)**.
- **Rationale**: We use a "Speed Layer" (Spark Streaming) for real-time dashboards and a "Batch Layer" (Daily Spark jobs) for high-accuracy historical reports.
- **Trade-off**: Maintains two codebases for the same logic. We accept this overhead to ensure our "Daily Revenue" reports are 100% accurate, even if the real-time stream misses a few late-arriving events.
