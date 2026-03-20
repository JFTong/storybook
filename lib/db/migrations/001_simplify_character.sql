-- 迁移版本: 001
-- 描述: 简化 Character 表结构,移除 primary_color、secondary_color、clothing 字段

-- 备份现有数据
CREATE TABLE IF NOT EXISTS characters_backup AS SELECT * FROM characters;

-- 创建新的 characters 表
CREATE TABLE characters_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  style_description TEXT,
  expressions TEXT,
  reference_image TEXT,
  generated_image TEXT,
  agent_config TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 迁移数据(移除 primary_color、secondary_color、clothing 字段)
INSERT INTO characters_new 
SELECT 
  id, 
  project_id, 
  name, 
  description, 
  NULL as style_description,
  expressions, 
  reference_image, 
  generated_image, 
  agent_config,
  created_at, 
  updated_at
FROM characters;

-- 删除旧表
DROP TABLE characters;

-- 重命名新表
ALTER TABLE characters_new RENAME TO characters;

-- 重建索引
CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);
