import { NextRequest, NextResponse } from 'next/server';
import { storyboardsOps, storiesOps, projectsOps, imagesOps } from '@/lib/db';
import { type Storyboard } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to parse storyboard from DB
function parseStoryboard(sb: {
  id: string;
  story_id: string;
  page_number: number;
  scene: string;
  description: string;
  visual_prompt: string;
  shot_type: string;
  mood: string;
  edited: number;
}) {
  return {
    id: sb.id,
    storyId: sb.story_id,
    pageNumber: sb.page_number,
    scene: sb.scene,
    description: sb.description,
    visualPrompt: sb.visual_prompt,
    shotType: sb.shot_type,
    mood: sb.mood,
    edited: Boolean(sb.edited),
  };
}

// GET /api/projects/[id]/storyboard - Get all storyboards for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const project = projectsOps.getById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const story = storiesOps.getByProject(projectId);
    if (!story) {
      return NextResponse.json({ storyboards: [], hasStory: false });
    }

    const storyboardsDb = storyboardsOps.getByStory(story.id);
    const storyboards = storyboardsDb.map(parseStoryboard);

    // Get images for each storyboard
    const images = imagesOps.getByStory(story.id);
    const imagesMap = new Map(images.map(img => [img.storyboard_id, img]));

    const storyboardsWithImages = storyboards.map(sb => ({
      ...sb,
      image: imagesMap.get(sb.id) ? {
        id: imagesMap.get(sb.id)!.id,
        imageData: imagesMap.get(sb.id)!.image_data,
        status: imagesMap.get(sb.id)!.status,
      } : null,
    }));

    return NextResponse.json({
      storyboards: storyboardsWithImages,
      hasStory: true,
      storyId: story.id,
    });
  } catch (error) {
    console.error('Failed to get storyboards:', error);
    return NextResponse.json({ error: 'Failed to get storyboards' }, { status: 500 });
  }
}

// POST /api/projects/[id]/storyboard - Create storyboards (batch)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const project = projectsOps.getById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const story = storiesOps.getByProject(projectId);
    if (!story) {
      return NextResponse.json({ error: 'Story not found. Create a story first.' }, { status: 400 });
    }

    const body = await request.json();
    const { storyboards } = body as { storyboards: Omit<Storyboard, 'id'>[] };

    if (!Array.isArray(storyboards)) {
      return NextResponse.json({ error: 'Storyboards array is required' }, { status: 400 });
    }

    // Delete existing storyboards and their images
    storyboardsOps.deleteByStory(story.id);

    // Create new storyboards
    const newStoryboards = storyboards.map((sb, index) => ({
      id: crypto.randomUUID(),
      story_id: story.id,
      page_number: sb.pageNumber || index + 1,
      scene: sb.scene || '',
      description: sb.description || '',
      visual_prompt: sb.visualPrompt || '',
      shot_type: sb.shotType || 'medium',
      mood: sb.mood || '',
      edited: sb.edited ? 1 : 0,
    }));

    storyboardsOps.createBatch(newStoryboards as Parameters<typeof storyboardsOps.createBatch>[0]);

    return NextResponse.json({
      storyboards: newStoryboards.map(parseStoryboard),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create storyboards:', error);
    return NextResponse.json({ error: 'Failed to create storyboards' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/storyboard - Update a single storyboard
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    const body = await request.json();
    const { storyboardId, updates } = body as { storyboardId: string; updates: Partial<Storyboard> };

    if (!storyboardId) {
      return NextResponse.json({ error: 'Storyboard ID is required' }, { status: 400 });
    }

    const updateData: Record<string, string | number | boolean> = {};
    if (updates.pageNumber !== undefined) updateData.page_number = updates.pageNumber;
    if (updates.scene !== undefined) updateData.scene = updates.scene;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.visualPrompt !== undefined) updateData.visual_prompt = updates.visualPrompt;
    if (updates.shotType !== undefined) updateData.shot_type = updates.shotType;
    if (updates.mood !== undefined) updateData.mood = updates.mood;
    if (updates.edited !== undefined) updateData.edited = updates.edited;

    const updated = storyboardsOps.update(storyboardId, updateData);

    if (!updated) {
      return NextResponse.json({ error: 'Storyboard not found' }, { status: 404 });
    }

    return NextResponse.json({
      storyboard: parseStoryboard(updated),
    });
  } catch (error) {
    console.error('Failed to update storyboard:', error);
    return NextResponse.json({ error: 'Failed to update storyboard' }, { status: 500 });
  }
}