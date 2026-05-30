import json
from pathlib import Path
from statistics import median
from datetime import datetime, timezone

from app.services.acu_service import build_acu_section


DATA_DIR = Path(__file__).resolve().parents[1] / "data"

SOURCE_PRICES_PATH = DATA_DIR / "source_prices.json"
INSTRUMENT_MASTER_PATH = DATA_DIR / "instrument_master.json"
MOCK_DASHBOARD_PATH = DATA_DIR / "dashboard_mock.json"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def get_instrument(symbol: str) -> dict:
    instruments = load_json(INSTRUMENT_MASTER_PATH)
    for item in instruments:
        if item["symbol"] == symbol:
            return item
    raise ValueError(f"Instrument not found: {symbol}")


def valid_price_records(gpu_model: str) -> list[dict]:
    records = load_json(SOURCE_PRICES_PATH)

    valid = []
    for record in records:
        if record.get("gpu_model") != gpu_model:
            continue

        if record.get("include_in_index") is not True:
            continue

        price = record.get("price_usd_per_gpu_hour")
        if not isinstance(price, (int, float)) or price <= 0:
            continue

        if not record.get("source_url"):
            continue

        valid.append(record)

    return valid


def compute_spot_price(gpu_model: str, symbol: str) -> dict:
    instrument = get_instrument(symbol)
    records = valid_price_records(gpu_model)

    if not records:
        latest = None
        source_count = 0
        providers = []
    else:
        prices = [r["price_usd_per_gpu_hour"] for r in records]
        latest = round(median(prices), 3)
        source_count = len(records)
        providers = sorted({r["provider"] for r in records})

    sparkline = make_sparkline(latest, mode="up") if latest else []

    return {
        "symbol": symbol,
        "display_name": instrument["display_name"],
        "category": instrument["category"],
        "type": instrument["type"],
        "latest": latest,
        "unit": instrument["unit"],
        "secondary_unit": instrument.get("secondary_unit"),
        "change_24h_pct": calc_change_24h(sparkline),
        "change_7d_pct": calc_change_7d(sparkline),
        "source_count": source_count,
        "confidence": instrument["confidence"],
        "data_mode": instrument["data_mode"],
        "status": "Checked",
        "primary_sources": providers,
        "methodology": instrument["methodology"],
        "last_updated": utc_now_iso(),
        "last_checked": utc_now_iso(),
        "sparkline": sparkline
    }


def compute_component_price(gpu_model: str) -> float | None:
    records = valid_price_records(gpu_model)
    if not records:
        return None
    prices = [r["price_usd_per_gpu_hour"] for r in records]
    return round(median(prices), 4)


def compute_gpu_basket(h100_latest: float | None, h200_latest: float | None) -> dict:
    instrument = get_instrument("GPU-BASKET")

    component_prices = {
        "H100": h100_latest,
        "H200": h200_latest,
        "A100": compute_component_price("A100"),
        "B200": compute_component_price("B200")
    }

    weights = {
        "H100": 0.50,
        "H200": 0.30,
        "A100": 0.10,
        "B200": 0.10
    }

    available = {
        name: price
        for name, price in component_prices.items()
        if isinstance(price, (int, float)) and price > 0
    }

    if not available:
        basket_price = None
        basket_index = None
        adjusted_weights = {}
    else:
        available_weight_sum = sum(weights[name] for name in available.keys())
        adjusted_weights = {
            name: weights[name] / available_weight_sum
            for name in available.keys()
        }
        basket_price = sum(available[name] * adjusted_weights[name] for name in available.keys())

        # V1 demo 基准值。后续应固定为某个基准日的 Basket Price。
        base_basket_price = 1.70
        basket_index = basket_price / base_basket_price * 1000

    latest = round(basket_index, 1) if basket_index else None
    basket_price_display = round(basket_price, 4) if basket_price else None
    sparkline = make_sparkline(latest, mode="up") if latest else []

    return {
        "symbol": "GPU-BASKET",
        "display_name": instrument["display_name"],
        "category": instrument["category"],
        "type": instrument["type"],
        "latest": latest,
        "unit": instrument["unit"],
        "secondary_unit": instrument.get("secondary_unit"),
        "basket_price_usd_per_gpu_hour": basket_price_display,
        "change_24h_pct": calc_change_24h(sparkline),
        "change_7d_pct": calc_change_7d(sparkline),
        "source_count": len(available),
        "confidence": instrument["confidence"],
        "data_mode": "derived",
        "status": "Updated",
        "components": [
            {
                "component": name,
                "price_usd_per_gpu_hour": component_prices[name],
                "original_weight": weights[name],
                "adjusted_weight": round(adjusted_weights.get(name, 0), 4)
            }
            for name in weights.keys()
        ],
        "methodology": instrument["methodology"],
        "last_updated": utc_now_iso(),
        "last_checked": utc_now_iso(),
        "sparkline": sparkline
    }


def compute_premium(h100_latest: float | None, h200_latest: float | None) -> dict:
    instrument = get_instrument("H200/H100-PREMIUM")

    if not h100_latest or not h200_latest or h100_latest <= 0:
        premium_ratio = None
        premium_pct = None
    else:
        premium_ratio = h200_latest / h100_latest
        premium_pct = (premium_ratio - 1) * 100

    latest = round(premium_ratio, 2) if premium_ratio else None
    sparkline = make_sparkline(latest, mode="flat") if latest else []

    return {
        "symbol": "H200/H100-PREMIUM",
        "display_name": instrument["display_name"],
        "category": instrument["category"],
        "type": instrument["type"],
        "latest": latest,
        "unit": instrument["unit"],
        "secondary_unit": f"+{premium_pct:.1f}% over H100" if premium_pct is not None else None,
        "change_24h_pct": calc_change_24h(sparkline),
        "change_7d_pct": calc_change_7d(sparkline),
        "source_count": 2 if premium_ratio else 0,
        "confidence": instrument["confidence"],
        "data_mode": "derived",
        "status": "Updated",
        "methodology": instrument["methodology"],
        "last_updated": utc_now_iso(),
        "last_checked": utc_now_iso(),
        "sparkline": sparkline
    }


def make_sparkline(latest: float, mode: str = "up") -> list[float]:
    if mode == "flat":
        factors = [1.03, 1.02, 1.01, 1.00, 1.01, 0.99, 1.00, 1.01, 1.00, 1.00]
    else:
        factors = [0.88, 0.90, 0.91, 0.93, 0.95, 0.96, 0.98, 0.985, 0.995, 1.00]

    return [round(latest * factor, 4) for factor in factors]


def calc_change_24h(values: list[float]) -> float | None:
    if len(values) < 2 or values[-2] == 0:
        return None
    return round((values[-1] / values[-2] - 1) * 100, 2)


def calc_change_7d(values: list[float]) -> float | None:
    if len(values) < 2 or values[0] == 0:
        return None
    return round((values[-1] / values[0] - 1) * 100, 2)


def make_history_from_sparkline(values: list[float]) -> list[dict]:
    dates = [
        "2026-05-21",
        "2026-05-22",
        "2026-05-23",
        "2026-05-24",
        "2026-05-25",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-05-30"
    ]
    return [{"date": d, "value": v} for d, v in zip(dates, values)]


def build_external_breakdown(gpu_basket_card: dict) -> list[dict]:
    components = gpu_basket_card.get("components", [])
    rows = []
    for component in components:
        adjusted_weight = component.get("adjusted_weight", 0)
        rows.append({
            "name": f"{component['component']} Spot",
            "value": round(adjusted_weight * 100, 1)
        })
    return rows


def build_dashboard_overview() -> dict:
    mock_dashboard = load_json(MOCK_DASHBOARD_PATH)

    h100_card = compute_spot_price("H100", "H100-SPOT")
    h200_card = compute_spot_price("H200", "H200-SPOT")
    gpu_basket_card = compute_gpu_basket(h100_card["latest"], h200_card["latest"])
    premium_card = compute_premium(h100_card["latest"], h200_card["latest"])

    external_section = {
        "id": "external_compute",
        "title": "External Compute Indices",
        "subtitle": "Demo-stage market data from public compute pricing sources.",
        "cards": [
            h100_card,
            h200_card,
            gpu_basket_card,
            premium_card
        ],
        "charts": {
            "h100_spot_history": make_history_from_sparkline(h100_card["sparkline"]),
            "h200_spot_history": make_history_from_sparkline(h200_card["sparkline"]),
            "gpu_basket_history": make_history_from_sparkline(gpu_basket_card["sparkline"]),
            "external_breakdown": build_external_breakdown(gpu_basket_card)
        }
    }

    acu_section = build_acu_section(mock_dashboard["sections"][1])

    return {
        "meta": {
            "project": "HyperCapacity",
            "dashboard": "AI Compute & ACU Dashboard",
            "version": "v1-demo",
            "currency": "USD",
            "last_updated": utc_now_iso(),
            "last_checked": utc_now_iso(),
            "auto_update": True,
            "default_range": "30D",
            "disclaimer": "External data uses public reference sources. Some historical series are simulated for demo purposes. Not for settlement."
        },
        "sections": [
            external_section,
            acu_section
        ]
    }
