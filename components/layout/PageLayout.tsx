"use client";

import { ReactNode } from "react";
import { PipelineNav } from "./PipelineNav";
import type { PipelineStep } from "@/types";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  currentStep?: PipelineStep;
  showNav?: boolean;
}

export function PageLayout({
  children,
  title,
  description,
  currentStep,
  showNav = true,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showNav && <PipelineNav currentStep={currentStep} />}
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