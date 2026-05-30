# HyperCapacity

HyperCapacity is an AI Compute and ACU Dashboard backend demo.

This repository currently contains the backend only.

Backend stack:
- Python
- FastAPI
- JSON and CSV local data files

Main dashboard API:
GET /api/dashboard/overview

Other APIs:
GET /api/instruments
GET /api/indices/{symbol}/latest
GET /api/indices/{symbol}/sources
GET /api/indices/{symbol}/methodology

Local start:
1. cd backend
2. ./start_backend.sh

Local backend URL:
http://127.0.0.1:8000

API documentation:
http://127.0.0.1:8000/docs

V1 indices:
- H100-SPOT
- H200-SPOT
- GPU-BASKET
- H200/H100-PREMIUM
- ACU-CodeFix
- ACU-Coding/USD
- ACU-Reasoning
- ACU-CPI

Data status:
This is a V1 demo backend. External compute prices use manual public reference data. ACU indices use seed CSV data. This demo is not for settlement, not investment advice, and not an authorized official index.
