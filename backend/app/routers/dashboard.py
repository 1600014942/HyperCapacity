from fastapi import APIRouter

from app.services.dashboard_service import build_dashboard_overview


router = APIRouter()


@router.get("/api/dashboard/overview")
def get_dashboard_overview():
    """
    HyperCapacity Dashboard V1 主接口。

    当前版本：
    - H100-SPOT：从 source_prices.json 计算中位数
    - H200-SPOT：从 source_prices.json 计算中位数
    - GPU-BASKET：由 H100 / H200 / A100 / B200 派生
    - H200/H100-PREMIUM：由 H200-SPOT / H100-SPOT 派生
    - ACU 指数：暂时沿用 mock，下一步改为 CSV 计算
    """
    return build_dashboard_overview()
