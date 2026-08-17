# ShopCloud Observability Platform

> **SLA / SLO / SLI Reliability & Monitoring SaaS Platform for Cloud SRE & DevOps Teams**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)

---

## 1. Executive Summary & Product Vision

**ShopCloud Observability** is an enterprise-grade cloud reliability monitoring and incident management SaaS platform engineered for Site Reliability Engineers (SRE) and DevOps teams. 

Designed following Google SRE principles, the platform implements quantitative **Service Level Indicator (SLI)** calculations, **Service Level Objective (SLO)** rolling compliance evaluators, **Service Level Agreement (SLA)** customer breach risk tracking, and **Multi-Window Multi-Burn-Rate** error budget math.

---

## 2. Core SRE Capabilities & Features

1. **System Health & Executive Overview**:
   - High-contrast KPI metric cards with sparkline trends for System Health, Availability %, SLO Compliance %, SLA Compliance %, Error Budget remaining %, and Active Incidents.
   - Comprehensive Service Health table with live status pills, RPS throughput, error rate percentages, and P95 latency.
2. **Microservice Catalog & Deep Drill-Down**:
   - Detailed observability dashboards for all 8 microservices (*ShopCloud API Gateway, Auth Service, Payment Service, Order Service, Product Catalog, Search Service, Inventory Service, Notification Service*).
   - Interactive charts: Throughput area charts, Error Rate trends, Latency Percentiles (P50, P95, P99) with SLO target reference lines, and 30-day Availability curves.
3. **Interactive Service Topology Map**:
   - Dynamic SVG dependency graph mapping cross-service communication channels (sync HTTP, async queue, gRPC) with edge latency badges and glowing health status rings.
4. **SLI / SLO / SLA Reliability Management**:
   - **SLI Monitor**: Direct pass/fail indicator cards for Availability, Latency, and Error Rate.
   - **SLO Engine**: 30-day rolling compliance evaluator with error budget consumption bars and dynamic Create/Edit SLO modals.
   - **Error Budget Visualizer**: SVG circular budget gauge with allowed vs. consumed breakdowns and Google SRE standard multi-window burn rate meters (1h, 6h, 24h).
   - **SLA Agreements**: Customer contract tracker with financial credit penalty risk assessment (*Compliant*, *At Risk*, *Breached*).
5. **Monitors & Alerting Lifecycle**:
   - Rule-based threshold evaluator (`<`, `>`, `<=`, `>=`) with evaluation windows, warning/critical threshold escalations, and enable/disable toggles.
   - Live alert triage console with one-click **Acknowledge** and **Resolve** workflows.
6. **Incident Management & Root Cause Postmortems**:
   - Active and resolved incident ticket tracking with automated alert correlation, timeline event logs, impact assessment, and RCA documentation.
7. **Simulated Observability Streams**:
   - **Logs Explorer**: Full-text keyword search, log level filtering (`INFO`, `WARN`, `ERROR`, `CRITICAL`), request ID correlation, and expandable JSON payload inspector.
   - **Distributed Tracing**: Interactive OpenTelemetry span waterfalls showing latency breakdown across microservice RPC boundaries.
   - **Metrics Explorer**: Custom time-series graphing across CPU, Memory, Throughput, Error Rate, and Latency percentiles.
8. **Interactive SRE Scenario Simulator (Academic Demo Control)**:
   - **Simulate Incident (Warning)**: Injects Payment downstream timeout (Availability: 99.70%, Latency: 285ms, Error: 0.35%), breaches SLO, fires warning alert.
   - **Simulate Critical Incident (P1 Outage)**: Injects connection pool deadlock (Availability: 99.35%, Latency: 650ms, Error: 1.25%), violates SLA (< 99.50%), creates P1 incident, triggers critical alerts.
   - **Restore / Recover**: Smoothly returns all telemetry back to nominal 99.97% steady state.
9. **Global Search (Cmd+K)**: Instantaneous fuzzy search across services, alerts, incidents, SLOs, monitors, and logs.

---

## 3. System Architecture

```
+-----------------------------------------------------------------------------------+
|                                 REACT FRONTEND                                    |
|  (Vite + React 19 + TypeScript + Tailwind CSS + Lucide Icons + Recharts)          |
|                                                                                   |
|  • Overview & KPIs         • Service Map (Topology)   • SLO / SLA / Error Budgets |
|  • Monitors & Alerts       • Incident Management      • Logs, Traces & Metrics    |
|  • Live Incident Simulator • Global Search (Cmd+K)    • Notifications & Dark Mode |
+------------------------------------------+----------------------------------------+
                                           |
                                           | REST API (Axios / Fetch)
                                           v
+-----------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                    |
|                                                                                   |
|  • REST Routers: /services, /metrics, /slis, /slos, /slas, /monitors, /alerts,    |
|                  /incidents, /logs, /traces, /dashboards, /simulation             |
|                                                                                   |
|  • SRE Reliability Engines (Modular Python):                                      |
|    - sli_calculator.py    : Availability, Latency P50/P95/P99, Error Rates        |
|    - slo_evaluator.py     : Rolling 30-day window compliance calculations         |
|    - sla_evaluator.py     : Customer SLA breach risk & penalty tracking           |
|    - budget_engine.py     : Error budget & multi-window burn rate (1h, 6h, 24h)   |
|    - alert_engine.py      : Rule evaluation & threshold breach dispatch           |
|    - incident_engine.py   : Correlation, timeline logs & postmortems              |
|    - simulation_engine.py : Stateful telemetry fault injector & recovery          |
+------------------------------------------+----------------------------------------+
                                           |
                                           | SQLAlchemy 2.0 ORM
                                           v
+-----------------------------------------------------------------------------------+
|                          DATABASE & STORAGE LAYER                                 |
|  • SQLite (Default zero-config local development)                                 |
|  • PostgreSQL-ready schema design for enterprise cloud deployments                |
|  • High-fidelity 30-Day Historical Telemetry Seed Generator                       |
+-----------------------------------------------------------------------------------+
```

---

## 4. SRE Mathematical Foundations

### 4.1. Availability SLI
$$\text{Availability} = \frac{\text{Successful Requests (HTTP } < 500\text{)}}{\text{Total Requests}} \times 100\%$$

### 4.2. Error Budget & Remaining Allowance
$$\text{Allowed Error Budget} = 100\% - \text{SLO Target}$$
$$\text{Consumed Budget} = \text{Actual Error Rate} = 100\% - \text{Actual Availability}$$
$$\text{Budget Remaining } (\%) = \max\left(0, 100 - \frac{\text{Consumed Budget}}{\text{Allowed Error Budget}} \times 100\right)$$

### 4.3. Multi-Window Multi-Burn-Rate (Google SRE Standard)
$$\text{Burn Rate} = \frac{\text{Actual Error Rate over Window } \Delta t}{\text{Allowed Error Rate}}$$
- **1-Hour Burn Rate ($14.4\times$)**: Consumes $2\%$ of 30-day budget in 1 hour $\rightarrow$ Dispatches **P1 Critical Incident**.
- **6-Hour Burn Rate ($6.0\times$)**: Consumes $5\%$ of 30-day budget in 6 hours $\rightarrow$ Dispatches **P2 Alert**.
- **24-Hour Burn Rate ($1.0\times$)**: Nominal steady-state consumption.

---

## 5. Getting Started & Local Development

### Prerequisites
- **Node.js**: `v18+` (Tested on `v24.13.0`)
- **Python**: `3.10+` (Tested on `3.12.10`)
- **npm** or **pnpm**

### Step 1: Clone Repository
```bash
git clone https://github.com/example/shopcloud-observability.git
cd shopcloud-observability
```

### Step 2: Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run automated tests
pytest -v

# Start FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Swagger Documentation will be live at `http://localhost:8000/docs`.*

### Step 3: Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend will open at `http://localhost:5173/`.*

---

## 6. Docker Containerized Deployment

To launch the full production stack using Docker Compose:

```bash
docker-compose up --build -d
```

- **Frontend Web UI**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **API Swagger Docs**: `http://localhost:8000/docs`

---

## 7. Step-by-Step Academic Presentation Script

The platform includes a built-in interactive simulator specifically designed for live academic evaluations:

1. **Step 1 — Overview**: Open `http://localhost:5173/`. Point out the top KPI cards showing nominal **99.96% Availability**, compliant SLOs, and 0 active incidents.
2. **Step 2 — Services**: Navigate to **Services** in the sidebar. Highlight the 8 microservices and their live RPS throughput and P95 latency.
3. **Step 3 — Service Deep Dive**: Click **ShopCloud API Gateway**. Demonstrate the interactive latency percentiles chart (P50/P95/P99 with 200ms SLO threshold line) and correlated logs/traces.
4. **Step 4 — Topology Map**: Click **Service Map**. Show the interactive dependency graph with glowing health badges and live communication latency.
5. **Step 5 — Reliability & Error Budgets**: Navigate to **SLOs** and **Error Budgets**. Show the 30-day rolling compliance and the Google SRE multi-window burn rate meters.
6. **Step 6 — Inject Degraded Incident**: In the top simulator bar, click **Simulate Incident (Warning)**. Notice immediate feedback:
   - Payment Service P95 latency jumps to 285ms.
   - Payment 99.95% SLO breaches to WARNING.
   - Warning alert dispatched in the notification center.
7. **Step 7 — Inject Critical Incident (P1 Outage)**: Click **Simulate Critical Incident (P1 Outage)**:
   - Availability drops to **99.35%**, violating the 99.50% Enterprise SLA contract.
   - Critical P1 Incident `INC-2026-XXXX` declared with automated timeline entry.
   - Service Map turns RED for impacted nodes.
   - Error budget burn rate spikes to $14.4\times$.
8. **Step 8 — Incident Triage**: Navigate to **Incidents**, open the active ticket, add a remediation note to the timeline, and acknowledge correlated alerts.
9. **Step 9 — System Recovery**: Click **Restore / Recover** in the top simulator bar. Observe all services recovering to healthy status and aggregate availability returning to 99.97%.

---

## 8. Academic Honesty Statement

This is an educational SRE demonstration platform.
- **Real Platform Components**: Python FastAPI backend, SQLAlchemy ORM, SLI/SLO/SLA mathematical engines, multi-window burn rate algorithms, REST endpoints, alert lifecycle rules, and React TypeScript frontend.
- **Simulated Components**: Microservice telemetry points, distributed tracing waterfalls, and application log streams.

---

## 9. License

MIT License. Designed for academic demonstration and cloud observability training.
