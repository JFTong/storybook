"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { AgentConfigPanel } from "@/components/shared/AgentConfigPanel";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Character, AgentConfig } from "@/types";
import { Plus, Trash2, Edit2, Sparkles, Loader2 } from "lucide-react";

function CharacterForm({
  character,
  projectId,
  onSave,
  onCancel,
}: {
  character?: Character;
  projectId: string;
  onSave: (char: Character) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(character?.name || "");
  const [description, setDescription] = useState(character?.description || "");
  const [styleDescription, setStyleDescription] = useState(character?.styleDescription || "");
  const [expressions, setExpressions] = useState(character?.expressions.join(", ") || "");
  const [referenceImage, setReferenceImage] = useState<string | undefined>(character?.referenceImage);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(character?.generatedImage);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(character?.agentConfig || { type: "creative" });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleGenerateImage = async () => {
    if (!name.trim()) {
      alert("请先输入角色名称");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      // Get config from API
      const configRes = await fetch("/api/config/api-key", {
        headers: { "x-internal-request": "true" }
      });
      const config = await configRes.json();

      if (!config.apiKey) {
        alert("API 密钥未配置，请前往设置页面配置");
        return;
      }

      const response = await fetch("/api/generate-character-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: config.apiKey,
          model: config.model,
          character: {
            name,
            description,
            styleDescription,
          },
          referenceImage,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setReferenceImage(data.imageUrl);
      } else {
        alert(data.error || "图片生成失败");
      }
    } catch (error) {
      console.error("Failed to generate character image:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        alert("请求超时，请重试");
      } else {
        alert("角色图片生成失败");
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSave = () => {
    const char: Character = {
      id: character?.id || crypto.randomUUID(),
      name,
      description,
      styleDescription,
      expressions: expressions.split(",").map((e) => e.trim()).filter(Boolean),
      referenceImage,
      generatedImage,
      agentConfig,
    };
    onSave(char);
  };

  const isValid = name.trim().length > 0 && description.trim().length > 0 && referenceImage;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{character ? "编辑角色" : "添加角色"}</CardTitle>
        <CardDescription>定义角色外观和性格特征</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">角色名称 *</Label>
            <Input
              id="name"
              placeholder="例如：小兔皮普"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expressions">表情列表（逗号分隔）</Label>
            <Input
              id="expressions"
              placeholder="例如：开心、伤心、惊讶、坚定"
              value={expressions}
              onChange={(e) => setExpressions(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">角色描述 *</Label>
          <Textarea
            id="description"
            placeholder="例如：一只灰色的小兔子，长耳朵，友好且好奇"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="style-description">风格描述（可选）</Label>
          <Input
            id="style-description"
            placeholder="例如：柔和的水彩风格，温暖的色调"
            value={styleDescription}
            onChange={(e) => setStyleDescription(e.target.value)}
          />
        </div>

        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-primary mt-2" />
            <div className="flex-1 text-sm text-muted-foreground">
              <strong>重要提示：</strong>
              上传角色参考图后，AI 将严格遵循图中的外观特征（体型、颜色、服装等）来生成插画。
              无需单独指定颜色和服装细节。请确保参考图清晰、特征明显。
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>参考图 * （必填）</Label>
            <p className="text-xs text-muted-foreground mb-2">
              上传角色参考图，用于指导 AI 生成保持一致特征的插画
            </p>
            <ImageUploader
              value={referenceImage && !generatedImage ? referenceImage : undefined}
              onChange={setReferenceImage}
              label=""
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>AI 生成角色图</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateImage}
                disabled={!name.trim() || isGeneratingImage}
              >
                {isGeneratingImage ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {referenceImage ? "基于参考图生成" : "AI 生成"}
                  </>
                )}
              </Button>
            </div>

            {generatedImage ? (
              <div className="relative inline-block">
                <img
                  src={`data:image/jpeg;base64,${generatedImage}`}
                  alt={name || "角色"}
                  className="max-w-full h-auto rounded-lg border max-h-64"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setGeneratedImage(undefined)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-muted-foreground/25 hover:border-primary/50"
                onClick={() => isGeneratingImage || handleGenerateImage()}
              >
                {isGeneratingImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner />
                    <p className="text-sm text-muted-foreground">正在生成角色图片...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      点击使用 AI 生成角色图片
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <AgentConfigPanel
          config={agentConfig}
          onChange={setAgentConfig}
          title="角色 Agent 设置"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {character ? "更新" : "添加"}角色
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CharacterCard({
  character,
  onEdit,
  onDelete,
}: {
  character: Character;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const displayImage = character.generatedImage || character.referenceImage;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex gap-4">
          {displayImage && (
            <img
              src={`data:image/jpeg;base64,${displayImage}`}
              alt={character.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{character.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{character.description}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            {character.styleDescription && (
              <p className="text-xs text-muted-foreground mt-2">
                风格：{character.styleDescription}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CharactersPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [combinedRefImage, setCombinedRefImage] = useState<string | undefined>();

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projectRes, charsRes, refRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/characters`),
        fetch(`/api/projects/${projectId}/reference-image`),
      ]);

      const projectData = await projectRes.json();
      const charsData = await charsRes.json();
      const refData = await refRes.json();

      setProjectTitle(projectData.project?.title || "");
      setCharacters(charsData.characters || []);
      setCombinedRefImage(refData.referenceImage || undefined);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCharacter = async (char: Character) => {
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`/api/projects/${projectId}/characters/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(char),
        });
        setEditingId(null);
      } else {
        await fetch(`/api/projects/${projectId}/characters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(char),
        });
        setIsAdding(false);
      }
      fetchData();
    } catch (error) {
      console.error("Failed to save character:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (!confirm("确定删除这个角色吗？")) return;

    try {
      await fetch(`/api/projects/${projectId}/characters/${charId}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to delete character:", error);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleContinue = async () => {
    if (combinedRefImage) {
      await fetch(`/api/projects/${projectId}/reference-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: combinedRefImage }),
      });
    }
    router.push(`/projects/${projectId}/story`);
  };

  const canContinue = characters.length > 0;

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
      title="角色定义"
      description="定义绘本中的角色"
      currentStep="characters"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {isAdding || editingId ? (
          <CharacterForm
            character={editingId ? characters.find((c) => c.id === editingId) : undefined}
            projectId={projectId}
            onSave={handleSaveCharacter}
            onCancel={handleCancel}
          />
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                角色列表 ({characters.length})
              </h2>
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加角色
              </Button>
            </div>

            {characters.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  还没有角色，点击&ldquo;添加角色&rdquo;开始创建
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    onEdit={() => setEditingId(char.id)}
                    onDelete={() => handleDeleteCharacter(char.id)}
                  />
                ))}
              </div>
            )}

            {characters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>组合参考图</CardTitle>
                  <CardDescription>
                    上传包含所有角色的组合参考图（可选，但强烈推荐）
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader
                    value={combinedRefImage}
                    onChange={setCombinedRefImage}
                    label="角色参考合集"
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={handleContinue} disabled={!canContinue}>
                继续编写故事
              </Button>
            </div>
          </>
        )}
      </div>
    </ProjectLayout>
  );
}