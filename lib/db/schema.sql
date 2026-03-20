-- Global configuration (API Key, model selection, Feishu config)
CREATE TABLE IF NOT EXISTS global_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  api_key TEXT,
  model TEXT DEFAULT 'gemini-2.0-flash-exp',
  feishu_app_id TEXT,
  feishu_app_secret TEXT,
  feishu_enabled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Characters table (linked to projects)
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  style_description TEXT, -- 风格描述（可选）
  expressions TEXT, -- JSON array
  reference_image TEXT, -- base64
  generated_image TEXT, -- base64
  agent_config TEXT, -- JSON object
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Stories table (one story per project)
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  theme TEXT NOT NULL,
  content TEXT,
  agent_config TEXT, -- JSON object
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Storyboards table (linked to stories)
CREATE TABLE IF NOT EXISTS storyboards (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  scene TEXT,
  description TEXT,
  visual_prompt TEXT,
  shot_type TEXT DEFAULT 'medium',
  mood TEXT,
  edited INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- Generated images table (linked to storyboards)
CREATE TABLE IF NOT EXISTS generated_images (
  id TEXT PRIMARY KEY,
  storyboard_id TEXT NOT NULL,
  prompt TEXT,
  image_data TEXT, -- base64
  status TEXT DEFAULT 'pending', -- pending, generating, completed, error
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE
);

-- Character reference image for project (single shared reference)
CREATE TABLE IF NOT EXISTS project_reference_images (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  image_data TEXT, -- base64
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Feishu sync log
CREATE TABLE IF NOT EXISTS feishu_sync_log (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  document_id TEXT,
  operation TEXT, -- 'create', 'update', 'sync'
  status TEXT, -- 'success', 'failed'
  error_message TEXT,
  synced_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Feishu document mapping (project -> feishu document)
CREATE TABLE IF NOT EXISTS feishu_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  document_id TEXT NOT NULL,
  document_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);
CREATE INDEX IF NOT EXISTS idx_storyboards_story ON storyboards(story_id);
CREATE INDEX IF NOT EXISTS idx_images_storyboard ON generated_images(storyboard_id);
CREATE INDEX IF NOT EXISTS idx_feishu_log_project ON feishu_sync_log(project_id);