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
        alert("API 密钥未配置，请前往设置页面配置");
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
        alert(data.error || "故事生成失败");
      }
    } catch (error) {
      console.error("Failed to generate story:", error);
      alert("故事生成失败");
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
      title="故事编写"
      description="编写或生成你的故事内容"
      currentStep="story"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>故事主题</CardTitle>
            <CardDescription>你的故事讲述什么内容？</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">主题</Label>
              <div className="flex gap-2">
                <Input
                  id="theme"
                  placeholder="例如：小兔子学习刷牙的重要性"
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
                      生成
                    </>
                  )}
                </Button>
              </div>
            </div>

            <AgentConfigPanel
              config={agentConfig}
              onChange={setAgentConfig}
              title="故事 Agent 设置"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>故事内容</CardTitle>
            <CardDescription>编写或生成你的故事文本</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={storyContent}
              onChange={(e) => setStoryContent(e.target.value)}
              placeholder="很久很久以前..."
              rows={12}
            />
            <p className="text-xs text-muted-foreground mt-2">
              提示：编写完整的故事并明确场景切换。每个场景将生成绘本中的一页。
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveAndContinue} disabled={!canContinue || saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "继续设计分镜"
            )}
          </Button>
        </div>
      </div>
    </ProjectLayout>
  );
}