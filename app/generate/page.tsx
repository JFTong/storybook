"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useBookStore } from "@/lib/store";
import type { GeneratedPage, PageStatus } from "@/types";
import { Play, RotateCcw, Download, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";

const STATUS_ICONS = {
  pending: Clock,
  generating: Loader2,
  completed: CheckCircle2,
  error: AlertCircle,
};

const STATUS_COLORS = {
  pending: "text-muted-foreground",
  generating: "text-primary animate-spin",
  completed: "text-green-500",
  error: "text-destructive",
};

function PageCard({
  page,
  imageUrl,
  onRetry,
  pageIndex,
  totalPages,
}: {
  page: GeneratedPage;
  imageUrl?: string;
  onRetry: () => void;
  pageIndex: number;
  totalPages: number;
}) {
  const StatusIcon = STATUS_ICONS[page.status];
  const statusColor = STATUS_COLORS[page.status];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Page {pageIndex + 1}</CardTitle>
          <div className={`flex items-center gap-1 ${statusColor}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm capitalize">{page.status}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {page.status === "generating" && (
          <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
            <LoadingSpinner text="Generating..." />
          </div>
        )}
        {page.status === "pending" && (
          <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            Waiting to generate...
          </div>
        )}
        {page.status === "error" && (
          <div className="aspect-[4/3] bg-destructive/10 rounded-lg flex flex-col items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{page.error || "Generation failed"}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
        {page.status === "completed" && imageUrl && (
          <img
            src={`data:image/jpeg;base64,${imageUrl}`}
            alt={`Page ${pageIndex + 1}`}
            className="w-full aspect-[4/3] object-cover rounded-lg"
          />
        )}
        {page.retryCount > 0 && page.status !== "completed" && (
          <p className="text-xs text-muted-foreground mt-2">Retry count: {page.retryCount}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const {
    apiKey,
    model,
    currentProject,
    addPage,
    updatePage,
    clearPages,
  } = useBookStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const storyboards = useMemo(
    () => currentProject?.story?.storyboards || [],
    [currentProject?.story?.storyboards]
  );
  const characterRefImage = currentProject?.characterReferenceImage;
  const storedPages = useMemo(
    () => currentProject?.pages || [],
    [currentProject?.pages]
  );

  const totalPages = storyboards.length;
  const completedPages = storedPages.filter((p) => p.status === "completed").length;
  const progress = totalPages > 0 ? (completedPages / totalPages) * 100 : 0;

  const initializePages = useCallback(() => {
    clearPages();
    storyboards.forEach((sb) => {
      const page: GeneratedPage = {
        id: crypto.randomUUID(),
        storyboardId: sb.id,
        prompt: sb.visualPrompt,
        status: "pending",
        retryCount: 0,
      };
      addPage(page);
    });
  }, [storyboards, clearPages, addPage]);

  const generateSinglePage = useCallback(async (page: GeneratedPage, previousImageUrl?: string) => {
    const storyboard = storyboards.find((sb) => sb.id === page.storyboardId);
    if (!storyboard) return;

    updatePage(page.id, { status: "generating" });

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model,
          prompt: storyboard.visualPrompt,
          sceneDescription: storyboard.description,
          characterRefImage,
          previousImage: previousImageUrl,
        }),
      });

      const data = await response.json();

      if (data.imageUrl) {
        updatePage(page.id, {
          imageUrl: data.imageUrl,
          status: "completed",
        });
        return data.imageUrl;
      } else {
        throw new Error(data.error || "Failed to generate image");
      }
    } catch (error) {
      updatePage(page.id, {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        retryCount: page.retryCount + 1,
      });
      return undefined;
    }
  }, [apiKey, model, storyboards, characterRefImage, updatePage]);

  const generateAllPages = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);

    // Initialize pages if not already done
    if (storedPages.length === 0) {
      initializePages();
    }

    let previousImageUrl: string | undefined;

    for (let i = 0; i < storedPages.length; i++) {
      const page = storedPages[i];
      setCurrentIndex(i);

      if (page.status === "completed") {
        previousImageUrl = page.imageUrl;
        continue;
      }

      const result = await generateSinglePage(page, previousImageUrl);
      if (result) {
        previousImageUrl = result;
      }
    }

    setIsGenerating(false);
  }, [isGenerating, storedPages, initializePages, generateSinglePage]);

  const handleRetry = useCallback((pageId: string) => {
    const page = storedPages.find((p) => p.id === pageId);
    if (page) {
      const pageIndex = storedPages.findIndex((p) => p.id === pageId);
      const previousPage = pageIndex > 0 ? storedPages[pageIndex - 1] : undefined;
      generateSinglePage(page, previousPage?.imageUrl);
    }
  }, [storedPages, generateSinglePage]);

  const handleContinue = () => {
    router.push("/preview");
  };

  const canStartGeneration = storyboards.length > 0 && apiKey;
  const allCompleted = completedPages === totalPages && totalPages > 0;

  return (
    <PageLayout
      title="Generate"
      description="Generate images for each page of your storybook"
      currentStep="generate"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Generation Progress</CardTitle>
            <CardDescription>
              {totalPages} pages to generate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{completedPages} / {totalPages} completed</span>
              {isGenerating && <span>Currently generating page {currentIndex + 1}</span>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button
            onClick={generateAllPages}
            disabled={!canStartGeneration || isGenerating}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {storedPages.length === 0 ? "Start Generation" : "Continue Generation"}
              </>
            )}
          </Button>
          {storedPages.length > 0 && (
            <Button variant="outline" onClick={initializePages}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {storedPages.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {storedPages.map((page, index) => (
              <PageCard
                key={page.id}
                page={page}
                imageUrl={page.imageUrl}
                onRetry={() => handleRetry(page.id)}
                pageIndex={index}
                totalPages={totalPages}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {storyboards.length === 0
                ? "No storyboards defined. Go back to create storyboards first."
                : "Click 'Start Generation' to begin generating images for your storybook."}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/story")}>
            Back to Story
          </Button>
          <Button onClick={handleContinue} disabled={!allCompleted}>
            Continue to Preview
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}