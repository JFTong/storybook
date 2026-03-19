import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Character, Story, GeneratedPage, AgentConfig, BookProject } from '@/types';

interface BookStore {
  // Setup
  apiKey: string;
  model: string;

  // Project
  currentProject: BookProject | null;
  savedProjects: BookProject[];

  // Agent Configs
  globalAgentConfig: AgentConfig;

  // Actions - Setup
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;

  // Actions - Characters
  addCharacter: (char: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  removeCharacter: (id: string) => void;
  setCharacterReferenceImage: (image: string | undefined) => void;

  // Actions - Story
  setStory: (story: Story) => void;
  updateStoryContent: (content: string) => void;
  updateStoryboard: (id: string, updates: Partial<Story['storyboards'][0]>) => void;
  addStoryboard: (storyboard: Story['storyboards'][0]) => void;
  removeStoryboard: (id: string) => void;

  // Actions - Pages
  addPage: (page: GeneratedPage) => void;
  updatePage: (id: string, updates: Partial<GeneratedPage>) => void;
  removePage: (id: string) => void;
  clearPages: () => void;

  // Actions - Projects
  createNewProject: (title?: string) => void;
  loadProject: (projectId: string) => void;
  saveCurrentProject: () => void;
  deleteProject: (projectId: string) => void;

  // Actions - Global Config
  setGlobalAgentConfig: (config: AgentConfig) => void;

  // Actions - Reset
  resetProject: () => void;
}

const createDefaultProject = (title: string = 'My Storybook'): BookProject => ({
  id: crypto.randomUUID(),
  title,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  characters: [],
  characterReferenceImage: undefined,
  story: null,
  pages: [],
});

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      // Initial state
      apiKey: '',
      model: 'gemini-3.1-flash-image-preview',
      currentProject: createDefaultProject(),
      savedProjects: [],
      globalAgentConfig: { type: 'creative' },

      // Setup actions
      setApiKey: (key) => set({ apiKey: key }),
      setModel: (model) => set({ model }),

      // Character actions
      addCharacter: (char) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                characters: [...state.currentProject.characters, char],
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      updateCharacter: (id, updates) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                characters: state.currentProject.characters.map((c) =>
                  c.id === id ? { ...c, ...updates } : c
                ),
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      removeCharacter: (id) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                characters: state.currentProject.characters.filter((c) => c.id !== id),
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      setCharacterReferenceImage: (image) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                characterReferenceImage: image,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      // Story actions
      setStory: (story) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                story,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      updateStoryContent: (content) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                story: state.currentProject.story
                  ? { ...state.currentProject.story, content }
                  : null,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      updateStoryboard: (id, updates) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                story: state.currentProject.story
                  ? {
                      ...state.currentProject.story,
                      storyboards: state.currentProject.story.storyboards.map((sb) =>
                        sb.id === id ? { ...sb, ...updates, edited: true } : sb
                      ),
                    }
                  : null,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      addStoryboard: (storyboard) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                story: state.currentProject.story
                  ? {
                      ...state.currentProject.story,
                      storyboards: [...state.currentProject.story.storyboards, storyboard],
                    }
                  : null,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      removeStoryboard: (id) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                story: state.currentProject.story
                  ? {
                      ...state.currentProject.story,
                      storyboards: state.currentProject.story.storyboards.filter(
                        (sb) => sb.id !== id
                      ),
                    }
                  : null,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      // Page actions
      addPage: (page) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                pages: [...state.currentProject.pages, page],
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      updatePage: (id, updates) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                pages: state.currentProject.pages.map((p) =>
                  p.id === id ? { ...p, ...updates } : p
                ),
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      removePage: (id) =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                pages: state.currentProject.pages.filter((p) => p.id !== id),
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      clearPages: () =>
        set((state) => ({
          currentProject: state.currentProject
            ? {
                ...state.currentProject,
                pages: [],
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      // Project actions
      createNewProject: (title) =>
        set({
          currentProject: createDefaultProject(title),
        }),

      loadProject: (projectId) => {
        const { savedProjects } = get();
        const project = savedProjects.find((p) => p.id === projectId);
        if (project) {
          set({ currentProject: project });
        }
      },

      saveCurrentProject: () => {
        const { currentProject, savedProjects } = get();
        if (!currentProject) return;

        const existingIndex = savedProjects.findIndex((p) => p.id === currentProject.id);
        let newProjects: BookProject[];

        if (existingIndex >= 0) {
          newProjects = [...savedProjects];
          newProjects[existingIndex] = {
            ...currentProject,
            updatedAt: new Date().toISOString(),
          };
        } else {
          newProjects = [
            ...savedProjects,
            { ...currentProject, updatedAt: new Date().toISOString() },
          ];
        }

        set({ savedProjects: newProjects });
      },

      deleteProject: (projectId) =>
        set((state) => ({
          savedProjects: state.savedProjects.filter((p) => p.id !== projectId),
        })),

      // Global config
      setGlobalAgentConfig: (config) => set({ globalAgentConfig: config }),

      // Reset
      resetProject: () => set({ currentProject: createDefaultProject() }),
    }),
    {
      name: 'storybook-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        model: state.model,
        currentProject: state.currentProject,
        savedProjects: state.savedProjects,
        globalAgentConfig: state.globalAgentConfig,
      }),
    }
  )
);