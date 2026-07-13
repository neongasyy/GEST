from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.groups import router as groups_router
from app.api.routes.expenses import router as expenses_router
from app.api.routes.balances import router as balances_router
from app.api.routes.settlements import router as settlements_router

app = FastAPI(title="GEST API")
app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(expenses_router)
app.include_router(balances_router)
app.include_router(settlements_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}
