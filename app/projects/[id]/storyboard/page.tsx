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
import type { AgentConfig, Storyboard, Character } from "@/types";
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Image as ImageIcon, Loader2, Check, RefreshCw } from "lucide-react";

const SHOT_TYPES = [
  { value: "close-up", label: "特写" },
  { value: "medium", label: "中景" },
  { value: "wide", label: "全景" },
];

interface StoryboardWithImage extends Storyboard {
  image?: {
    id: string;
    imageData: string | null;
    status: string;
  } | null;
}

function StoryboardCard({
  storyboard,
  onUpdate,
  onDelete,
  onGenerateImage,
  isGeneratingImage,
}: {
  storyboard: StoryboardWithImage;
  onUpdate: (id: string, updates: Partial<Storyboard>) => void;
  onDelete: (id: string) => void;
  onGenerateImage: (id: string) => void;
  isGeneratingImage: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(!storyboard.edited);
  const hasImage = storyboard.image?.imageData;
  const isComplete = hasImage && storyboard.image?.status === "completed";
  const isPending = !storyboard.image || storyboard.image.status === "pending";

  return (
    <Card className={isComplete ? "border-green-200" : ""}>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {storyboard.pageNumber}
            </span>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{storyboard.scene || "未命名场景"}</CardTitle>
              <CardDescription className="text-xs">
                {storyboard.shotType} | {storyboard.mood}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isComplete && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                <Check className="h-3 w-3" />
                已生成
              </span>
            )}
            {storyboard.image?.status === "generating" && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                生成中
              </span>
            )}
            {storyboard.edited && !isComplete && (
              <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded">已编辑</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onGenerateImage(storyboard.id);
              }}
              disabled={isGeneratingImage}
            >
              {isGeneratingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasImage ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重新生成
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-1" />
                  生成图片
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(storyboard.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Image Preview */}
          {hasImage && (
            <div className="mb-4">
              <img
                src={`data:image/jpeg;base64,${storyboard.image!.imageData}`}
                alt={storyboard.scene}
                className="max-w-full h-auto rounded-lg border max-h-64"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>场景标题</Label>
            <Input
              value={storyboard.scene}
              onChange={(e) => onUpdate(storyboard.id, { scene: e.target.value })}
              placeholder="例如：皮普发现了脏兮兮的牙齿"
            />
          </div>
          <div className="space-y-2">
            <Label>场景描述</Label>
            <Textarea
              value={storyboard.description}
              onChange={(e) => onUpdate(storyboard.id, { description: e.target.value })}
              placeholder="描述这个场景中发生了什么..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>视觉提示词</Label>
            <Textarea
              value={storyboard.visualPrompt}
              onChange={(e) => onUpdate(storyboard.id, { visualPrompt: e.target.value })}
              placeholder="用于图片生成的详细描述..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>镜头类型</Label>
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
              <Label>氛围</Label>
              <Input
                value={storyboard.mood}
                onChange={(e) => onUpdate(storyboard.id, { mood: e.target.value })}
                placeholder="例如：温暖、紧张、欢乐"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function StoryboardPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterReferenceImage, setCharacterReferenceImage] = useState<string | undefined>();
  const [storyContent, setStoryContent] = useState("");
  const [storyId, setStoryId] = useState<string | null>(null);
  const [storyboards, setStoryboards] = useState<StoryboardWithImage[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({ type: "creative" });
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projectRes, storyRes, charsRes, storyboardRes, refRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/story`),
        fetch(`/api/projects/${projectId}/characters`),
        fetch(`/api/projects/${projectId}/storyboard`),
        fetch(`/api/projects/${projectId}/reference-image`),
      ]);

      const projectData = await projectRes.json();
      const storyData = await storyRes.json();
      const charsData = await charsRes.json();
      const storyboardData = await storyboardRes.json();
      const refData = await refRes.json();

      setProjectTitle(projectData.project?.title || "");
      setCharacters(charsData.characters || []);
      setCharacterReferenceImage(refData.referenceImage || undefined);

      if (storyData.story) {
        setStoryContent(storyData.story.content || "");
        setStoryId(storyData.story.id);
        setAgentConfig(storyData.story.agentConfig || { type: "creative" });
      }

      if (storyboardData.storyboards) {
        setStoryboards(storyboardData.storyboards);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateStoryboard = useCallback(async () => {
    if (!storyContent) {
      alert("请先创建故事");
      return;
    }

    setIsGeneratingStoryboard(true);
    try {
      const configRes = await fetch("/api/config/api-key", {
        headers: { "x-internal-request": "true" }
      });
      const config = await configRes.json();

      if (!config.apiKey) {
        alert("API 密钥未配置，请前往设置页面配置");
        return;
      }

      const response = await fetch("/api/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: config.apiKey,
          model: config.model,
          storyContent,
          characters,
          agentConfig,
        }),
      });

      const data = await response.json();
      if (data.storyboards) {
        const newStoryboards = data.storyboards.map((sb: Partial<Storyboard>, index: number) => ({
          id: crypto.randomUUID(),
          pageNumber: index + 1,
          scene: sb.scene || "",
          description: sb.description || "",
          visualPrompt: sb.visualPrompt || "",
          shotType: sb.shotType || "medium",
          mood: sb.mood || "",
          edited: false,
        }));

        // Save to database
        await fetch(`/api/projects/${projectId}/storyboard`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyboards: newStoryboards }),
        });

        fetchData();
      } else {
        alert(data.error || "分镜生成失败");
      }
    } catch (error) {
      console.error("Failed to generate storyboard:", error);
      alert("分镜生成失败");
    } finally {
      setIsGeneratingStoryboard(false);
    }
  }, [projectId, storyContent, characters, agentConfig]);

  const handleAddStoryboard = async () => {
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

    const response = await fetch(`/api/projects/${projectId}/storyboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyboards: [...storyboards, newStoryboard] }),
    });

    if (response.ok) {
      fetchData();
    }
  };

  const handleUpdateStoryboard = async (id: string, updates: Partial<Storyboard>) => {
    setStoryboards(prev =>
      prev.map(sb => sb.id === id ? { ...sb, ...updates, edited: true } : sb)
    );

    await fetch(`/api/projects/${projectId}/storyboard`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyboardId: id, updates: { ...updates, edited: true } }),
    });
  };

  const handleDeleteStoryboard = async (id: string) => {
    if (!confirm("确定要删除这个分镜吗？")) return;

    // Note: In a real implementation, you'd have a DELETE endpoint for individual storyboards
    const updated = storyboards.filter(sb => sb.id !== id);
    await fetch(`/api/projects/${projectId}/storyboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyboards: updated }),
    });
    fetchData();
  };

  const handleGenerateImage = async (storyboardId: string) => {
    const storyboard = storyboards.find(sb => sb.id === storyboardId);
    if (!storyboard) return;

    setGeneratingImageId(storyboardId);

    try {
      const configRes = await fetch("/api/config/api-key", {
        headers: { "x-internal-request": "true" }
      });
      const config = await configRes.json();

      if (!config.apiKey) {
        alert("API 密钥未配置，请前往设置页面配置");
        return;
      }

      // Find previous image for continuity
      const currentIndex = storyboards.findIndex(sb => sb.id === storyboardId);
      const previousStoryboard = currentIndex > 0 ? storyboards[currentIndex - 1] : null;
      const previousImage = previousStoryboard?.image?.imageData;

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: config.apiKey,
          model: config.model,
          prompt: storyboard.visualPrompt,
          sceneDescription: storyboard.description,
          characterRefImage: characterReferenceImage,
          previousImage,
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        // Save image to database
        await fetch(`/api/projects/${projectId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyboardId,
            prompt: storyboard.visualPrompt,
            imageData: data.imageUrl,
            status: "completed",
          }),
        });
        fetchData();
      } else {
        alert(data.error || "图片生成失败");
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert("图片生成失败");
    } finally {
      setGeneratingImageId(null);
    }
  };

  const handleContinue = () => {
    router.push(`/projects/${projectId}/preview`);
  };

  const canContinue = storyboards.length > 0 && storyboards.some(sb => sb.image?.imageData);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!storyContent) {
    return (
      <ProjectLayout
        projectId={projectId}
        projectTitle={projectTitle}
        title="Storyboard"
        description="Create storyboards for your story"
        currentStep="storyboard"
      >
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No story content found. Please create a story first.</p>
              <Button onClick={() => router.push(`/projects/${projectId}/story`)}>
                Go to Story
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout
      projectId={projectId}
      projectTitle={projectTitle}
      title="Storyboard"
      description="Define each page/scene of your book and generate images"
      currentStep="storyboard"
    >
      <div className="max-w-4xl mx-auto space-y-6">
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
                  disabled={isGeneratingStoryboard}
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
              config={agentConfig}
              onChange={setAgentConfig}
              title="分镜 Agent 设置"
            />
          </CardContent>
        </Card>

        {storyboards.length > 0 ? (
          <div className="space-y-4">
            {storyboards.map((sb) => (
              <StoryboardCard
                key={sb.id}
                storyboard={sb}
                onUpdate={handleUpdateStoryboard}
                onDelete={handleDeleteStoryboard}
                onGenerateImage={handleGenerateImage}
                isGeneratingImage={generatingImageId === sb.id}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              还没有分镜。点击"自动生成"从故事中创建，或手动添加。
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/story`)}>
            Back to Story
          </Button>
          <Button onClick={handleContinue} disabled={!canContinue}>
            Continue to Preview
          </Button>
        </div>
      </div>
    </ProjectLayout>
  );
}