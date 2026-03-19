# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

This directory contains a single reference document (`mrd.md`) - a technical article saved from Tencent's internal knowledge platform about using AI to create custom children's picture books.

## No Code Here

There is no source code, build configuration, or package management in this directory. The article references an actual implementation at `git.woa.com/kelvinzhou/storybook`.

## Article Summary

The article documents a workflow for generating consistent children's picture books using AI:

- **Character Consistency**: Using reference images chained across pages to maintain visual consistency
- **Sub-Agent Architecture**: Splitting work across specialized agents (Character Designer, Storyboard Writer, Prompt Engineer, Artist) to avoid context overflow
- **Skill Encapsulation**: Using CodeBuddy Code's Skill mechanism for workflow orchestration with forced confirmation checkpoints
- **Image Compression**: Automatic compression of reference images before API calls to avoid size limits