from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.dashboard import router as dashboard_router
from app.routers.indices import router as indices_router


app = FastAPI(
    title="HyperCapacity API",
    version="0.1.0",
    description="Backend API for HyperCapacity AI Compute & ACU Dashboard V1 Demo.",
)

# 开发阶段先允许所有前端访问，方便本地联调。
# 正式上线时再改成指定前端域名。
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "HyperCapacity API",
        "status": "ok",
        "version": "0.1.0"
    }


app.include_router(dashboard_router)
app.include_router(indices_router)
