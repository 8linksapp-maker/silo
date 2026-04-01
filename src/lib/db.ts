import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface Silo {
  id: number;
  name: string;
  description: string;
  user_id: number;
  position: number;
  created_at: string;
}

export interface Keyword {
  id: number;
  text: string;
  search_volume: number;
  difficulty: number;
  type: 'primary' | 'secondary';
  silo_id: number | null;
  user_id: number;
  position: number;
  created_at: string;
}

// Singleton — survives HMR in dev
declare global {
  // eslint-disable-next-line no-var
  var __silo_db: Database.Database | undefined;
}

function getDb(): Database.Database {
  if (globalThis.__silo_db) return globalThis.__silo_db;

  const dataDir = join(process.cwd(), 'data');
  mkdirSync(dataDir, { recursive: true });

  const db = new Database(join(dataDir, 'silo.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS silos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT    DEFAULT '',
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      position    INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      text          TEXT    NOT NULL,
      search_volume INTEGER DEFAULT 0,
      difficulty    INTEGER DEFAULT 0,
      type          TEXT    CHECK(type IN ('primary','secondary')) DEFAULT 'secondary',
      silo_id       INTEGER REFERENCES silos(id) ON DELETE SET NULL,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      position      INTEGER DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin on first run
  const count = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c;
  if (count === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  }

  globalThis.__silo_db = db;
  return db;
}

// ── Users ──────────────────────────────────────────────────────────────────

export function getUserByUsername(username: string): User | undefined {
  return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
}

// ── Silos ──────────────────────────────────────────────────────────────────

export function getSilosByUser(userId: number): Silo[] {
  return getDb()
    .prepare('SELECT * FROM silos WHERE user_id = ? ORDER BY position, created_at')
    .all(userId) as Silo[];
}

export function createSilo(name: string, description: string, userId: number): Silo {
  const db = getDb();
  const maxPos = (db.prepare('SELECT COALESCE(MAX(position),0) AS m FROM silos WHERE user_id = ?').get(userId) as { m: number }).m;
  const info = db.prepare(
    'INSERT INTO silos (name, description, user_id, position) VALUES (?, ?, ?, ?)'
  ).run(name, description, userId, maxPos + 1);
  return db.prepare('SELECT * FROM silos WHERE id = ?').get(info.lastInsertRowid) as Silo;
}

export function updateSilo(id: number, userId: number, name: string, description: string): Silo | null {
  const db = getDb();
  db.prepare('UPDATE silos SET name = ?, description = ? WHERE id = ? AND user_id = ?')
    .run(name, description, id, userId);
  return db.prepare('SELECT * FROM silos WHERE id = ?').get(id) as Silo | null;
}

export function deleteSilo(id: number, userId: number): void {
  getDb().prepare('DELETE FROM silos WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Keywords ───────────────────────────────────────────────────────────────

export function getKeywordsByUser(userId: number): Keyword[] {
  return getDb()
    .prepare('SELECT * FROM keywords WHERE user_id = ? ORDER BY silo_id, position, created_at')
    .all(userId) as Keyword[];
}

export function createKeyword(
  userId: number,
  text: string,
  type: 'primary' | 'secondary',
  siloId: number | null,
  searchVolume: number,
  difficulty: number
): Keyword {
  const db = getDb();
  const info = db.prepare(
    'INSERT INTO keywords (text, type, silo_id, user_id, search_volume, difficulty) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(text, type, siloId, userId, searchVolume, difficulty);
  return db.prepare('SELECT * FROM keywords WHERE id = ?').get(info.lastInsertRowid) as Keyword;
}

export function updateKeyword(
  id: number,
  userId: number,
  data: Partial<Pick<Keyword, 'text' | 'type' | 'silo_id' | 'search_volume' | 'difficulty' | 'position'>>
): Keyword | null {
  const db = getDb();
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return db.prepare('SELECT * FROM keywords WHERE id = ?').get(id) as Keyword | null;

  const cols = entries.map(([k]) => `${k} = ?`).join(', ');
  const vals = entries.map(([, v]) => v);
  db.prepare(`UPDATE keywords SET ${cols} WHERE id = ? AND user_id = ?`).run([...vals, id, userId]);
  return db.prepare('SELECT * FROM keywords WHERE id = ?').get(id) as Keyword | null;
}

export function deleteKeyword(id: number, userId: number): void {
  getDb().prepare('DELETE FROM keywords WHERE id = ? AND user_id = ?').run(id, userId);
}

export function createKeywordsBulk(
  userId: number,
  items: Array<{ text: string; type: 'primary' | 'secondary'; search_volume: number; difficulty: number }>
): Keyword[] {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO keywords (text, type, user_id, search_volume, difficulty) VALUES (?, ?, ?, ?, ?)'
  );
  const insertAll = db.transaction((rows: typeof items) =>
    rows.map(r => {
      const info = stmt.run(r.text, r.type, userId, r.search_volume, r.difficulty);
      return db.prepare('SELECT * FROM keywords WHERE id = ?').get(info.lastInsertRowid) as Keyword;
    })
  );
  return insertAll(items);
}
