#!/usr/bin/env bash
set -e

BASE_URL="http://127.0.0.1:8000"

echo "Testing HyperCapacity API..."

echo ""
echo "1. Root:"
curl -s "$BASE_URL/" | python3 -m json.tool

echo ""
echo "2. Dashboard overview:"
curl -s "$BASE_URL/api/dashboard/overview" | python3 -m json.tool > /tmp/hypercapacity_dashboard.json
echo "Dashboard overview OK. Saved to /tmp/hypercapacity_dashboard.json"

echo ""
echo "3. Instruments:"
curl -s "$BASE_URL/api/instruments" | python3 -m json.tool > /tmp/hypercapacity_instruments.json
echo "Instruments OK. Saved to /tmp/hypercapacity_instruments.json"

echo ""
echo "4. H100 latest:"
curl -s "$BASE_URL/api/indices/H100-SPOT/latest" | python3 -m json.tool

echo ""
echo "5. ACU-CodeFix latest:"
curl -s "$BASE_URL/api/indices/ACU-CodeFix/latest" | python3 -m json.tool

echo ""
echo "6. ACU-Reasoning sources:"
curl -s "$BASE_URL/api/indices/ACU-Reasoning/sources" | python3 -m json.tool > /tmp/hypercapacity_reasoning_sources.json
echo "ACU-Reasoning sources OK. Saved to /tmp/hypercapacity_reasoning_sources.json"

echo ""
echo "All API checks passed."
