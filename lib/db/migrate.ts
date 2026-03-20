import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

const DB_PATH = path.join(process.cwd(), "data", "storybook.db");
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

// 确保 schema_version 表存在
function ensureVersionTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

// 获取当前数据库版本
export function getCurrentVersion(db: Database.Database): number {
  ensureVersionTable(db);
  
  const result = db.prepare("SELECT MAX(version) as version FROM schema_version").get() as { version: number | null };
  return result.version ?? 0;
}

// 获取所有可用的迁移脚本
function getAvailableMigrations(): { version: number; path: string }[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .map((file) => {
      const match = file.match(/^(\d+)_/);
      if (!match) return null;
      
      return {
        version: parseInt(match[1], 10),
        path: path.join(MIGRATIONS_DIR, file),
      };
    })
    .filter((m): m is { version: number; path: string } => m !== null)
    .sort((a, b) => a.version - b.version);
}

// 执行单个迁移
function applyMigration(db: Database.Database, version: number, sqlPath: string) {
  console.log(`正在应用迁移 ${version}...`);
  
  const sql = fs.readFileSync(sqlPath, "utf-8");
  
  db.transaction(() => {
    db.exec(sql);
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(version);
  })();
  
  console.log(`迁移 ${version} 完成`);
}

// 运行所有待执行的迁移
export function runMigrations(dbPath: string = DB_PATH): void {
  const db = new Database(dbPath);
  
  try {
    const currentVersion = getCurrentVersion(db);
    const migrations = getAvailableMigrations();
    
    const pending = migrations.filter((m) => m.version > currentVersion);
    
    if (pending.length === 0) {
      console.log("数据库已是最新版本");
      return;
    }
    
    console.log(`发现 ${pending.length} 个待执行迁移`);
    
    for (const migration of pending) {
      applyMigration(db, migration.version, migration.path);
    }
    
    console.log("所有迁移已完成");
  } finally {
    db.close();
  }
}

// 如果直接运行此脚本,则执行迁移
if (require.main === module) {
  runMigrations();
}
