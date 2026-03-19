// Agent Configuration Types
export type AgentType = 'creative' | 'detailed' | 'minimal' | 'custom';

export interface AgentConfig {
  type: AgentType;
  customPrompt?: string;
}

// Character Types
export interface Character {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
  };
  clothing: string;
  expressions: string[];
  referenceImage?: string; // base64
  generatedImage?: string; // base64
  agentConfig: AgentConfig;
}

// Story Types
export interface Storyboard {
  id: string;
  pageNumber: number;
  scene: string;
  description: string;
  visualPrompt: string;
  shotType: 'close-up' | 'medium' | 'wide';
  mood: string;
  edited: boolean;
}

export interface Story {
  id: string;
  theme: string;
  content: string;
  storyboards: Storyboard[];
  agentConfig: AgentConfig;
  storyboardAgentConfig: AgentConfig;
}

// Generated Page Types
export type PageStatus = 'pending' | 'generating' | 'completed' | 'error';

export interface GeneratedPage {
  id: string;
  storyboardId: string;
  prompt: string;
  imageUrl?: string; // base64
  status: PageStatus;
  retryCount: number;
  error?: string;
}

// Book Project Types (for backward compatibility with frontend)
export interface BookProject {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  characters: Character[];
  characterReferenceImage?: string;
  story: Story | null;
  pages: GeneratedPage[];
}

// ============ New Types for Database Architecture ============

// Global Configuration (Frontend view)
export interface GlobalConfigResponse {
  apiKey: string | null; // Masked
  hasApiKey: boolean;
  model: string;
  feishuAppId: string | null; // Masked
  hasFeishuAppId: boolean;
  hasFeishuAppSecret: boolean;
  feishuEnabled: boolean;
}

export interface GlobalConfigUpdate {
  apiKey?: string;
  model?: string;
  feishuAppId?: string;
  feishuAppSecret?: string;
  feishuEnabled?: boolean;
}

// Project (Database model)
export interface ProjectDB {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// Character (Database model)
export interface CharacterDB {
  id: string;
  projectId: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  clothing: string;
  expressions: string[]; // JSON parsed
  referenceImage?: string;
  generatedImage?: string;
  agentConfig: AgentConfig; // JSON parsed
  createdAt: string;
  updatedAt: string;
}

// Story (Database model)
export interface StoryDB {
  id: string;
  projectId: string;
  theme: string;
  content: string | null;
  agentConfig: AgentConfig; // JSON parsed
  createdAt: string;
  updatedAt: string;
}

// Storyboard (Database model)
export interface StoryboardDB {
  id: string;
  storyId: string;
  pageNumber: number;
  scene: string;
  description: string;
  visualPrompt: string;
  shotType: string;
  mood: string;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

// Generated Image (Database model)
export interface GeneratedImageDB {
  id: string;
  storyboardId: string;
  prompt: string | null;
  imageData: string | null;
  status: PageStatus;
  retryCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// Feishu Document
export interface FeishuDocumentDB {
  id: string;
  projectId: string;
  documentId: string;
  documentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Feishu Sync Log
export interface FeishuSyncLogDB {
  id: string;
  projectId: string;
  documentId: string | null;
  operation: 'create' | 'update' | 'sync';
  status: 'success' | 'failed';
  errorMessage: string | null;
  syncedAt: string;
}

// Full Project with all relations (for API response)
export interface ProjectWithRelations {
  project: ProjectDB;
  characters: CharacterDB[];
  characterReferenceImage?: string;
  story: (StoryDB & { storyboards: StoryboardDB[] }) | null;
  images: GeneratedImageDB[];
  feishuDocument?: FeishuDocumentDB;
}

// Pipeline Steps (Old - for backward compatibility)
export type PipelineStep = 'setup' | 'characters' | 'story' | 'generate' | 'preview';

export const PIPELINE_STEPS: { id: PipelineStep; label: string; path: string }[] = [
  { id: 'setup', label: 'Setup', path: '/setup' },
  { id: 'characters', label: 'Characters', path: '/characters' },
  { id: 'story', label: 'Story', path: '/story' },
  { id: 'generate', label: 'Generate', path: '/generate' },
  { id: 'preview', label: 'Preview', path: '/preview' },
];

// New Project Steps
export type ProjectStep = 'characters' | 'story' | 'storyboard' | 'preview';

export const PROJECT_STEPS: { id: ProjectStep; label: string; path: (projectId: string) => string }[] = [
  { id: 'characters', label: 'Characters', path: (id) => `/projects/${id}/characters` },
  { id: 'story', label: 'Story', path: (id) => `/projects/${id}/story` },
  { id: 'storyboard', label: 'Storyboard', path: (id) => `/projects/${id}/storyboard` },
  { id: 'preview', label: 'Preview', path: (id) => `/projects/${id}/preview` },
];

// API Response Types
export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

// Helper functions to convert between frontend and database models
export function characterToDB(char: Character, projectId: string): Omit<CharacterDB, 'createdAt' | 'updatedAt'> {
  return {
    id: char.id,
    projectId,
    name: char.name,
    description: char.description,
    primaryColor: char.colors.primary,
    secondaryColor: char.colors.secondary,
    clothing: char.clothing,
    expressions: char.expressions,
    referenceImage: char.referenceImage,
    generatedImage: char.generatedImage,
    agentConfig: char.agentConfig,
  };
}

export function characterFromDB(db: CharacterDB): Character {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    colors: {
      primary: db.primaryColor,
      secondary: db.secondaryColor,
    },
    clothing: db.clothing,
    expressions: db.expressions,
    referenceImage: db.referenceImage,
    generatedImage: db.generatedImage,
    agentConfig: db.agentConfig,
  };
}

export function storyboardFromDB(db: StoryboardDB): Storyboard {
  return {
    id: db.id,
    pageNumber: db.pageNumber,
    scene: db.scene,
    description: db.description,
    visualPrompt: db.visualPrompt,
    shotType: db.shotType as 'close-up' | 'medium' | 'wide',
    mood: db.mood,
    edited: db.edited,
  };
}

export function generatedImageFromDB(db: GeneratedImageDB): GeneratedPage {
  return {
    id: db.id,
    storyboardId: db.storyboardId,
    prompt: db.prompt || '',
    imageUrl: db.imageData || undefined,
    status: db.status as PageStatus,
    retryCount: db.retryCount,
    error: db.errorMessage || undefined,
  };
}