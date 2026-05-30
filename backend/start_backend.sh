#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "Starting HyperCapacity backend..."

if [ ! -d ".venv" ]; then
  echo "Virtual environment not found. Creating .venv..."
  python3 -m venv .venv
fi

source .venv/bin/activate

echo "Installing dependencies..."
python3 -m pip install -r requirements.txt

echo "Running API server at http://127.0.0.1:8000"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
