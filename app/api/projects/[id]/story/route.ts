import { NextRequest, NextResponse } from 'next/server';
import { storiesOps, projectsOps } from '@/lib/db';
import { type AgentConfig } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/story - Get story for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const project = projectsOps.getById(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const story = storiesOps.getByProject(id);

    if (!story) {
      return NextResponse.json({ story: null });
    }

    return NextResponse.json({
      story: {
        id: story.id,
        projectId: story.project_id,
        theme: story.theme,
        content: story.content,
        agentConfig: JSON.parse(story.agent_config || '{"type":"creative"}'),
        createdAt: story.created_at,
        updatedAt: story.updated_at,
      }
    });
  } catch (error) {
    console.error('Failed to get story:', error);
    return NextResponse.json({ error: 'Failed to get story' }, { status: 500 });
  }
}

// POST /api/projects/[id]/story - Create or update story
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const project = projectsOps.getById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { theme, content, agentConfig } = body;

    if (!theme || typeof theme !== 'string') {
      return NextResponse.json({ error: 'Theme is required' }, { status: 400 });
    }

    const storyId = crypto.randomUUID();
    const storyData = {
      id: storyId,
      project_id: projectId,
      theme: theme.trim(),
      content: content || null,
      agent_config: JSON.stringify(agentConfig || { type: 'creative' }),
    };

    const story = storiesOps.upsert(storyData);

    return NextResponse.json({
      story: {
        id: story.id,
        projectId: story.project_id,
        theme: story.theme,
        content: story.content,
        agentConfig: JSON.parse(story.agent_config || '{"type":"creative"}'),
        createdAt: story.created_at,
        updatedAt: story.updated_at,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create/update story:', error);
    return NextResponse.json({ error: 'Failed to create/update story' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/story - Update story content
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const story = storiesOps.getByProject(projectId);

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: { theme?: string; content?: string | null; agent_config?: string } = {};

    if (body.theme !== undefined) updates.theme = body.theme;
    if (body.content !== undefined) updates.content = body.content;
    if (body.agentConfig !== undefined) updates.agent_config = JSON.stringify(body.agentConfig);

    const updated = storiesOps.update(story.id, updates);

    return NextResponse.json({
      story: {
        id: updated!.id,
        projectId: updated!.project_id,
        theme: updated!.theme,
        content: updated!.content,
        agentConfig: JSON.parse(updated!.agent_config || '{"type":"creative"}'),
        createdAt: updated!.created_at,
        updatedAt: updated!.updated_at,
      }
    });
  } catch (error) {
    console.error('Failed to update story:', error);
    return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
  }
}