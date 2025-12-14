from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://user:password@db:5432/consensus"

engine = create_async_engine(DATABASE_URL, echo=True, future=True)


async def init_db():
    retries = 5
    for i in range(retries):
        try:
            async with engine.begin() as conn:
                # await conn.run_sync(SQLModel.metadata.drop_all)
                await conn.run_sync(SQLModel.metadata.create_all)
            print("Database initialized successfully.")
            break
        except Exception as e:
            if i == retries - 1:
                print(f"Failed to connect to database after {retries} attempts.")
                raise e
            print(f"Database connection failed ({e}), retrying in {2**i} seconds...")
            import asyncio
            await asyncio.sleep(2**i)

async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
