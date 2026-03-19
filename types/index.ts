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

// Book Project Types
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

// Pipeline Steps
export type PipelineStep = 'setup' | 'characters' | 'story' | 'generate' | 'preview';

export const PIPELINE_STEPS: { id: PipelineStep; label: string; path: string }[] = [
  { id: 'setup', label: 'Setup', path: '/setup' },
  { id: 'characters', label: 'Characters', path: '/characters' },
  { id: 'story', label: 'Story', path: '/story' },
  { id: 'generate', label: 'Generate', path: '/generate' },
  { id: 'preview', label: 'Preview', path: '/preview' },
];