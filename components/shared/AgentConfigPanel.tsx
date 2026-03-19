"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AgentConfig, AgentType } from "@/types";

interface AgentConfigPanelProps {
  config: AgentConfig;
  onChange: (config: AgentConfig) => void;
  title?: string;
}

const AGENT_TYPES: { value: AgentType; label: string; description: string }[] = [
  {
    value: "creative",
    label: "Creative",
    description: "More imaginative and varied outputs",
  },
  {
    value: "detailed",
    label: "Detailed",
    description: "Thorough and comprehensive outputs",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Concise and focused outputs",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Define your own prompt",
  },
];

export function AgentConfigPanel({
  config,
  onChange,
  title = "Agent Settings",
}: AgentConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTypeChange = (type: AgentType) => {
    onChange({
      ...config,
      type,
      customPrompt: type === "custom" ? config.customPrompt : undefined,
    });
  };

  const handleCustomPromptChange = (prompt: string) => {
    onChange({
      ...config,
      customPrompt: prompt,
    });
  };

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? "config" : ""}
      onValueChange={(v) => setIsOpen(v === "config")}
    >
      <AccordionItem value="config" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            <span className="text-sm text-muted-foreground">
              ({AGENT_TYPES.find((t) => t.value === config.type)?.label})
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Agent Type</Label>
              <Select value={config.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {type.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config.type === "custom" && (
              <div className="space-y-2">
                <Label>Custom Prompt</Label>
                <Textarea
                  placeholder="Enter your custom prompt instructions..."
                  value={config.customPrompt || ""}
                  onChange={(e) => handleCustomPromptChange(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}