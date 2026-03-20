"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { AgentConfigPanel } from "@/components/shared/AgentConfigPanel";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useBookStore } from "@/lib/store";
import type { Character, AgentConfig } from "@/types";
import { Plus, Trash2, Edit2, Sparkles } from "lucide-react";

function CharacterForm({
  character,
  onSave,
  onCancel,
}: {
  character?: Character;
  onSave: (char: Character) => void;
  onCancel: () => void;
}) {
  const { apiKey, model } = useBookStore();
  const [name, setName] = useState(character?.name || "");
  const [description, setDescription] = useState(character?.description || "");
  const [styleDescription, setStyleDescription] = useState(character?.styleDescription || "");
  const [expressions, setExpressions] = useState(character?.expressions.join(", ") || "");
  const [referenceImage, setReferenceImage] = useState<string | undefined>(character?.referenceImage);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(character?.generatedImage);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(character?.agentConfig || { type: "creative" });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleGenerateImage = async () => {
    if (!apiKey || !name.trim()) {
      alert("请先输入角色名称");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch("/api/generate-character-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model,
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
      styleDescription: styleDescription || undefined,
      expressions: expressions.split(",").map((e) => e.trim()).filter(Boolean),
      referenceImage,
      generatedImage,
      agentConfig,
    };
    onSave(char);
  };

  const isValid = name.trim().length > 0 && description.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{character ? "编辑角色" : "添加角色"}</CardTitle>
        <CardDescription>定义角色的外观和个性特征</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">角色名称 *</Label>
            <Input
              id="name"
              placeholder="例如：小兔子皮皮"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="styleDescription">风格描述（可选）</Label>
            <Input
              id="styleDescription"
              placeholder="例如：水彩风格、圆润可爱的造型"
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">角色描述 *</Label>
          <Textarea
            id="description"
            placeholder="例如：一只灰色的小兔子，长长的耳朵，性格友善又好奇"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expressions">表情（逗号分隔）</Label>
          <Input
            id="expressions"
            placeholder="例如：开心, 伤心, 惊讶, 坚定"
            value={expressions}
            onChange={(e) => setExpressions(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label>参考图（推荐上传）</Label>
            <p className="text-xs text-muted-foreground mb-2">
              上传参考图可以帮助 AI 更好地保持角色一致性
            </p>
            <ImageUploader
              value={referenceImage && !generatedImage ? referenceImage : undefined}
              onChange={setReferenceImage}
              label=""
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>AI 生成图</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateImage}
                disabled={!apiKey || !name.trim() || isGeneratingImage}
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
                      点击使用 AI 生成图片
                    </p>
                    {!apiKey && (
                      <p className="text-xs text-destructive">需要先配置 API Key</p>
                    )}
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
              <p className="text-xs text-muted-foreground mt-1">
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
  const router = useRouter();
  const { currentProject, addCharacter, updateCharacter, removeCharacter, setCharacterReferenceImage } = useBookStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [combinedRefImage, setCombinedRefImage] = useState<string | undefined>(
    currentProject?.characterReferenceImage
  );

  const characters = currentProject?.characters || [];

  const handleSaveCharacter = (char: Character) => {
    if (editingId) {
      updateCharacter(editingId, char);
      setEditingId(null);
    } else {
      addCharacter(char);
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleContinue = () => {
    if (combinedRefImage) {
      setCharacterReferenceImage(combinedRefImage);
    }
    router.push("/story");
  };

  const canContinue = characters.length > 0;

  return (
    <PageLayout
      title="角色定义"
      description="定义绘本中的角色"
      currentStep="characters"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {isAdding || editingId ? (
          <CharacterForm
            character={editingId ? characters.find((c) => c.id === editingId) : undefined}
            onSave={handleSaveCharacter}
            onCancel={handleCancel}
          />
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                你的角色 ({characters.length})
              </h2>
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加角色
              </Button>
            </div>

            {characters.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  还没有角色，添加第一个角色开始吧。
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    onEdit={() => setEditingId(char.id)}
                    onDelete={() => removeCharacter(char.id)}
                  />
                ))}
              </div>
            )}

            {characters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>组合参考图</CardTitle>
                  <CardDescription>
                    上传一张包含所有角色的组合参考图（可选但推荐）
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader
                    value={combinedRefImage}
                    onChange={setCombinedRefImage}
                    label="角色参考图集"
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/setup")}>
                返回设置
              </Button>
              <Button onClick={handleContinue} disabled={!canContinue}>
                继续编写故事
              </Button>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
