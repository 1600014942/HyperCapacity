from fastapi import APIRouter, HTTPException

from app.services.dashboard_service import (
    build_dashboard_overview,
    load_json,
    SOURCE_PRICES_PATH,
    INSTRUMENT_MASTER_PATH,
)
from app.services.acu_service import (
    compute_codefix_model_scores,
    compute_coding_usd_model_scores,
    compute_reasoning_model_scores,
)


router = APIRouter()


def find_card(symbol: str) -> dict:
    """
    从 /api/dashboard/overview 的结果中寻找某个 symbol 对应的卡片。
    """
    dashboard = build_dashboard_overview()

    for section in dashboard.get("sections", []):
        for card in section.get("cards", []):
            if card.get("symbol") == symbol:
                return card

    raise HTTPException(status_code=404, detail=f"Index not found: {symbol}")


def find_instrument(symbol: str) -> dict:
    """
    从 instrument_master.json 中寻找某个 symbol 的基础信息。
    """
    instruments = load_json(INSTRUMENT_MASTER_PATH)

    for item in instruments:
        if item.get("symbol") == symbol:
            return item

    raise HTTPException(status_code=404, detail=f"Instrument not found: {symbol}")


def source_records_for_gpu(gpu_model: str) -> list[dict]:
    """
    根据 GPU 型号返回 source_prices.json 中的来源记录。
    """
    records = load_json(SOURCE_PRICES_PATH)

    output = []
    for record in records:
        if record.get("gpu_model") != gpu_model:
            continue

        output.append({
            "provider": record.get("provider"),
            "gpu_model": record.get("gpu_model"),
            "gpu_variant": record.get("gpu_variant"),
            "price_usd_per_gpu_hour": record.get("price_usd_per_gpu_hour"),
            "region": record.get("region"),
            "availability": record.get("availability"),
            "pricing_type": record.get("pricing_type"),
            "market_type": record.get("market_type"),
            "include_in_index": record.get("include_in_index"),
            "data_mode": record.get("data_mode"),
            "captured_at": record.get("captured_at"),
            "source_url": record.get("source_url"),
        })

    return output


@router.get("/api/instruments")
def get_instruments():
    """
    返回 8 个上架标的的基础信息。
    """
    return {
        "items": load_json(INSTRUMENT_MASTER_PATH)
    }


@router.get("/api/indices/{symbol:path}/latest")
def get_index_latest(symbol: str):
    """
    返回某个指数的当前卡片数据。

    示例：
    /api/indices/H100-SPOT/latest
    /api/indices/ACU-CodeFix/latest
    /api/indices/H200/H100-PREMIUM/latest
    """
    card = find_card(symbol)

    return {
        "symbol": symbol,
        "latest": card.get("latest"),
        "unit": card.get("unit"),
        "secondary_unit": card.get("secondary_unit"),
        "change_24h_pct": card.get("change_24h_pct"),
        "change_7d_pct": card.get("change_7d_pct"),
        "confidence": card.get("confidence"),
        "data_mode": card.get("data_mode"),
        "status": card.get("status"),
        "last_updated": card.get("last_updated"),
        "last_checked": card.get("last_checked"),
        "card": card
    }


@router.get("/api/indices/{symbol:path}/sources")
def get_index_sources(symbol: str):
    """
    返回某个指数的数据来源。
    """
    card = find_card(symbol)

    if symbol == "H100-SPOT":
        sources = source_records_for_gpu("H100")

    elif symbol == "H200-SPOT":
        sources = source_records_for_gpu("H200")

    elif symbol == "GPU-BASKET":
        sources = {
            "calculation_type": "derived_basket",
            "components": [
                {
                    "component": "H100",
                    "linked_symbol": "H100-SPOT",
                    "sources": source_records_for_gpu("H100")
                },
                {
                    "component": "H200",
                    "linked_symbol": "H200-SPOT",
                    "sources": source_records_for_gpu("H200")
                },
                {
                    "component": "A100",
                    "linked_symbol": "A100-SPOT-INTERNAL",
                    "sources": source_records_for_gpu("A100")
                },
                {
                    "component": "B200",
                    "linked_symbol": "B200-SPOT-INTERNAL",
                    "sources": source_records_for_gpu("B200")
                }
            ]
        }

    elif symbol == "H200/H100-PREMIUM":
        sources = {
            "calculation_type": "derived_ratio",
            "formula": "H200-SPOT / H100-SPOT",
            "inputs": [
                "H100-SPOT",
                "H200-SPOT"
            ]
        }

    elif symbol == "ACU-CodeFix":
        sources = {
            "calculation_type": "benchmark_index",
            "primary_sources": [
                {
                    "name": "SWE-bench Verified",
                    "weight": 0.75,
                    "source_url": "https://www.swebench.com/verified.html"
                },
                {
                    "name": "Aider Polyglot Benchmark",
                    "weight": 0.25,
                    "source_url": "https://aider.chat/docs/leaderboards/"
                }
            ],
            "top_models": compute_codefix_model_scores()[:10]
        }

    elif symbol == "ACU-Coding/USD":
        sources = {
            "calculation_type": "cost_efficiency_index",
            "primary_sources": [
                {
                    "name": "Aider Polyglot empirical cost",
                    "priority": "P0",
                    "source_url": "https://aider.chat/docs/leaderboards/"
                },
                {
                    "name": "Official API pricing",
                    "priority": "P1",
                    "source_url": "provider official pricing pages"
                }
            ],
            "top_models": compute_coding_usd_model_scores()[:10]
        }

    elif symbol == "ACU-Reasoning":
        sources = {
            "calculation_type": "reasoning_benchmark_index",
            "primary_sources": [
                {
                    "name": "GPQA Diamond",
                    "weight": 0.35,
                    "source_url": "source URL recorded per model row"
                },
                {
                    "name": "AIME 2025 / 2024",
                    "weight": 0.35,
                    "source_url": "source URL recorded per model row"
                },
                {
                    "name": "LiveBench Reasoning / Math",
                    "weight": 0.30,
                    "source_url": "https://livebench.ai/"
                }
            ],
            "top_models": compute_reasoning_model_scores()[:10]
        }

    elif symbol == "ACU-CPI":
        sources = {
            "calculation_type": "weighted_geometric_mean",
            "formula": "1000 * product((Index_i / 1000) ^ adjusted_weight_i)",
            "inputs": card.get("components", [])
        }

    else:
        raise HTTPException(status_code=404, detail=f"Sources not configured for index: {symbol}")

    return {
        "symbol": symbol,
        "data_mode": card.get("data_mode"),
        "confidence": card.get("confidence"),
        "last_checked": card.get("last_checked"),
        "sources": sources
    }


@router.get("/api/indices/{symbol:path}/methodology")
def get_index_methodology(symbol: str):
    """
    返回某个指数的方法论说明。
    """
    instrument = find_instrument(symbol)
    card = find_card(symbol)

    return {
        "symbol": symbol,
        "display_name": instrument.get("display_name"),
        "category": instrument.get("category"),
        "type": instrument.get("type"),
        "unit": instrument.get("unit"),
        "data_mode": card.get("data_mode"),
        "confidence": card.get("confidence"),
        "methodology": card.get("methodology") or instrument.get("methodology"),
        "last_updated": card.get("last_updated"),
        "last_checked": card.get("last_checked")
    }
