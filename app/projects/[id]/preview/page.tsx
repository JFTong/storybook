"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ChevronLeft, ChevronRight, Download, BookOpen, Loader2, Home } from "lucide-react";
import type { Storyboard } from "@/types";

interface StoryboardWithImage {
  id: string;
  pageNumber: number;
  scene: string;
  description: string;
  visualPrompt: string;
  shotType: string;
  mood: string;
  edited: boolean;
  image?: {
    id: string;
    imageData: string | null;
    status: string;
  } | null;
}

export default function PreviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [storyboards, setStoryboards] = useState<StoryboardWithImage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projectRes, storyRes, storyboardRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/story`),
        fetch(`/api/projects/${projectId}/storyboard`),
      ]);

      const projectData = await projectRes.json();
      const storyData = await storyRes.json();
      const storyboardData = await storyboardRes.json();

      setProjectTitle(projectData.project?.title || "");
      setStoryContent(storyData.story?.content || "");
      setStoryboards(storyboardData.storyboards || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentBookPage = storyboards[currentPage];
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < storyboards.length - 1;

  const handleExportZip = useCallback(async () => {
    const zip = new JSZip();
    const imagesFolder = zip.folder("images");

    // Add each image
    for (let i = 0; i < storyboards.length; i++) {
      const sb = storyboards[i];
      if (sb.image?.imageData) {
        // Convert base64 to blob
        const byteCharacters = atob(sb.image.imageData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/jpeg" });

        imagesFolder?.file(`page-${String(i + 1).padStart(2, "0")}.jpg`, blob);
      }
    }

    // Add story text
    const storyText = storyboards
      .map((sb, i) => `Page ${i + 1}: ${sb.scene}\n\n${sb.description}\n\n`)
      .join("\n---\n\n");
    zip.file("story.txt", storyContent + "\n\n---\n\n" + storyText);

    // Add title page
    zip.file("title.txt", projectTitle);

    // Generate and download
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${projectTitle.replace(/\s+/g, "-").toLowerCase()}.zip`);
  }, [storyboards, storyContent, projectTitle]);

  const handleNewBook = () => {
    router.push("/");
  };

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
      title="预览"
      description="预览你完成的绘本"
      currentStep="preview"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{projectTitle}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportZip} disabled={storyboards.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  导出 ZIP
                </Button>
                <Button variant="outline" onClick={handleNewBook}>
                  <Home className="h-4 w-4 mr-2" />
                  仪表盘
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {storyboards.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                没有可预览的页面。请先生成分镜和插画。
                <div className="mt-4">
                  <Button onClick={() => router.push(`/projects/${projectId}/storyboard`)}>
                    前往分镜设计
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden mb-4">
                  {currentBookPage?.image?.imageData ? (
                    <img
                      src={`data:image/jpeg;base64,${currentBookPage.image.imageData}`}
                      alt={`Page ${currentPage + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      图片尚未生成
                    </div>
                  )}
                </div>

                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg">{currentBookPage?.scene}</h3>
                  <p className="text-muted-foreground mt-1">
                    {currentBookPage?.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={!canGoPrev}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    上一页
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    第 {currentPage + 1} / {storyboards.length} 页
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!canGoNext}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                <div className="flex justify-center gap-1 mt-4">
                  {storyboards.map((sb, index) => (
                    <button
                      key={sb.id}
                      onClick={() => setCurrentPage(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentPage
                          ? "bg-primary"
                          : sb.image?.imageData
                          ? "bg-green-400 hover:bg-green-500"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                      title={sb.image?.imageData ? "已生成" : "未生成"}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/storyboard`)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            返回分镜
          </Button>
        </div>
      </div>
    </ProjectLayout>
  );
}