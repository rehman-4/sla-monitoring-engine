from fastapi import APIRouter
from app.api.v1.overview import router as overview_router
from app.api.v1.services import router as services_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.slis import router as slis_router
from app.api.v1.slos import router as slos_router
from app.api.v1.slas import router as slas_router
from app.api.v1.monitors import router as monitors_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.simulation import router as simulation_router
from app.api.v1.logs import router as logs_router
from app.api.v1.traces import router as traces_router
from app.api.v1.dashboards import router as dashboards_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.search import router as search_router

api_router = APIRouter()

api_router.include_router(overview_router, prefix="/overview", tags=["Overview"])
api_router.include_router(services_router, prefix="/services", tags=["Services"])
api_router.include_router(metrics_router, prefix="/metrics", tags=["Metrics"])
api_router.include_router(slis_router, prefix="/slis", tags=["SLIs"])
api_router.include_router(slos_router, prefix="/slos", tags=["SLOs"])
api_router.include_router(slas_router, prefix="/slas", tags=["SLAs"])
api_router.include_router(monitors_router, prefix="/monitors", tags=["Monitors"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(incidents_router, prefix="/incidents", tags=["Incidents"])
api_router.include_router(simulation_router, prefix="/simulation", tags=["Simulation"])
api_router.include_router(logs_router, prefix="/logs", tags=["Logs"])
api_router.include_router(traces_router, prefix="/traces", tags=["Traces"])
api_router.include_router(dashboards_router, prefix="/dashboards", tags=["Dashboards"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(search_router, prefix="/search", tags=["Search"])
