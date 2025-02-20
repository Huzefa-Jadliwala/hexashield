# web_server/scheduler/__init__.py
from web_server.scheduler.cve_scheduler import cve_scheduler_lifespan

__all__ = ["cve_scheduler_lifespan"]
