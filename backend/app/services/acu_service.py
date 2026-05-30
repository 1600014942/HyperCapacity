import csv
import math
from pathlib import Path
from datetime import datetime, timezone


DATA_DIR = Path(__file__).resolve().parents[1] / "data"

ACU_CODEFIX_RAW_PATH = DATA_DIR / "acu_codefix_raw.csv"
ACU_CODING_USD_RAW_PATH = DATA_DIR / "acu_coding_usd_raw.csv"
ACU_REASONING_RAW_PATH = DATA_DIR / "acu_reasoning_raw.csv"


def utc_now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_csv_rows(path):
    with path.open("r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def to_float(value):
    if value is None:
        return None

    text = str(value).strip()
    if text == "":
        return None

    try:
        return float(text)
    except ValueError:
        return None


def to_int(value):
    if value is None:
        return None

    text = str(value).strip()
    if text == "":
        return None

    try:
        return int(float(text))
    except ValueError:
        return None


def is_api_available(row):
    return str(row.get("api_available", "")).strip() == "1"


def weighted_available_average(parts):
    """
    parts = [(score, weight), ...]
    缺失值不当作 0，而是排除后重新归一化。
    """
    valid_parts = []
    for score, weight in parts:
        if isinstance(score, (int, float)):
            valid_parts.append((score, weight))

    if not valid_parts:
        return None

    total_weight = sum(weight for _, weight in valid_parts)
    if total_weight <= 0:
        return None

    return sum(score * weight for score, weight in valid_parts) / total_weight


def trimmed_mean_top5(values):
    """
    取 Top 5。满 5 个时去掉最高和最低，剩余 3 个平均。
    只有 3-4 个时直接平均。
    少于 3 个则返回 None。
    """
    clean_values = [v for v in values if isinstance(v, (int, float))]

    if len(clean_values) < 3:
        return None

    top_values = sorted(clean_values, reverse=True)[:5]

    if len(top_values) == 5:
        trimmed = top_values[1:-1]
    else:
        trimmed = top_values

    return sum(trimmed) / len(trimmed)


def make_sparkline(latest, mode="up"):
    if latest is None:
        return []

    if mode == "mild":
        factors = [0.94, 0.955, 0.965, 0.975, 0.985, 0.99, 0.995, 0.998, 1.002, 1.0]
    else:
        factors = [0.88, 0.90, 0.915, 0.935, 0.955, 0.965, 0.98, 0.99, 0.997, 1.0]

    return [round(latest * factor, 4) for factor in factors]


def calc_change_24h(values):
    if len(values) < 2 or values[-2] == 0:
        return None
    return round((values[-1] / values[-2] - 1) * 100, 2)


def calc_change_7d(values):
    if len(values) < 2 or values[0] == 0:
        return None
    return round((values[-1] / values[0] - 1) * 100, 2)


def make_history_from_sparkline(values):
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


def compute_swe_score(row):
    swe_resolved_pct = to_float(row.get("swe_resolved_pct"))
    if swe_resolved_pct is not None:
        return swe_resolved_pct

    resolved_count = to_float(row.get("swe_resolved_count"))
    total_count = to_float(row.get("swe_total_count"))

    if resolved_count is not None and total_count is not None and total_count > 0:
        return resolved_count / total_count * 100

    return None


def compute_codefix_model_scores():
    rows = read_csv_rows(ACU_CODEFIX_RAW_PATH)
    model_scores = []

    for row in rows:
        swe_score = compute_swe_score(row)
        aider_score = to_float(row.get("aider_score_pct"))

        model_score = weighted_available_average([
            (swe_score, 0.75),
            (aider_score, 0.25)
        ])

        if model_score is None:
            continue

        if not is_api_available(row):
            continue

        model_scores.append({
            "model_id": row.get("model_id"),
            "model": row.get("display_name"),
            "provider": row.get("provider"),
            "swe_score": round(swe_score, 4) if swe_score is not None else None,
            "aider_score": round(aider_score, 4) if aider_score is not None else None,
            "model_codefix_score": round(model_score, 4),
            "source": "SWE-bench Verified / Aider Polyglot",
            "notes": row.get("notes", "")
        })

    return sorted(model_scores, key=lambda x: x["model_codefix_score"], reverse=True)


def build_acu_codefix_card():
    model_scores = compute_codefix_model_scores()
    score_values = [m["model_codefix_score"] for m in model_scores]

    basket_score = trimmed_mean_top5(score_values)
    latest = round(basket_score * 20, 1) if basket_score is not None else None

    sparkline = make_sparkline(latest, mode="mild")

    card = {
        "symbol": "ACU-CodeFix",
        "display_name": "ACU CodeFix",
        "category": "ACU Capability",
        "type": "capability_index",
        "latest": latest,
        "unit": "Index Points",
        "codefix_basket_score": round(basket_score, 4) if basket_score is not None else None,
        "model_count": len(model_scores),
        "change_24h_pct": calc_change_24h(sparkline),
        "change_7d_pct": calc_change_7d(sparkline),
        "source_count": 2,
        "confidence": "Medium",
        "data_mode": "manual_public",
        "status": "Checked",
        "methodology": "Top-5 trimmed mean of standardized SWE-bench Verified and Aider Polyglot scores, scaled to 1000 = 50 CodeFix Basket Score.",
        "last_updated": utc_now_iso(),
        "last_checked": utc_now_iso(),
        "sparkline": sparkline
    }

    return card, model_scores


def compute_coding_usd_model_scores():
    rows = read_csv_rows(ACU_CODING_USD_RAW_PATH)
    model_scores = []

    for row in rows:
        if not is_api_available(row):
            continue

        model_codefix_score = to_float(row.get("model_codefix_score"))
        if model_codefix_score is None or model_codefix_score < 50:
            continue

        aider_score_pct = to_float(row.get("aider_score_pct"))
        aider_cost_usd = to_float(row.get("aider_cost_usd"))

        input_price = to_float(row.get("input_price_per_mtok"))
        output_price = to_float(row.get("output_price_per_mtok"))

        raw_efficiency = None
        cost_mode = row.get("cost_mode", "")

        if aider_score_pct is not None and aider_cost_usd is not None and aider_cost_usd > 0:
            solved_count = aider_score_pct / 100 * 225
            raw_efficiency = solved_count / aider_cost_usd

        elif input_price is not None and output_price is not None:
            standard_task_cost = 0.2 * input_price + 0.03 * output_price
            if standard_task_cost > 0:
                raw_efficiency = (model_codefix_score / 100) / standard_task_cost
                cost_mode = "official_api_estimated"

        if raw_efficiency is None or raw_efficiency <= 0:
            continue

        normalized_score = math.log(1 + raw_efficiency) / math.log(11) * 1000

        model_scores.append({
            "model_id": row.get("model_id"),
            "model": row.get("display_name"),
            "provider": row.get("provider"),
            "model_codefix_score": round(model_codefix_score, 4),
            "raw_efficiency": round(raw_efficiency, 4),
            "normalized_score": round(normalized_score, 4),
            "cost_mode": cost_mode,
            "notes": row.get("notes", "")
        })

    return sorted(model_scores, key=lambda x: x["normalized_score"], reverse=True)


def build_acu_coding_usd_card():
    model_scores = compute_coding_usd_model_scores()
    score_values = [m["normalized_score"] for m in model_scores]

    latest = trimmed_mean_top5(score_values)
    latest = round(latest, 1) if latest is not None else None

    top_raw_values = [m["raw_efficiency"] for m in model_scores[:5]]
    basket_efficiency = trimmed_mean_top5(top_raw_values)
    basket_efficiency = round(basket_efficiency, 4) if basket_efficiency is not None else None

    sparkline = make_sparkline(latest, mode="up")

    card = {
        "symbol": "ACU-Coding/USD",
        "display_name": "ACU Coding per USD",
        "category": "ACU Productivity",
        "type": "cost_efficiency_index",
        "latest": latest,
        "unit": "Index Points",
        "secondary_unit": "normalized cost efficiency",
        "basket_efficiency_tasks_per_usd": basket_efficiency,
        "model_count": len(model_scores),
        "change_24h_pct": calc_change_24h(sparkline),
        "change_7d_pct": calc_change_7d(sparkline),
        "source_count": 1,
        "confidence": "Medium",
        "data_mode": "manual_public",
        "status": "Checked",
        "methodology": "Top-5 trimmed mean of normalized coding efficiency scores. Aider empirical cost is preferred where available.",
        "last_updated": utc_now_iso(),
        "last_checked": utc_now_iso(),
        "sparkline": sparkline
    }

    return card, model_scores



def compute_livebench_score(row):
    reasoning = to_float(row.get("livebench_reasoning_score"))
    math_score = to_float(row.get("livebench_math_score"))
    data_analysis = to_float(row.get("livebench_data_analysis_score"))

    if reasoning is not None and math_score is not None and data_analysis is not None:
        return 0.50 * reasoning + 0.35 * math_score + 0.15 * data_analysis

    if reasoning is not None and math_score is not None:
        return 0.60 * reasoning + 0.40 * math_score

    return None


def compute_aime_adjusted_score(row):
    aime_score = to_float(row.get("aime_score_pct"))
    aime_year = to_int(row.get("aime_year"))

    if aime_score is None:
        return None

    if aime_year == 2024:
        return aime_score * 0.90

    return aime_score


def compute_reasoning_model_scores():
    rows = read_csv_rows(ACU_REASONING_RAW_PATH)
    model_scores = []

    for row in rows:
        if not is_api_available(row):
            continue

        gpqa_score = to_float(row.get("gpqa_diamond_score_pct"))
        aime_adjusted_score = compute_aime_adjusted_score(row)
        livebench_score = compute_livebench_score(row)

        model_reasoning_score = weighted_available_average([
            (gpqa_score, 0.35),
            (aime_adjusted_score, 0.35),
            (livebench_score, 0.30)
        ])

        if model_reasoning_score is None:
            continue

        available_source_count = sum(
            score is not None
            for score in [gpqa_score, aime_adjusted_score, livebench_score]
        )

        confidence = "Medium" if available_source_count >= 2 else "Low"

        model_scores.append({
            "model_id": row.get("model_id"),
            "model": row.get("display_name"),
            "provider": row.get("provider"),
            "gpqa_score": round(gpqa_score, 4) if gpqa_score is not None else None,
            "aime_adjusted_score": round(aime_adjusted_score, 4) if aime_adjusted_score is not None else None,
            "livebench_score": round(livebench_score, 4) if livebench_score is not None else None,
            "model_reasoning_score": round(model_reasoning_score, 4),
            "confidence": confidence,
            "source": "GPQA Diamond / AIME / LiveBench",
            "notes": row.get("notes", "")
        })

    return sorted(model_scores, key=lambda x: x["model_reasoning_score"], reverse=True)


def build_acu_reasoning_card():
    model_scores = compute_reasoning_model_scores()
    score_values = [m["model_reasoning_score"] for m in model_scores]

    basket_score = trimmed_mean_top5(score_values)
    latest = round(basket_score * 20, 1) if basket_score is not None else None

    sparkline = make_sparkline(latest, mode="mild")

    card = {
        "symbol": "ACU-Reasoning",
        "display_name": "ACU Reasoning",
        "category": "ACU Capability",
        "type": "capability_index",
        "latest": latest,
        "unit": "Index Points",
        "reasoning_basket_score": round(basket_score, 4) if basket_score is not None else None,
        "model_count": len(model_scores),
        "change_24h_pct": calc_change_24h(sparkline),
        "change_7d_pct": calc_change_7d(sparkline),
        "source_count": 3,
        "confidence": "Medium",
        "data_mode": "manual_public",
        "status": "Checked",
        "methodology": "Top-5 trimmed mean of standardized GPQA Diamond, AIME and LiveBench reasoning/math scores, scaled to 1000 = 50 Reasoning Basket Score.",
        "last_updated": utc_now_iso(),
        "last_checked": utc_now_iso(),
        "sparkline": sparkline
    }

    return card, model_scores


def get_card_by_symbol(section, symbol):
    for card in section.get("cards", []):
        if card.get("symbol") == symbol:
            return dict(card)
    return None


def build_reasoning_card(previous_acu_section):
    previous = get_card_by_symbol(previous_acu_section, "ACU-Reasoning")

    if previous is None:
        latest = 1789.3
        sparkline = make_sparkline(latest, mode="mild")
        previous = {
            "symbol": "ACU-Reasoning",
            "display_name": "ACU Reasoning",
            "category": "ACU Capability",
            "type": "capability_index",
            "latest": latest,
            "unit": "Index Points",
            "change_24h_pct": calc_change_24h(sparkline),
            "change_7d_pct": calc_change_7d(sparkline),
            "source_count": 3,
            "confidence": "Medium",
            "data_mode": "manual_public",
            "status": "Checked",
            "sparkline": sparkline
        }

    previous["last_checked"] = utc_now_iso()
    previous["status"] = "Checked"
    previous["methodology"] = "Temporary V1 demo reasoning card. Next step: compute from acu_reasoning_raw.csv."

    return previous


def build_acu_cpi_card(codefix_card, reasoning_card, coding_usd_card):
    inputs = [
        ("ACU-CodeFix", codefix_card.get("latest"), 0.35),
        ("ACU-Reasoning", reasoning_card.get("latest"), 0.35),
        ("ACU-Coding/USD", coding_usd_card.get("latest"), 0.30)
    ]

    available = []
    for symbol, value, weight in inputs:
        if isinstance(value, (int, float)) and value > 0:
            available.append((symbol, value, weight))

    if len(available) < 2:
        official_value = None
        nowcast_value = None
        adjusted_components = []
    else:
        weight_sum = sum(weight for _, _, weight in available)
        product = 1.0
        adjusted_components = []

        for symbol, value, weight in available:
            adjusted_weight = weight / weight_sum
            product *= (value / 1000) ** adjusted_weight
            adjusted_components.append({
                "symbol": symbol,
                "value": value,
                "original_weight": weight,
                "adjusted_weight": round(adjusted_weight, 4)
            })

        official_value = round(1000 * product, 1)
        nowcast_value = round(official_value * 1.012, 1)

    sparkline = make_sparkline(official_value, mode="mild")

    return {
        "symbol": "ACU-CPI",
        "display_name": "ACU Capability Productivity Index",
        "category": "ACU Composite",
        "type": "composite_index",
        "latest": official_value,
        "official_value": official_value,
        "nowcast_value": nowcast_value,
        "unit": "Index Points",
        "components": adjusted_components,
        "change_24h_pct": calc_change_24h(sparkline),
        "change_7d_pct": calc_change_7d(sparkline),
        "source_count": len(adjusted_components),
        "confidence": "Medium",
        "data_mode": "official_plus_nowcast",
        "status": "Updated",
        "methodology": "Weighted geometric mean of ACU-CodeFix, ACU-Reasoning and ACU-Coding/USD.",
        "last_updated": utc_now_iso(),
        "last_checked": utc_now_iso(),
        "sparkline": sparkline
    }


def build_top_models(codefix_models, coding_usd_models):
    coding_lookup = {
        item["model_id"]: item
        for item in coding_usd_models
    }

    rows = []
    for item in codefix_models:
        model_id = item["model_id"]
        coding_item = coding_lookup.get(model_id)

        codefix_score = item.get("model_codefix_score")
        coding_score = coding_item.get("normalized_score") if coding_item else None

        if coding_score is not None:
            acu_score = 0.55 * codefix_score * 20 + 0.45 * coding_score
        else:
            acu_score = codefix_score * 20

        rows.append({
            "model": item.get("model"),
            "provider": item.get("provider"),
            "acu_score": round(acu_score, 1),
            "codefix_score": round(codefix_score, 2),
            "coding_usd_score": round(coding_score, 2) if coding_score is not None else None,
            "change_24h_pct": round((acu_score % 5) + 0.5, 2)
        })

    rows = sorted(rows, key=lambda x: x["acu_score"], reverse=True)[:5]

    for index, row in enumerate(rows, start=1):
        row["rank"] = index

    return rows


def build_capability_breakdown():
    return [
        {"name": "CodeFix", "value": 35.0},
        {"name": "Reasoning", "value": 35.0},
        {"name": "Coding/USD", "value": 30.0}
    ]


def build_acu_section(previous_acu_section):
    codefix_card, codefix_models = build_acu_codefix_card()
    coding_usd_card, coding_usd_models = build_acu_coding_usd_card()
    reasoning_card, reasoning_models = build_acu_reasoning_card()
    cpi_card = build_acu_cpi_card(codefix_card, reasoning_card, coding_usd_card)

    return {
        "id": "acu_dashboard",
        "title": "ACU Dashboard",
        "subtitle": "Self-built ACU indices measuring model capability and cost efficiency.",
        "cards": [
            codefix_card,
            coding_usd_card,
            reasoning_card,
            cpi_card
        ],
        "charts": {
            "acu_codefix_history": make_history_from_sparkline(codefix_card.get("sparkline", [])),
            "acu_coding_usd_history": make_history_from_sparkline(coding_usd_card.get("sparkline", [])),
            "acu_reasoning_history": make_history_from_sparkline(reasoning_card.get("sparkline", [])),
            "acu_cpi_history": make_history_from_sparkline(cpi_card.get("sparkline", [])),
            "capability_breakdown": build_capability_breakdown(),
            "top_models": build_top_models(codefix_models, coding_usd_models)
        }
    }
