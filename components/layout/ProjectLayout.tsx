"use client";

import { ReactNode } from "react";
import { ProjectNav } from "./ProjectNav";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import type { ProjectStep } from "@/types";

interface ProjectLayoutProps {
  children: ReactNode;
  projectId: string;
  projectTitle?: string;
  title?: string;
  description?: string;
  currentStep?: ProjectStep;
  showNav?: boolean;
}

export function ProjectLayout({
  children,
  projectId,
  projectTitle,
  title,
  description,
  currentStep,
  showNav = true,
}: ProjectLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            {projectTitle && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium">{projectTitle}</span>
              </>
            )}
          </div>
          <Link
            href="/config"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </header>

      {/* Navigation */}
      {showNav && <ProjectNav projectId={projectId} currentStep={currentStep} />}

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {(title || description) && (
          <div className="mb-8 text-center">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            )}
            {description && (
              <p className="mt-2 text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}