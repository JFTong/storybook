"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentConfigPanel } from "@/components/shared/AgentConfigPanel";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { AgentConfig, Character } from "@/types";
import { Sparkles, Loader2 } from "lucide-react";

export default function StoryPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [theme, setTheme] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({ type: "creative" });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projectRes, storyRes, charsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/story`),
        fetch(`/api/projects/${projectId}/characters`),
      ]);

      const projectData = await projectRes.json();
      const storyData = await storyRes.json();
      const charsData = await charsRes.json();

      setProjectTitle(projectData.project?.title || "");
      setCharacters(charsData.characters || []);

      if (storyData.story) {
        setTheme(storyData.story.theme || "");
        setStoryContent(storyData.story.content || "");
        setAgentConfig(storyData.story.agentConfig || { type: "creative" });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateStory = useCallback(async () => {
    if (!theme) return;

    setIsGenerating(true);
    try {
      const configRes = await fetch("/api/config/api-key", {
        headers: { "x-internal-request": "true" }
      });
      const config = await configRes.json();

      if (!config.apiKey) {
        alert("API key not configured. Please set it in Settings.");
        return;
      }

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: config.apiKey,
          model: config.model,
          theme,
          characters,
          agentConfig,
        }),
      });

      const data = await response.json();
      if (data.story) {
        setStoryContent(data.story);
      } else {
        alert(data.error || "Failed to generate story");
      }
    } catch (error) {
      console.error("Failed to generate story:", error);
      alert("Failed to generate story");
    } finally {
      setIsGenerating(false);
    }
  }, [theme, characters, agentConfig]);

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          content: storyContent,
          agentConfig,
        }),
      });
      router.push(`/projects/${projectId}/storyboard`);
    } catch (error) {
      console.error("Failed to save story:", error);
    } finally {
      setSaving(false);
    }
  };

  const canContinue = theme.trim().length > 0 && storyContent.trim().length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ProjectLayout
      projectId={projectId}
      projectTitle={projectTitle}
      title="Story"
      description="Write or generate your story content"
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
              config={agentConfig}
              onChange={setAgentConfig}
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
              rows={12}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tip: Write a complete story with clear scene breaks. Each scene will become a page in your book.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveAndContinue} disabled={!canContinue || saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue to Storyboard"
            )}
          </Button>
        </div>
      </div>
    </ProjectLayout>
  );
}