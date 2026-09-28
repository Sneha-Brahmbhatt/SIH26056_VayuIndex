# VayuIndex — Airfare Price Index Prototype (APIx)

**Smart India Hackathon (SIH 2026) Prototype**  
**Problem Statement SIH26056:** *Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI).*  
**Organization:** Ministry of Statistics and Programme Implementation (MoSPI) / Data Informatics & Innovation Division (DIID)  
**Theme:** Travel & Tourism | **Category:** Software  

---

## ⚠️ IMPORTANT SCOPE AND COMPLIANCE NOTICE

> **Demo & Prototype Scope Declaration:**  
> This application is a quality-aware, traceable SIH research prototype built for demonstration and evaluation.  
> 
> - **Simulated Source Data:** By default, the prototype uses a deterministic `SimulatedSourceAdapter` that generates realistic domestic airfare observations across 10 key Indian corridors.  
> - **Ethical Web Collection Standards:** The codebase features a production-ready abstract adapter architecture (`SourceAdapter`). Real-source adapters (`AirlineSourceAdapter`, `OTASourceAdapter`) enforce strict `robots.txt` compliance, rate limiting, and access terms. The codebase **does NOT** implement CAPTCHA bypassing, proxy rotation, anti-bot evasion, credential abuse, or ToS-violating scraping.  
> - **Complementary Indicator Disclaimer:** VayuIndex provides a high-frequency **Airfare Price Index (APIx)** intended as a potential complement for CPI-related travel cost analysis. **It is NOT an official MoSPI index and does NOT replace the Consumer Price Index (CPI).**

---

## 🚀 Quick Start Instructions

### Option 1: Full Stack via Docker Compose (Recommended)

```bash
# Clone repository and navigate to root
cd SIH26056

# Build and launch backend, database, and frontend containers
docker compose up --build
```
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend Swagger API Specs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

### Option 2: Local Standalone Development Setup

#### 1. Backend Setup (FastAPI + Python 3.11+)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Seed 45+ days of historical observations & calculate initial indices
python -m app.seed

# Start FastAPI Uvicorn dev server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup (React + TypeScript + Vite + Tailwind CSS)

```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### 3. Run Backend Test Suite

```bash
cd backend
python -m pytest
```

---

## 📐 Index Methodology: Matched-Model Jevons Index

VayuIndex avoids the statistical flaw of simply taking an unweighted arithmetic average of raw fares. Instead, it implements an international standard **Matched-Model Jevons Price Index**:

### 1. Homogeneous Cell Definition
Observations are classified into homogeneous price cells $c$:
$$c = \text{Route}_r \times \text{Carrier}_a \times \text{Booking Lead Window}_{T+k}$$

Where lead times $T+k \in \{1, 7, 15, 30, 45\}$ days.

### 2. Cell Price Relatives
For each cell $c$ on date $t$, the geometric mean price $P(c,t)$ of accepted observations is calculated. The daily price relative $r(c,t)$ compares cell price relative to previous period $t-1$:
$$r(c,t) = \frac{P(c,t)}{P(c,t-1)}$$

### 3. Cell Index Chaining
Cell indices are link-chained daily starting at base period $t_0 = 100.0$:
$$I(c,t) = I(c,t-1) \times r(c,t)$$

### 4. Higher-Level Weighted Aggregation
Higher level indices (National APIx, Route APIx, Carrier APIx, Booking Window APIx) aggregate cell indices using fixed, versioned traffic weights $w_c$:
$$I(\text{National}, t) = \exp \left( \frac{\sum_{c \in \text{Covered}} w_c \ln I(c,t)}{\sum_{c \in \text{Covered}} w_c} \right)$$

---

## 🗄️ Database Domain Schema

The database model separates raw network captures from statistical index values to guarantee **100% auditability & traceability**:

| Table Name | Description | Key Fields |
| :--- | :--- | :--- |
| `sources` | Portal metadata & rate limit policies | `name`, `source_type`, `status`, `robots_policy`, `rate_limit_per_minute` |
| `routes` | Route basket definitions | `origin_iata`, `destination_iata`, `origin_city`, `route_type`, `distance_km` |
| `airlines` | Carrier registry | `airline_code`, `airline_name`, `is_active` |
| `fare_observations` | Cleaned fare observations | `base_fare_inr`, `taxes_fees_inr`, `total_payable_inr`, `quality_status`, `booking_lead_time_days` |
| `raw_responses` | Immutable raw HTTP payloads | `request_url`, `response_hash` (SHA-256), `response_body`, `collection_timestamp_ist` |
| `collection_events` | Collector event log | `outcome` (`success`, `blocked`, `timeout`, `schema_change`, `sold_out`), `http_status` |
| `index_values` | Published index time series | `index_date`, `granularity`, `scope`, `index_value`, `coverage_weight_pct`, `confidence` |
| `weights` | Versioned cell weights | `weight_version`, `effective_from`, `weight_value`, `weight_basis` |
| `dgca_benchmarks` | Benchmark verification upload | `route_name`, `year_month`, `average_fare_inr`, `source_url` |

---

## 🎯 3-Minute SIH Demo Script (For Judges)

When presenting VayuIndex to SIH judges, follow this step-by-step 3-minute walkthrough:

### Minute 1: Problem Alignment & Compliance Overview
1. Open the VayuIndex Dashboard at `http://localhost:5173`.
2. Point out the **MoSPI / DIID Header** and the **Compliance Banner** stating:
   *"Prototype uses controlled/simulated source data. VayuIndex is a proposed SIH prototype and does not replace CPI."*
3. Highlight the **Current Headline APIx Value** (e.g. `104.28`), 30-day sparkline, and the **Coverage-Weight %** (`94.2% High Confidence`).

### Minute 2: Sub-Indices & Advance Purchase Horizons
1. Click **National Index** on the sidebar. Show the multi-series line chart comparing National APIx vs $T+1, T+7, T+15, T+30, T+45$ lead times. Explain how $T+1$ (last minute) trades at a premium over $T+45$ (early bird).
2. Click **Booking Windows**. Show the **Lead-Time Price Index Curve** illustrating carrier dynamic yield management.
3. Click **Routes Sub-Index**. Select `DEL–BOM` or `DEL–BLR` from the dropdown to demonstrate route-level inflation tracking.

### Minute 3: Data Quality, Traceability & Live Collection
1. Click **Data Quality & Coverage**. Show the **Source Health Table** reporting success rate, blocked rate, timeout rate, and missing-cell percentage.
2. Click **Observation Explorer**. Filter by Quality Status: `Accepted`. Click the **Eye icon** on any row to open the modal showing the **disaggregated fare components** and the **immutable raw JSON payload with SHA-256 hash**.
3. Click **Index Traceability**. Pick an index point to show how VayuIndex traces every headline number back to cell weights and matched raw observations.
4. Click **Run Collection Cycle** in the top header. Show live execution of a simulated sweep across all 10 corridors!

---

## 🛠️ REST API Specification Summary

- `GET /health` — Service health & database status
- `GET /api/v1/meta` — Route basket, carriers, sources, booking windows, methodology version
- `POST /api/v1/collection/run` — Executes a collection cycle
- `GET /api/v1/observations` — Paginated fare observations with quality filters
- `GET /api/v1/observations/{id}` — Observation details with raw response payload
- `GET /api/v1/index` — National daily/weekly/monthly APIx time series
- `GET /api/v1/index/routes` — Route-level sub-indices
- `GET /api/v1/index/airlines` — Carrier-level sub-indices
- `GET /api/v1/index/booking-windows` — Advance purchase ($T+1 \dots T+45$) sub-indices
- `GET /api/v1/quality` — Quality metrics, coverage weights, HHI concentration
- `GET /api/v1/index/{id}/trace` — Complete audit trail linking index value to raw observations
- `POST /api/v1/admin/rebase` — Admin endpoint to rebase baseline period
- `POST /api/v1/backtest/dgca-upload` — Upload official DGCA benchmark CSV
- `GET /api/v1/backtest/dgca` — DGCA correlation and directional agreement statistics

---

## 📜 License & Acknowledgements

Created for Smart India Hackathon (SIH 2026) Problem Statement SIH26056.  
Designed in accordance with statistical index guidelines (CPI/Jevons Matched-Model) and ethical data collection standards.
