import { NextRequest, NextResponse } from 'next/server';
import { projectsOps, charactersOps, storiesOps, storyboardsOps, imagesOps, referenceImageOps } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to parse JSON fields safely
function parseJsonField<T>(field: string | null, defaultValue: T): T {
  if (!field) return defaultValue;
  try {
    return JSON.parse(field) as T;
  } catch {
    return defaultValue;
  }
}

// Helper to get full project with relations
function getFullProject(projectId: string) {
  const project = projectsOps.getById(projectId);
  if (!project) return null;

  // Get characters
  const charactersDb = charactersOps.getByProject(projectId);
  const characters = charactersDb.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    styleDescription: c.style_description || undefined,
    expressions: parseJsonField<string[]>(c.expressions, []),
    referenceImage: c.reference_image || undefined,
    generatedImage: c.generated_image || undefined,
    agentConfig: parseJsonField(c.agent_config, { type: 'creative' as const }),
  }));

  // Get story with storyboards
  const storyDb = storiesOps.getByProject(projectId);
  let story = null;
  let images: Awaited<ReturnType<typeof imagesOps.getByStory>> = [];

  if (storyDb) {
    const storyboardsDb = storyboardsOps.getByStory(storyDb.id);
    images = imagesOps.getByStory(storyDb.id);

    story = {
      id: storyDb.id,
      theme: storyDb.theme,
      content: storyDb.content || '',
      storyboards: storyboardsDb.map(sb => ({
        id: sb.id,
        pageNumber: sb.page_number,
        scene: sb.scene,
        description: sb.description,
        visualPrompt: sb.visual_prompt,
        shotType: sb.shot_type as 'close-up' | 'medium' | 'wide',
        mood: sb.mood,
        edited: Boolean(sb.edited),
      })),
      agentConfig: parseJsonField(storyDb.agent_config, { type: 'creative' as const }),
      storyboardAgentConfig: parseJsonField(storyDb.agent_config, { type: 'creative' as const }),
    };
  }

  // Get reference image
  const refImage = referenceImageOps.getByProject(projectId);
  const characterReferenceImage = refImage?.image_data || undefined;

  // Get images mapped by storyboard
  const imagesMap: Record<string, typeof images[0]> = {};
  for (const img of images) {
    imagesMap[img.storyboard_id] = img;
  }

  return {
    project: {
      id: project.id,
      title: project.title,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    },
    characters,
    characterReferenceImage,
    story,
    images: Object.entries(imagesMap).map(([storyboardId, img]) => ({
      id: img.id,
      storyboardId: img.storyboard_id,
      prompt: img.prompt || '',
      imageUrl: img.image_data || undefined,
      status: img.status as 'pending' | 'generating' | 'completed' | 'error',
      retryCount: img.retry_count,
      error: img.error_message || undefined,
    })),
  };
}

// GET /api/projects/[id] - Get a single project with all relations
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const fullProject = getFullProject(id);

    if (!fullProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(fullProject);
  } catch (error) {
    console.error('Failed to get project:', error);
    return NextResponse.json({ error: 'Failed to get project' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    const project = projectsOps.update(id, { title });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = projectsOps.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}