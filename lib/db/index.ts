import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { readFileSync } from 'fs';

// Database file path
const DB_PATH = path.join(process.cwd(), 'data', 'storybook.db');
const SCHEMA_PATH = path.join(process.cwd(), 'lib', 'db', 'schema.sql');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initializeDatabase(): void {
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  console.log('Database initialized successfully');
}

// Run initialization on import
initializeDatabase();

// Export database instance
export { db };

// Helper types
export interface GlobalConfig {
  id: number;
  api_key: string | null;
  model: string;
  feishu_app_id: string | null;
  feishu_app_secret: string | null;
  feishu_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  clothing: string;
  expressions: string; // JSON
  reference_image: string | null;
  generated_image: string | null;
  agent_config: string; // JSON
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  project_id: string;
  theme: string;
  content: string | null;
  agent_config: string; // JSON
  created_at: string;
  updated_at: string;
}

export interface Storyboard {
  id: string;
  story_id: string;
  page_number: number;
  scene: string;
  description: string;
  visual_prompt: string;
  shot_type: string;
  mood: string;
  edited: number;
  created_at: string;
  updated_at: string;
}

export interface GeneratedImage {
  id: string;
  storyboard_id: string;
  prompt: string | null;
  image_data: string | null;
  status: string;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeishuSyncLog {
  id: string;
  project_id: string;
  document_id: string | null;
  operation: string;
  status: string;
  error_message: string | null;
  synced_at: string;
}

export interface FeishuDocument {
  id: string;
  project_id: string;
  document_id: string;
  document_url: string | null;
  created_at: string;
  updated_at: string;
}

// Global Config operations
export const globalConfigOps = {
  get: (): GlobalConfig | undefined => {
    const stmt = db.prepare('SELECT * FROM global_config WHERE id = 1');
    return stmt.get() as GlobalConfig | undefined;
  },

  upsert: (config: Partial<Omit<GlobalConfig, 'id' | 'created_at' | 'updated_at'>>): void => {
    const existing = globalConfigOps.get();
    const now = new Date().toISOString();

    if (existing) {
      const stmt = db.prepare(`
        UPDATE global_config
        SET api_key = ?, model = ?, feishu_app_id = ?, feishu_app_secret = ?, feishu_enabled = ?, updated_at = ?
        WHERE id = 1
      `);
      stmt.run(
        config.api_key ?? existing.api_key,
        config.model ?? existing.model,
        config.feishu_app_id ?? existing.feishu_app_id,
        config.feishu_app_secret ?? existing.feishu_app_secret,
        config.feishu_enabled ?? existing.feishu_enabled,
        now
      );
    } else {
      const stmt = db.prepare(`
        INSERT INTO global_config (id, api_key, model, feishu_app_id, feishu_app_secret, feishu_enabled, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        config.api_key ?? null,
        config.model ?? 'gemini-2.0-flash-exp',
        config.feishu_app_id ?? null,
        config.feishu_app_secret ?? null,
        config.feishu_enabled ?? 0,
        now
      );
    }
  }
};

// Projects operations
export const projectsOps = {
  getAll: (): Project[] => {
    const stmt = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
    return stmt.all() as Project[];
  },

  getById: (id: string): Project | undefined => {
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    return stmt.get(id) as Project | undefined;
  },

  create: (id: string, title: string): Project => {
    const now = new Date().toISOString();
    const stmt = db.prepare('INSERT INTO projects (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)');
    stmt.run(id, title, now, now);
    return { id, title, created_at: now, updated_at: now };
  },

  update: (id: string, updates: { title?: string }): Project | undefined => {
    const project = projectsOps.getById(id);
    if (!project) return undefined;

    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE projects SET title = ?, updated_at = ? WHERE id = ?');
    stmt.run(updates.title ?? project.title, now, id);
    return { ...project, ...updates, updated_at: now };
  },

  delete: (id: string): boolean => {
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

// Characters operations
export const charactersOps = {
  getByProject: (projectId: string): Character[] => {
    const stmt = db.prepare('SELECT * FROM characters WHERE project_id = ? ORDER BY created_at');
    return stmt.all(projectId) as Character[];
  },

  getById: (id: string): Character | undefined => {
    const stmt = db.prepare('SELECT * FROM characters WHERE id = ?');
    return stmt.get(id) as Character | undefined;
  },

  create: (char: Omit<Character, 'created_at' | 'updated_at'>): Character => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO characters (id, project_id, name, description, primary_color, secondary_color, clothing, expressions, reference_image, generated_image, agent_config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      char.id, char.project_id, char.name, char.description,
      char.primary_color, char.secondary_color, char.clothing,
      char.expressions, char.reference_image, char.generated_image,
      char.agent_config, now, now
    );
    return { ...char, created_at: now, updated_at: now };
  },

  update: (id: string, updates: Partial<Omit<Character, 'id' | 'project_id' | 'created_at'>>): Character | undefined => {
    const char = charactersOps.getById(id);
    if (!char) return undefined;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.primary_color !== undefined) { fields.push('primary_color = ?'); values.push(updates.primary_color); }
    if (updates.secondary_color !== undefined) { fields.push('secondary_color = ?'); values.push(updates.secondary_color); }
    if (updates.clothing !== undefined) { fields.push('clothing = ?'); values.push(updates.clothing); }
    if (updates.expressions !== undefined) { fields.push('expressions = ?'); values.push(updates.expressions); }
    if (updates.reference_image !== undefined) { fields.push('reference_image = ?'); values.push(updates.reference_image); }
    if (updates.generated_image !== undefined) { fields.push('generated_image = ?'); values.push(updates.generated_image); }
    if (updates.agent_config !== undefined) { fields.push('agent_config = ?'); values.push(updates.agent_config); }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`UPDATE characters SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return { ...char, ...updates, updated_at: now };
  },

  delete: (id: string): boolean => {
    const stmt = db.prepare('DELETE FROM characters WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

// Stories operations
export const storiesOps = {
  getByProject: (projectId: string): Story | undefined => {
    const stmt = db.prepare('SELECT * FROM stories WHERE project_id = ?');
    return stmt.get(projectId) as Story | undefined;
  },

  getById: (id: string): Story | undefined => {
    const stmt = db.prepare('SELECT * FROM stories WHERE id = ?');
    return stmt.get(id) as Story | undefined;
  },

  create: (story: Omit<Story, 'created_at' | 'updated_at'>): Story => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO stories (id, project_id, theme, content, agent_config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(story.id, story.project_id, story.theme, story.content, story.agent_config, now, now);
    return { ...story, created_at: now, updated_at: now };
  },

  update: (id: string, updates: Partial<Omit<Story, 'id' | 'project_id' | 'created_at'>>): Story | undefined => {
    const story = storiesOps.getById(id);
    if (!story) return undefined;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.theme !== undefined) { fields.push('theme = ?'); values.push(updates.theme); }
    if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content); }
    if (updates.agent_config !== undefined) { fields.push('agent_config = ?'); values.push(updates.agent_config); }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`UPDATE stories SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return { ...story, ...updates, updated_at: now };
  },

  upsert: (story: Omit<Story, 'created_at' | 'updated_at'>): Story => {
    const existing = storiesOps.getByProject(story.project_id);
    if (existing) {
      return storiesOps.update(existing.id, {
        theme: story.theme,
        content: story.content,
        agent_config: story.agent_config
      })!;
    }
    return storiesOps.create(story);
  }
};

// Storyboards operations
export const storyboardsOps = {
  getByStory: (storyId: string): Storyboard[] => {
    const stmt = db.prepare('SELECT * FROM storyboards WHERE story_id = ? ORDER BY page_number');
    return stmt.all(storyId) as Storyboard[];
  },

  getById: (id: string): Storyboard | undefined => {
    const stmt = db.prepare('SELECT * FROM storyboards WHERE id = ?');
    return stmt.get(id) as Storyboard | undefined;
  },

  create: (storyboard: Omit<Storyboard, 'created_at' | 'updated_at'>): Storyboard => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO storyboards (id, story_id, page_number, scene, description, visual_prompt, shot_type, mood, edited, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      storyboard.id, storyboard.story_id, storyboard.page_number,
      storyboard.scene, storyboard.description, storyboard.visual_prompt,
      storyboard.shot_type, storyboard.mood, storyboard.edited ? 1 : 0,
      now, now
    );
    return { ...storyboard, created_at: now, updated_at: now };
  },

  update: (id: string, updates: Partial<Omit<Storyboard, 'id' | 'story_id' | 'created_at'>>): Storyboard | undefined => {
    const storyboard = storyboardsOps.getById(id);
    if (!storyboard) return undefined;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.page_number !== undefined) { fields.push('page_number = ?'); values.push(updates.page_number); }
    if (updates.scene !== undefined) { fields.push('scene = ?'); values.push(updates.scene); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.visual_prompt !== undefined) { fields.push('visual_prompt = ?'); values.push(updates.visual_prompt); }
    if (updates.shot_type !== undefined) { fields.push('shot_type = ?'); values.push(updates.shot_type); }
    if (updates.mood !== undefined) { fields.push('mood = ?'); values.push(updates.mood); }
    if (updates.edited !== undefined) { fields.push('edited = ?'); values.push(updates.edited ? 1 : 0); }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`UPDATE storyboards SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return { ...storyboard, ...updates, updated_at: now };
  },

  delete: (id: string): boolean => {
    const stmt = db.prepare('DELETE FROM storyboards WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  deleteByStory: (storyId: string): void => {
    const stmt = db.prepare('DELETE FROM storyboards WHERE story_id = ?');
    stmt.run(storyId);
  },

  createBatch: (storyboards: Omit<Storyboard, 'created_at' | 'updated_at'>[]): void => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO storyboards (id, story_id, page_number, scene, description, visual_prompt, shot_type, mood, edited, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((items: typeof storyboards) => {
      for (const sb of items) {
        stmt.run(
          sb.id, sb.story_id, sb.page_number,
          sb.scene, sb.description, sb.visual_prompt,
          sb.shot_type, sb.mood, sb.edited ? 1 : 0,
          now, now
        );
      }
    });
    insertMany(storyboards);
  }
};

// Generated Images operations
export const imagesOps = {
  getByStoryboard: (storyboardId: string): GeneratedImage | undefined => {
    const stmt = db.prepare('SELECT * FROM generated_images WHERE storyboard_id = ?');
    return stmt.get(storyboardId) as GeneratedImage | undefined;
  },

  getByStory: (storyId: string): GeneratedImage[] => {
    const stmt = db.prepare(`
      SELECT gi.* FROM generated_images gi
      JOIN storyboards sb ON gi.storyboard_id = sb.id
      WHERE sb.story_id = ?
      ORDER BY sb.page_number
    `);
    return stmt.all(storyId) as GeneratedImage[];
  },

  getById: (id: string): GeneratedImage | undefined => {
    const stmt = db.prepare('SELECT * FROM generated_images WHERE id = ?');
    return stmt.get(id) as GeneratedImage | undefined;
  },

  create: (image: Omit<GeneratedImage, 'created_at' | 'updated_at'>): GeneratedImage => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO generated_images (id, storyboard_id, prompt, image_data, status, retry_count, error_message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      image.id, image.storyboard_id, image.prompt, image.image_data,
      image.status, image.retry_count, image.error_message, now, now
    );
    return { ...image, created_at: now, updated_at: now };
  },

  update: (id: string, updates: Partial<Omit<GeneratedImage, 'id' | 'storyboard_id' | 'created_at'>>): GeneratedImage | undefined => {
    const image = imagesOps.getById(id);
    if (!image) return undefined;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.prompt !== undefined) { fields.push('prompt = ?'); values.push(updates.prompt); }
    if (updates.image_data !== undefined) { fields.push('image_data = ?'); values.push(updates.image_data); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.retry_count !== undefined) { fields.push('retry_count = ?'); values.push(updates.retry_count); }
    if (updates.error_message !== undefined) { fields.push('error_message = ?'); values.push(updates.error_message); }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`UPDATE generated_images SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return { ...image, ...updates, updated_at: now };
  },

  upsert: (image: Omit<GeneratedImage, 'created_at' | 'updated_at'>): GeneratedImage => {
    const existing = imagesOps.getByStoryboard(image.storyboard_id);
    if (existing) {
      return imagesOps.update(existing.id, {
        prompt: image.prompt,
        image_data: image.image_data,
        status: image.status,
        retry_count: image.retry_count,
        error_message: image.error_message
      })!;
    }
    return imagesOps.create(image);
  },

  delete: (id: string): boolean => {
    const stmt = db.prepare('DELETE FROM generated_images WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  deleteByStoryboard: (storyboardId: string): void => {
    const stmt = db.prepare('DELETE FROM generated_images WHERE storyboard_id = ?');
    stmt.run(storyboardId);
  }
};

// Project Reference Image operations
export const referenceImageOps = {
  getByProject: (projectId: string): { id: string; project_id: string; image_data: string | null } | undefined => {
    const stmt = db.prepare('SELECT * FROM project_reference_images WHERE project_id = ?');
    return stmt.get(projectId) as { id: string; project_id: string; image_data: string | null } | undefined;
  },

  upsert: (projectId: string, id: string, imageData: string | null): void => {
    const now = new Date().toISOString();
    const existing = referenceImageOps.getByProject(projectId);
    if (existing) {
      const stmt = db.prepare('UPDATE project_reference_images SET image_data = ?, updated_at = ? WHERE project_id = ?');
      stmt.run(imageData, now, projectId);
    } else {
      const stmt = db.prepare('INSERT INTO project_reference_images (id, project_id, image_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
      stmt.run(id, projectId, imageData, now, now);
    }
  },

  delete: (projectId: string): void => {
    const stmt = db.prepare('DELETE FROM project_reference_images WHERE project_id = ?');
    stmt.run(projectId);
  }
};

// Feishu operations
export const feishuOps = {
  getDocument: (projectId: string): FeishuDocument | undefined => {
    const stmt = db.prepare('SELECT * FROM feishu_documents WHERE project_id = ?');
    return stmt.get(projectId) as FeishuDocument | undefined;
  },

  createDocument: (doc: Omit<FeishuDocument, 'created_at' | 'updated_at'>): FeishuDocument => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO feishu_documents (id, project_id, document_id, document_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(doc.id, doc.project_id, doc.document_id, doc.document_url, now, now);
    return { ...doc, created_at: now, updated_at: now };
  },

  updateDocument: (projectId: string, updates: Partial<Pick<FeishuDocument, 'document_id' | 'document_url'>>): void => {
    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE feishu_documents SET document_id = ?, document_url = ?, updated_at = ? WHERE project_id = ?');
    stmt.run(updates.document_id, updates.document_url, now, projectId);
  },

  addSyncLog: (log: Omit<FeishuSyncLog, 'synced_at'>): void => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO feishu_sync_log (id, project_id, document_id, operation, status, error_message, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(log.id, log.project_id, log.document_id, log.operation, log.status, log.error_message, now);
  },

  getSyncLogs: (projectId: string, limit: number = 10): FeishuSyncLog[] => {
    const stmt = db.prepare('SELECT * FROM feishu_sync_log WHERE project_id = ? ORDER BY synced_at DESC LIMIT ?');
    return stmt.all(projectId, limit) as FeishuSyncLog[];
  }
};