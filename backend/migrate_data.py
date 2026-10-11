import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.db.database import (
    TranscriptDocument, TranscriptChunk,
    UserModel, SessionModel, MessageModel, ArtifactModel,
    init_db
)

def migrate_sqlite_to_postgres():
    sqlite_conn = sqlite3.connect("data/lenny_growth.db")
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    pg_engine = create_engine("postgresql+psycopg://postgres:postgres@localhost:5432/lenny_growth")
    init_db(pg_engine)
    PgSession = sessionmaker(bind=pg_engine)
    pg_session = PgSession()

    try:
        # 1. Migrate transcript documents
        doc_rows = sqlite_cursor.execute("SELECT * FROM transcript_documents").fetchall()
        print(f"Migrating {len(doc_rows)} transcript documents...")
        for r in doc_rows:
            existing = pg_session.query(TranscriptDocument).filter(TranscriptDocument.id == r["id"]).first()
            if not existing:
                doc = TranscriptDocument(
                    id=r["id"],
                    title=r["title"],
                    doc_type=r["doc_type"],
                    guest=r["guest"],
                    date=r["date"],
                    post_url=r["post_url"],
                    file_path=r["file_path"],
                    word_count=r["word_count"]
                )
                pg_session.add(doc)
        pg_session.commit()

        # 2. Migrate transcript chunks
        chunk_rows = sqlite_cursor.execute("SELECT * FROM transcript_chunks").fetchall()
        print(f"Migrating {len(chunk_rows)} transcript chunks...")
        batch = []
        for i, r in enumerate(chunk_rows):
            existing = pg_session.query(TranscriptChunk).filter(TranscriptChunk.id == r["id"]).first()
            if not existing:
                chunk = TranscriptChunk(
                    id=r["id"],
                    document_id=r["document_id"],
                    chunk_index=r["chunk_index"],
                    speaker=r["speaker"],
                    timestamp=r["timestamp"],
                    content=r["content"],
                    embedding_json=r["embedding_json"]
                )
                batch.append(chunk)
            if len(batch) >= 500:
                pg_session.bulk_save_objects(batch)
                pg_session.commit()
                batch = []
        if batch:
            pg_session.bulk_save_objects(batch)
            pg_session.commit()

        # 3. Migrate users
        try:
            user_rows = sqlite_cursor.execute("SELECT * FROM users").fetchall()
            print(f"Migrating {len(user_rows)} users...")
            for r in user_rows:
                existing = pg_session.query(UserModel).filter(UserModel.id == r["id"]).first()
                if not existing:
                    u = UserModel(
                        id=r["id"],
                        email=r["email"],
                        hashed_password=r["hashed_password"],
                        display_name=r["display_name"]
                    )
                    pg_session.add(u)
            pg_session.commit()
        except sqlite3.OperationalError:
            pass

        # 4. Migrate sessions
        try:
            sess_rows = sqlite_cursor.execute("SELECT * FROM sessions").fetchall()
            print(f"Migrating {len(sess_rows)} sessions...")
            for r in sess_rows:
                existing = pg_session.query(SessionModel).filter(SessionModel.id == r["id"]).first()
                if not existing:
                    uid = r["user_id"] if "user_id" in r.keys() else None
                    s = SessionModel(
                        id=r["id"],
                        title=r["title"],
                        user_id=uid
                    )
                    pg_session.add(s)
            pg_session.commit()
        except sqlite3.OperationalError:
            pass

        # 5. Migrate artifacts
        try:
            art_rows = sqlite_cursor.execute("SELECT * FROM artifacts").fetchall()
            print(f"Migrating {len(art_rows)} artifacts...")
            for r in art_rows:
                existing = pg_session.query(ArtifactModel).filter(ArtifactModel.id == r["id"]).first()
                if not existing:
                    uid = r["user_id"] if "user_id" in r.keys() else None
                    sid = r["session_id"] if "session_id" in r.keys() else None
                    a = ArtifactModel(
                        id=r["id"],
                        session_id=sid,
                        user_id=uid,
                        title=r["title"],
                        content_type=r["content_type"],
                        content=r["content"]
                    )
                    pg_session.add(a)
            pg_session.commit()
        except sqlite3.OperationalError:
            pass

        total_docs = pg_session.query(TranscriptDocument).count()
        total_chunks = pg_session.query(TranscriptChunk).count()
        print(f"Migration completed successfully! PostgreSQL now contains {total_docs} documents and {total_chunks} chunks.")

    finally:
        pg_session.close()
        sqlite_conn.close()

if __name__ == "__main__":
    migrate_sqlite_to_postgres()
