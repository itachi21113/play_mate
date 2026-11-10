import json
import os
from collections.abc import Generator

import bcrypt
from sqlalchemy import func
from sqlalchemy.engine import make_url
from sqlmodel import Session, SQLModel, create_engine, select

from backend.models import Message, Tournament, User

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./playmate.db")
database_url = make_url(DATABASE_URL)
if database_url.drivername in {"postgresql", "postgresql+psycopg"}:
    database_url = database_url.set(drivername="postgresql+psycopg2")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(database_url, connect_args=connect_args)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


PLAYERS = [
    ("rahul_gamer", "Rahul Gamer", "BGMI", ["bgmi", "valorant", "minecraft"], True, "images/avatars/rahul.jpg", "Online now", "Passionate gamer looking for new teammates and gaming friends.", "Let's squad up tonight!"),
    ("amit_pro", "Amit Pro", "Valorant", ["valorant", "cs2"], True, "images/avatars/amit.jpg", "Online now", "Duelist main. Always hunting for a fifth for ranked.", "Sounds good. See you at 8!"),
    ("sneha_plays", "Sneha Plays", "Minecraft", ["minecraft", "fortnite"], True, "images/avatars/sneha.jpg", "Online now", "Redstone nerd and survival server host.", "Awesome, I'll set it up tonight!"),
    ("karan_elite", "Karan Elite", "Free Fire", ["free-fire", "bgmi"], False, "images/avatars/karan.jpg", "Last seen today at 7:02 PM", "Rush player. Weekend scrims and custom rooms.", ""),
    ("rohanx", "RohanX", "BGMI", ["bgmi", "codm"], True, "", "Online now", "IGL for a small BGMI squad. Need good callouts.", "Nice, adding you to the lobby now."),
    ("priya_sniper", "Priya Sniper", "Valorant", ["valorant", "apex-legends"], True, "", "Online now", "Operator enjoyer. One shot, one reaction.", "gg, queue up!"),
    ("vikram_rush", "Vikram Rush", "Counter Strike 2", ["cs2", "valorant"], True, "", "Online now", "Entry fragger. Faceit level 8 grinder.", "Ready when you are."),
    ("ananya_builds", "Ananya Builds", "Minecraft", ["minecraft"], True, "", "Online now", "Mega builds and creative servers.", "Come check my new build!"),
    ("neha_ace", "Neha Ace", "Apex Legends", ["apex-legends", "fortnite"], True, "", "Online now", "Wraith main. Looking for a trio.", "Drop with us!"),
    ("arjun_clutch", "Arjun Clutch", "Call of Duty Mobile", ["codm", "bgmi", "free-fire"], True, "", "Online now", "Ranked grinder. 1v4 clutches are my thing.", "Let's go ranked."),
    ("simran_fn", "Simran FN", "Fortnite", ["fortnite", "minecraft"], True, "", "Online now", "Builder and box-fight lover.", "Zero build or build?"),
    ("dev_headshot", "Dev Headshot", "Free Fire", ["free-fire", "codm"], True, "", "Online now", "Headshots only. Custom room host.", "Joining now."),
    ("kabir_ops", "Kabir Ops", "Counter Strike 2", ["cs2", "codm"], False, "", "Last seen 2 hours ago", "AWPer on weekends.", ""),
    ("isha_loot", "Isha Loot", "Apex Legends", ["apex-legends", "valorant"], True, "", "Online now", "Always first to the loot room.", "Pinging you a loot spot."),
]

TOURNAMENTS = [
    ("t1", "BGMI Squad Showdown", "bgmi", "2026-11-21", "18:00", 50, 10000, 100, 64, "players", "upcoming", "Play-Mate Official", "rahul_gamer", "Squad-based BGMI tournament with 4 matches on Erangel and Miramar. Points are awarded for placement and kills."),
    ("t2", "Erangel Battle Cup", "bgmi", "2026-11-10", "16:00", 0, 5000, 100, 100, "players", "ongoing", "Rohan X", "rohanx", "Free-entry daily cup on Erangel. Matches are live right now, check the leaderboard after the final round."),
    ("t3", "Valorant Night Clash", "valorant", "2026-11-15", "20:00", 100, 15000, 32, 20, "teams", "upcoming", "Amit Pro", "amit_pro", "5v5 single-elimination bracket. Best of one until the semis, best of three for the final."),
    ("t4", "Radiant Cup Season 2", "valorant", "2026-10-18", "19:00", 150, 25000, 16, 16, "teams", "completed", "Play-Mate Official", "rahul_gamer", "Season 2 of the Radiant Cup has finished. Winners were crowned after a packed final on Ascent."),
    ("t5", "Block Builders Challenge", "minecraft", "2026-11-24", "17:00", 0, 2000, 50, 18, "players", "upcoming", "Sneha Plays", "sneha_plays", "Build the best themed structure in 2 hours. Judged on creativity, detail and use of redstone."),
    ("t6", "Free Fire Booyah Cup", "free-fire", "2026-11-18", "19:30", 30, 5000, 48, 40, "players", "upcoming", "Karan Elite", "karan_elite", "Solo custom-room tournament across three maps. Highest total points after three rounds wins."),
    ("t7", "Bermuda Rush Weekend", "free-fire", "2026-11-10", "15:00", 20, 2500, 48, 44, "players", "ongoing", "Dev Headshot", "dev_headshot", "Weekend rush event on Bermuda. Registrations are closed while matches are in progress."),
    ("t8", "CS2 5v5 Clash", "cs2", "2026-11-28", "21:00", 200, 20000, 16, 9, "teams", "upcoming", "Vikram Rush", "vikram_rush", "Competitive 5v5 on the active duty map pool. Teams are seeded by registration order."),
    ("t9", "Dust Masters Open", "cs2", "2026-10-25", "20:00", 100, 8000, 16, 16, "teams", "completed", "Kabir Ops", "kabir_ops", "An open bracket on classic maps. The event has concluded and results are final."),
    ("t10", "Apex Legends Trios", "apex-legends", "2026-11-22", "18:30", 0, 3000, 20, 11, "teams", "upcoming", "Neha Ace", "neha_ace", "Trios tournament with 6 lobbies. Points for placement and kills across all games."),
    ("t11", "Fortnite Victory Royale Cup", "fortnite", "2026-11-30", "19:00", 99, 6000, 100, 52, "players", "upcoming", "Simran FN", "simran_fn", "Solo cup with the Victory Royale format. Five matches, best three scores count."),
    ("t12", "CODM Ranked Rumble", "codm", "2026-11-17", "20:00", 50, 8000, 64, 30, "players", "upcoming", "Arjun Clutch", "arjun_clutch", "Multiplayer ranked-style knockout on Hardpoint and Search and Destroy."),
    ("t13", "Warzone Mobile Open", "codm", "2026-10-12", "18:00", 0, 4000, 64, 64, "players", "completed", "Play-Mate Official", "rahul_gamer", "Battle royale open event. Completed, with results announced on the community page."),
    ("t14", "Minecraft PvP Arena", "minecraft", "2026-11-10", "14:00", 0, 1500, 32, 32, "players", "ongoing", "Ananya Builds", "ananya_builds", "Bracket-style PvP arena fights. Spectating is open to everyone."),
]

CHAT_SEEDS = [
    ("amit_pro", [
        ("them", "Ready for tonight's Valorant match?", "7:58 PM", ""),
        ("me", "Yes bro, invite me at 8 PM.", "7:59 PM", "seen"),
        ("them", "Sure. We need one more player.", "8:01 PM", ""),
        ("me", "I'll ask Rahul Gamer.", "8:02 PM", "delivered"),
    ]),
    ("sneha_plays", [
        ("me", "Did you finish the new Minecraft map?", "7:40 PM", "seen"),
        ("them", "Almost! It looks amazing.", "7:44 PM", ""),
        ("them", "Let's start a Minecraft server.", "7:50 PM", ""),
    ]),
    ("karan_elite", [
        ("me", "What time does the Free Fire scrim begin?", "6:48 PM", "seen"),
        ("them", "Tournament starts at 8 PM.", "7:02 PM", ""),
    ]),
    ("rohanx", [
        ("them", "Need one more teammate for BGMI.", "5:12 PM", ""),
        ("me", "Count me in after dinner.", "5:20 PM", "delivered"),
    ]),
]


def seed_data(session: Session) -> None:
    for player_index, (
        username,
        full_name,
        fav_game,
        games,
        online,
        avatar,
        last_seen,
        bio,
        reply_hint,
    ) in enumerate(PLAYERS, start=1):
        is_admin = username == "rahul_gamer"
        session.add(
            User(
                username=username,
                full_name=full_name,
                email="demo@playmate.com" if is_admin else f"{username}@playmate.local",
                phone="9876543210" if is_admin else str(9100000000 + player_index),
                password_hash=bcrypt.hashpw(
                    b"Demo@123", bcrypt.gensalt()
                ).decode("ascii"),
                bio=bio,
                fav_game=fav_game,
                avatar=avatar,
                games_json=json.dumps(games),
                online=online,
                last_seen=last_seen,
                reply_hint=reply_hint,
                role="admin" if is_admin else "player",
            )
        )
    session.flush()

    for (
        tournament_id,
        name,
        game,
        date,
        time,
        fee,
        prize,
        max_slots,
        base_taken,
        unit,
        status,
        host,
        host_username,
        description,
    ) in TOURNAMENTS:
        session.add(
            Tournament(
                id=tournament_id,
                name=name,
                game=game,
                date=date,
                time=time,
                fee=fee,
                prize=prize,
                max_slots=max_slots,
                base_taken=base_taken,
                unit=unit,
                status=status,
                host=host,
                host_username=host_username,
                desc=description,
            )
        )

    for partner, messages in CHAT_SEEDS:
        for sender, text, time_label, message_status in messages:
            session.add(
                Message(
                    sender_username="rahul_gamer" if sender == "me" else partner,
                    receiver_username=partner if sender == "me" else "rahul_gamer",
                    text=text,
                    time_label=time_label,
                    status=message_status or "delivered",
                )
            )
    session.commit()


def init_db_and_seed(database_engine=None) -> None:
    target_engine = database_engine or engine
    SQLModel.metadata.create_all(target_engine)
    with Session(target_engine) as session:
        user_count = session.exec(select(func.count()).select_from(User)).one()
        if user_count == 0:
            seed_data(session)
