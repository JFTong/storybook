"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookStore } from "@/lib/store";
import { ChevronLeft, ChevronRight, Download, RotateCcw, Home, BookOpen } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function PreviewPage() {
  const router = useRouter();
  const { currentProject, resetProject } = useBookStore();

  const [currentPage, setCurrentPage] = useState(0);

  const pages = useMemo(
    () => currentProject?.pages || [],
    [currentProject?.pages]
  );
  const storyboards = useMemo(
    () => currentProject?.story?.storyboards || [],
    [currentProject?.story?.storyboards]
  );
  const title = currentProject?.title || "My Storybook";

  // Combine storyboards with generated images
  const bookPages = storyboards.map((sb, index) => ({
    storyboard: sb,
    page: pages.find((p) => p.storyboardId === sb.id),
  }));

  const currentBookPage = bookPages[currentPage];
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < bookPages.length - 1;

  const handleExportZip = useCallback(async () => {
    const zip = new JSZip();
    const imagesFolder = zip.folder("images");

    // Add each image
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (page.imageUrl) {
        // Convert base64 to blob
        const byteCharacters = atob(page.imageUrl);
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
    zip.file("story.txt", storyText);

    // Generate and download
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${title.replace(/\s+/g, "-").toLowerCase()}.zip`);
  }, [pages, storyboards, title]);

  const handleNewBook = () => {
    resetProject();
    router.push("/setup");
  };

  return (
    <PageLayout
      title="Preview"
      description="Preview your completed storybook"
      currentStep="preview"
      showNav={false}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{title}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportZip}>
                  <Download className="h-4 w-4 mr-2" />
                  Export ZIP
                </Button>
                <Button variant="outline" onClick={handleNewBook}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  New Book
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {bookPages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No pages to preview. Complete the generation step first.
              </div>
            ) : (
              <>
                <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden mb-4">
                  {currentBookPage?.page?.imageUrl ? (
                    <img
                      src={`data:image/jpeg;base64,${currentBookPage.page.imageUrl}`}
                      alt={`Page ${currentPage + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Image not available
                    </div>
                  )}
                </div>

                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg">{currentBookPage?.storyboard?.scene}</h3>
                  <p className="text-muted-foreground mt-1">
                    {currentBookPage?.storyboard?.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={!canGoPrev}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {bookPages.length}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!canGoNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                <div className="flex justify-center gap-1 mt-4">
                  {bookPages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentPage
                          ? "bg-primary"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push("/generate")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Generate
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}