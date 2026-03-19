"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PIPELINE_STEPS, type PipelineStep } from "@/types";
import { Check } from "lucide-react";

interface PipelineNavProps {
  currentStep?: PipelineStep;
}

export function PipelineNav({ currentStep }: PipelineNavProps) {
  const pathname = usePathname();
  const currentIndex = PIPELINE_STEPS.findIndex(
    (s) => s.id === (currentStep || pathname.split("/")[1] as PipelineStep)
  );

  return (
    <nav className="w-full py-4">
      <div className="flex items-center justify-center">
        {PIPELINE_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const stepNumber = index + 1;

          return (
            <div key={step.id} className="flex items-center">
              <Link
                href={step.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                    isCompleted || isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </Link>
              {index < PIPELINE_STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}