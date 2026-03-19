"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FolderOpen, Settings, Clock } from "lucide-react";
import type { ProjectDB } from "@/types";

interface Project extends ProjectDB {
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || creating) return;

    setCreating(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newProjectTitle.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/projects/${data.project.id}/characters`);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProjects(projects.filter((p) => p.id !== projectId));
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">AI Storybook Generator</h1>
          <Link
            href="/config"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">Create Children&apos;s Picture Books</h2>
            <p className="text-muted-foreground text-lg">
              Generate beautiful, consistent illustrations for your stories using AI
            </p>
          </div>

          {/* Create new project */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Project
              </CardTitle>
              <CardDescription>
                Start creating a new picture book
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="flex gap-4">
                <Input
                  placeholder="Enter project title..."
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newProjectTitle.trim() || creating}>
                  {creating ? "Creating..." : "Create"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Projects list */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Projects</h3>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No projects yet. Create your first one above!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}/characters`}
                    className="block"
                  >
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDeleteProject(project.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Updated {formatDate(project.updatedAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}