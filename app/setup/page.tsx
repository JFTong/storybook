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
  { value: "custom", label: "Custom Model (enter below)" },
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
      title="Setup"
      description="Configure your AI model and settings"
      currentStep="setup"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Enter your Google AI API key to start creating storybooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your Google AI API key"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
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
                <Label htmlFor="custom-model">Custom Model Name</Label>
                <Input
                  id="custom-model"
                  placeholder="e.g., gemini-2.0-flash-exp-image-generation"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the exact model ID. Check{" "}
                  <a
                    href="https://ai.google.dev/gemini-api/docs/models"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    available models
                  </a>
                </p>
              </div>
            )}

            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <strong>Note:</strong> For image generation, use an image-capable model like{" "}
              <code className="bg-background px-1 rounded">gemini-2.0-flash-exp</code> or similar.
              Check the Gemini documentation for the latest image generation models.
            </div>
          </CardContent>
        </Card>

        <AgentConfigPanel
          config={localAgentConfig}
          onChange={setLocalAgentConfig}
          title="Default Agent Settings"
        />

        <div className="flex justify-end">
          <Button onClick={handleContinue} disabled={!canContinue}>
            Continue to Characters
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}