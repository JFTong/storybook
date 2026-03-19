"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import type { GlobalConfigResponse } from "@/types";

const PRESET_MODELS = [
  { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash Exp (Image Generation) ⭐" },
  { value: "gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash Image Preview" },
  { value: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image" },
  { value: "imagen-4.0-generate-001", label: "Imagen 4" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (text only)" },
  { value: "custom", label: "Custom Model (enter below)" },
];

export default function ConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // API Config
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [model, setModel] = useState("gemini-2.0-flash-exp");
  const [customModel, setCustomModel] = useState("");

  // Feishu Config
  const [feishuAppId, setFeishuAppId] = useState("");
  const [hasFeishuAppId, setHasFeishuAppId] = useState(false);
  const [feishuAppSecret, setFeishuAppSecret] = useState("");
  const [hasFeishuAppSecret, setHasFeishuAppSecret] = useState(false);
  const [feishuEnabled, setFeishuEnabled] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/config");
      const data: GlobalConfigResponse = await response.json();

      setHasApiKey(data.hasApiKey);
      setModel(data.model || "gemini-2.0-flash-exp");
      setHasFeishuAppId(data.hasFeishuAppId);
      setHasFeishuAppSecret(data.hasFeishuAppSecret);
      setFeishuEnabled(data.feishuEnabled);
    } catch (error) {
      console.error("Failed to fetch config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const updates: Record<string, string | boolean> = {};

      if (apiKey.trim()) {
        updates.apiKey = apiKey.trim();
      }
      if (model === "custom" && customModel.trim()) {
        updates.model = customModel.trim();
      } else if (model !== "custom") {
        updates.model = model;
      }

      if (feishuAppId.trim()) {
        updates.feishuAppId = feishuAppId.trim();
      }
      if (feishuAppSecret.trim()) {
        updates.feishuAppSecret = feishuAppSecret.trim();
      }
      updates.feishuEnabled = feishuEnabled;

      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setSaved(true);
        setApiKey("");
        setFeishuAppId("");
        setFeishuAppSecret("");
        fetchConfig();
      }
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setSaving(false);
    }
  };

  const selectedModel = model === "custom" ? customModel : model;
  const canSave = selectedModel.trim().length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="mt-2 text-muted-foreground">
              Configure your API keys and preferences
            </p>
          </div>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Enter your Google AI API key for story and image generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder={hasApiKey ? "••••••••••••••••" : "Enter your Google AI API key"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                {hasApiKey && !apiKey && (
                  <p className="text-xs text-muted-foreground">
                    API key is configured. Enter a new key to update.
                  </p>
                )}
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
                <Select value={model} onValueChange={setModel}>
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

              {model === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-model">Custom Model Name</Label>
                  <Input
                    id="custom-model"
                    placeholder="e.g., gemini-2.0-flash-exp-image-generation"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                  />
                </div>
              )}

              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                <strong>Note:</strong> For image generation, use an image-capable model like{" "}
                <code className="bg-background px-1 rounded">gemini-2.0-flash-exp</code>.
              </div>
            </CardContent>
          </Card>

          {/* Feishu Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Feishu Integration</CardTitle>
              <CardDescription>
                Connect to Feishu for document synchronization (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Feishu Sync</p>
                  <p className="text-sm text-muted-foreground">
                    Sync your storybooks to Feishu documents
                  </p>
                </div>
                <Button
                  variant={feishuEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFeishuEnabled(!feishuEnabled)}
                >
                  {feishuEnabled ? "Enabled" : "Disabled"}
                </Button>
              </div>

              {feishuEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="feishu-app-id">App ID</Label>
                    <Input
                      id="feishu-app-id"
                      type="text"
                      placeholder={hasFeishuAppId ? "••••••••••••••••" : "Enter Feishu App ID"}
                      value={feishuAppId}
                      onChange={(e) => setFeishuAppId(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feishu-app-secret">App Secret</Label>
                    <Input
                      id="feishu-app-secret"
                      type="password"
                      placeholder={hasFeishuAppSecret ? "••••••••••••••••" : "Enter Feishu App Secret"}
                      value={feishuAppSecret}
                      onChange={(e) => setFeishuAppSecret(e.target.value)}
                    />
                  </div>

                  <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                    Create a Feishu app and get credentials from the{" "}
                    <a
                      href="https://open.feishu.cn/app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Feishu Open Platform
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push("/")}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}