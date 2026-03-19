"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentConfigPanel } from "@/components/shared/AgentConfigPanel";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useBookStore } from "@/lib/store";
import type { Story, Storyboard, AgentConfig } from "@/types";
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

const SHOT_TYPES = [
  { value: "close-up", label: "Close-up" },
  { value: "medium", label: "Medium Shot" },
  { value: "wide", label: "Wide Shot" },
];

function StoryboardEditor({
  storyboard,
  onUpdate,
  onDelete,
}: {
  storyboard: Storyboard;
  onUpdate: (id: string, updates: Partial<Storyboard>) => void;
  onDelete: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(!storyboard.edited);

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {storyboard.pageNumber}
            </span>
            <div>
              <CardTitle className="text-base">{storyboard.scene || "Untitled Scene"}</CardTitle>
              <CardDescription className="text-xs">
                {storyboard.shotType} | {storyboard.mood}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {storyboard.edited && (
              <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded">Edited</span>
            )}
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(storyboard.id); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Scene Title</Label>
            <Input
              value={storyboard.scene}
              onChange={(e) => onUpdate(storyboard.id, { scene: e.target.value })}
              placeholder="e.g., Pip discovers the messy tooth"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={storyboard.description}
              onChange={(e) => onUpdate(storyboard.id, { description: e.target.value })}
              placeholder="Describe what happens in this scene..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Visual Prompt</Label>
            <Textarea
              value={storyboard.visualPrompt}
              onChange={(e) => onUpdate(storyboard.id, { visualPrompt: e.target.value })}
              placeholder="Detailed prompt for image generation..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shot Type</Label>
              <select
                className="w-full border rounded-md p-2"
                value={storyboard.shotType}
                onChange={(e) => onUpdate(storyboard.id, { shotType: e.target.value as Storyboard["shotType"] })}
              >
                {SHOT_TYPES.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Mood</Label>
              <Input
                value={storyboard.mood}
                onChange={(e) => onUpdate(storyboard.id, { mood: e.target.value })}
                placeholder="e.g., warm, tense, joyful"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function StoryPage() {
  const router = useRouter();
  const {
    apiKey,
    model,
    currentProject,
    setStory,
    updateStoryboard,
    addStoryboard,
    removeStoryboard,
    globalAgentConfig,
  } = useBookStore();

  const [theme, setTheme] = useState(currentProject?.story?.theme || "");
  const [storyContent, setStoryContent] = useState(currentProject?.story?.content || "");
  const [storyAgentConfig, setStoryAgentConfig] = useState<AgentConfig>(
    currentProject?.story?.agentConfig || globalAgentConfig
  );
  const [storyboardAgentConfig, setStoryboardAgentConfig] = useState<AgentConfig>(
    currentProject?.story?.storyboardAgentConfig || globalAgentConfig
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);

  const storyboards = currentProject?.story?.storyboards || [];

  const generateStory = useCallback(async () => {
    if (!apiKey || !theme) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model,
          theme,
          characters: currentProject?.characters,
          agentConfig: storyAgentConfig,
        }),
      });

      const data = await response.json();
      if (data.story) {
        setStoryContent(data.story);
      }
    } catch (error) {
      console.error("Failed to generate story:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey, model, theme, currentProject?.characters, storyAgentConfig]);

  const generateStoryboard = useCallback(async () => {
    if (!apiKey || !storyContent) return;

    setIsGeneratingStoryboard(true);
    try {
      const response = await fetch("/api/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model,
          storyContent,
          characters: currentProject?.characters,
          agentConfig: storyboardAgentConfig,
        }),
      });

      const data = await response.json();
      if (data.storyboards) {
        const newStory: Story = {
          id: currentProject?.story?.id || crypto.randomUUID(),
          theme,
          content: storyContent,
          storyboards: data.storyboards.map((sb: Partial<Storyboard>, index: number) => ({
            id: crypto.randomUUID(),
            pageNumber: index + 1,
            scene: sb.scene || "",
            description: sb.description || "",
            visualPrompt: sb.visualPrompt || "",
            shotType: sb.shotType || "medium",
            mood: sb.mood || "",
            edited: false,
          })),
          agentConfig: storyAgentConfig,
          storyboardAgentConfig,
        };
        setStory(newStory);
      }
    } catch (error) {
      console.error("Failed to generate storyboard:", error);
    } finally {
      setIsGeneratingStoryboard(false);
    }
  }, [apiKey, model, storyContent, currentProject?.characters, storyboardAgentConfig, theme, storyAgentConfig, currentProject?.story?.id, setStory]);

  const handleAddStoryboard = () => {
    const newStoryboard: Storyboard = {
      id: crypto.randomUUID(),
      pageNumber: storyboards.length + 1,
      scene: "",
      description: "",
      visualPrompt: "",
      shotType: "medium",
      mood: "",
      edited: true,
    };
    addStoryboard(newStoryboard);
  };

  const handleContinue = () => {
    // Save story before navigating
    const story: Story = {
      id: currentProject?.story?.id || crypto.randomUUID(),
      theme,
      content: storyContent,
      storyboards,
      agentConfig: storyAgentConfig,
      storyboardAgentConfig,
    };
    setStory(story);
    router.push("/generate");
  };

  const canContinue = storyboards.length > 0;

  return (
    <PageLayout
      title="Story"
      description="Create your story and storyboards"
      currentStep="story"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Story Theme</CardTitle>
            <CardDescription>What is your story about?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <div className="flex gap-2">
                <Input
                  id="theme"
                  placeholder="e.g., A rabbit learns the importance of brushing teeth"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={generateStory} disabled={!theme || isGenerating}>
                  {isGenerating ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>

            <AgentConfigPanel
              config={storyAgentConfig}
              onChange={setStoryAgentConfig}
              title="Story Agent Settings"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Story Content</CardTitle>
            <CardDescription>Write or generate your story content</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={storyContent}
              onChange={(e) => setStoryContent(e.target.value)}
              placeholder="Once upon a time..."
              rows={8}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Storyboards</CardTitle>
                <CardDescription>Define each page/scene of your book</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generateStoryboard}
                  disabled={!storyContent || isGeneratingStoryboard}
                >
                  {isGeneratingStoryboard ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Auto-generate
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleAddStoryboard}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Page
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AgentConfigPanel
              config={storyboardAgentConfig}
              onChange={setStoryboardAgentConfig}
              title="Storyboard Agent Settings"
            />
          </CardContent>
        </Card>

        {storyboards.length > 0 && (
          <div className="space-y-4">
            {storyboards.map((sb) => (
              <StoryboardEditor
                key={sb.id}
                storyboard={sb}
                onUpdate={updateStoryboard}
                onDelete={removeStoryboard}
              />
            ))}
          </div>
        )}

        {storyboards.length === 0 && storyContent && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No storyboards yet. Click &quot;Auto-generate&quot; to create them from your story, or add manually.
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/characters")}>
            Back to Characters
          </Button>
          <Button onClick={handleContinue} disabled={!canContinue}>
            Continue to Generate
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}