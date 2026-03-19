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

const DEFAULT_COLORS = {
  primary: "#8E8E8E",
  secondary: "#F2B5B5",
};

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
  const [primaryColor, setPrimaryColor] = useState(character?.colors.primary || DEFAULT_COLORS.primary);
  const [secondaryColor, setSecondaryColor] = useState(character?.colors.secondary || DEFAULT_COLORS.secondary);
  const [clothing, setClothing] = useState(character?.clothing || "");
  const [expressions, setExpressions] = useState(character?.expressions.join(", ") || "");
  const [referenceImage, setReferenceImage] = useState<string | undefined>(character?.referenceImage);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(character?.generatedImage);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(character?.agentConfig || { type: "creative" });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleGenerateImage = async () => {
    if (!name.trim()) {
      alert("Please enter a character name first");
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
        alert("API key not configured. Please set it in Settings.");
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
            colors: { primary: primaryColor, secondary: secondaryColor },
            clothing,
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
        alert(data.error || "Failed to generate image");
      }
    } catch (error) {
      console.error("Failed to generate character image:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        alert("Request timed out. Please try again.");
      } else {
        alert("Failed to generate character image");
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
      colors: { primary: primaryColor, secondary: secondaryColor },
      clothing,
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
        <CardTitle>{character ? "Edit Character" : "Add Character"}</CardTitle>
        <CardDescription>Define your character&apos;s appearance and personality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Pip the Rabbit"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clothing">Clothing</Label>
            <Input
              id="clothing"
              placeholder="e.g., Green striped T-shirt and blue shorts"
              value={clothing}
              onChange={(e) => setClothing(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="e.g., A small gray rabbit with long ears, friendly and curious"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary-color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expressions">Expressions (comma-separated)</Label>
          <Input
            id="expressions"
            placeholder="e.g., happy, sad, surprised, determined"
            value={expressions}
            onChange={(e) => setExpressions(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label>Reference Image (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Upload a reference image to guide AI generation and maintain character consistency
            </p>
            <ImageUploader
              value={referenceImage && !generatedImage ? referenceImage : undefined}
              onChange={setReferenceImage}
              label=""
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated Image</Label>
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
                    {referenceImage ? "Generate from Reference" : "AI Generate"}
                  </>
                )}
              </Button>
            </div>

            {generatedImage ? (
              <div className="relative inline-block">
                <img
                  src={`data:image/jpeg;base64,${generatedImage}`}
                  alt={name || "Character"}
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
                    <p className="text-sm text-muted-foreground">Generating character image...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to generate image with AI
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
          title="Character Agent Settings"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {character ? "Update" : "Add"} Character
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
            <div className="flex gap-2 mt-2">
              <div
                className="w-5 h-5 rounded-full border"
                style={{ backgroundColor: character.colors.primary }}
                title="Primary color"
              />
              <div
                className="w-5 h-5 rounded-full border"
                style={{ backgroundColor: character.colors.secondary }}
                title="Secondary color"
              />
              {character.clothing && (
                <span className="text-xs text-muted-foreground">{character.clothing}</span>
              )}
            </div>
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
    if (!confirm("Delete this character?")) return;

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
      title="Characters"
      description="Define the characters in your storybook"
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
                Your Characters ({characters.length})
              </h2>
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Character
              </Button>
            </div>

            {characters.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No characters yet. Add your first character to get started.
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
                  <CardTitle>Combined Reference Image</CardTitle>
                  <CardDescription>
                    Upload a combined reference image showing all characters (optional but recommended)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader
                    value={combinedRefImage}
                    onChange={setCombinedRefImage}
                    label="Character Reference Sheet"
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={handleContinue} disabled={!canContinue}>
                Continue to Story
              </Button>
            </div>
          </>
        )}
      </div>
    </ProjectLayout>
  );
}