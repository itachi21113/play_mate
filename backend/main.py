from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.controllers.auth_controller import router as auth_router
from backend.controllers.bootstrap_controller import router as bootstrap_router
from backend.controllers.message_controller import router as message_router
from backend.controllers.tournament_controller import router as tournament_router
from backend.core.database import init_db_and_seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db_and_seed()
    yield


app = FastAPI(title="Play-Mate API", lifespan=lifespan)
app.include_router(bootstrap_router)
app.include_router(auth_router)
app.include_router(tournament_router)
app.include_router(message_router)
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
