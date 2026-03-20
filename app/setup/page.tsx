"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentConfigPanel } from "@/components/shared/AgentConfigPanel";
import { useBookStore } from "@/lib/store";
import type { AgentConfig } from "@/types";

const PRESET_MODELS = [
  { value: "gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash Image (Nano Banana 2) ⭐" },
  { value: "custom", label: "自定义模型（在下方输入）" },
  { value: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image (Nano Banana)" },
  { value: "imagen-4.0-generate-001", label: "Imagen 4" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (text only)" },
];

export default function SetupPage() {
  const router = useRouter();
  const { apiKey, setApiKey, model, setModel, globalAgentConfig, setGlobalAgentConfig } = useBookStore();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);
  const [customModel, setCustomModel] = useState("");
  const [localAgentConfig, setLocalAgentConfig] = useState<AgentConfig>(globalAgentConfig);

  const selectedModel = localModel === "custom" ? customModel : localModel;

  const handleModelChange = (value: string) => {
    setLocalModel(value);
    if (value !== "custom") {
      setCustomModel("");
    }
  };

  const handleContinue = () => {
    const finalModel = localModel === "custom" ? customModel : localModel;
    setApiKey(localApiKey);
    setModel(finalModel);
    setGlobalAgentConfig(localAgentConfig);
    router.push("/characters");
  };

  const canContinue = localApiKey.trim().length > 0 && selectedModel.trim().length > 0;

  return (
    <PageLayout
      title="设置"
      description="配置你的 AI 模型和设置"
      currentStep="setup"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API 配置</CardTitle>
            <CardDescription>
              输入你的 Google AI API 密钥以开始创作绘本
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API 密钥</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="输入你的 Google AI API 密钥"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                从{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
                {" "}获取你的 API 密钥
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">模型</Label>
              <Select value={localModel} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {localModel === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="custom-model">自定义模型名称</Label>
                <Input
                  id="custom-model"
                  placeholder="例如：gemini-2.0-flash-exp-image-generation"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  输入准确的模型 ID。查看{" "}
                  <a
                    href="https://ai.google.dev/gemini-api/docs/models"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    可用模型
                  </a>
                </p>
              </div>
            )}

            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <strong>提示：</strong>图片生成请使用支持图像的模型如{" "}
              <code className="bg-background px-1 rounded">gemini-2.0-flash-exp</code> 或类似模型。
              查看 Gemini 文档了解最新图像生成模型。
            </div>
          </CardContent>
        </Card>

        <AgentConfigPanel
          config={localAgentConfig}
          onChange={setLocalAgentConfig}
          title="默认 Agent 设置"
        />

        <div className="flex justify-end">
          <Button onClick={handleContinue} disabled={!canContinue}>
            继续到角色
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}