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
    label: "创意型",
    description: "更具想象力和多样性的输出",
  },
  {
    value: "detailed",
    label: "详细型",
    description: "全面细致的输出",
  },
  {
    value: "minimal",
    label: "精简型",
    description: "简洁聚焦的输出",
  },
  {
    value: "custom",
    label: "自定义",
    description: "定义你自己的提示词",
  },
];

export function AgentConfigPanel({
  config,
  onChange,
  title = "Agent 设置",
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
              <Label>Agent 类型</Label>
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
                <Label>自定义提示词</Label>
                <Textarea
                  placeholder="输入你的自定义提示词..."
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