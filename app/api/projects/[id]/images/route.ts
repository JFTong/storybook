import { NextRequest, NextResponse } from 'next/server';
import { imagesOps, storyboardsOps, storiesOps, projectsOps } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/images - Get all images for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const project = projectsOps.getById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const story = storiesOps.getByProject(projectId);
    if (!story) {
      return NextResponse.json({ images: [] });
    }

    const images = imagesOps.getByStory(story.id);

    return NextResponse.json({
      images: images.map(img => ({
        id: img.id,
        storyboardId: img.storyboard_id,
        prompt: img.prompt,
        imageData: img.image_data,
        status: img.status,
        retryCount: img.retry_count,
        errorMessage: img.error_message,
      })),
    });
  } catch (error) {
    console.error('Failed to get images:', error);
    return NextResponse.json({ error: 'Failed to get images' }, { status: 500 });
  }
}

// POST /api/projects/[id]/images - Create or update an image
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    const body = await request.json();
    const { storyboardId, prompt, imageData, status, retryCount, errorMessage } = body;

    if (!storyboardId) {
      return NextResponse.json({ error: 'Storyboard ID is required' }, { status: 400 });
    }

    const imageId = crypto.randomUUID();
    const result = imagesOps.upsert({
      id: imageId,
      storyboard_id: storyboardId,
      prompt: prompt || null,
      image_data: imageData || null,
      status: status || 'pending',
      retry_count: retryCount || 0,
      error_message: errorMessage || null,
    });

    return NextResponse.json({
      image: {
        id: result.id,
        storyboardId: result.storyboard_id,
        prompt: result.prompt,
        imageData: result.image_data,
        status: result.status,
        retryCount: result.retry_count,
        errorMessage: result.error_message,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create/update image:', error);
    return NextResponse.json({ error: 'Failed to create/update image' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/images - Update image status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    const body = await request.json();
    const { imageId, updates } = body;

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const updateData: Record<string, string | number | null> = {};
    if (updates.prompt !== undefined) updateData.prompt = updates.prompt;
    if (updates.imageData !== undefined) updateData.image_data = updates.imageData;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.retryCount !== undefined) updateData.retry_count = updates.retryCount;
    if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;

    const updated = imagesOps.update(imageId, updateData);

    if (!updated) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({
      image: {
        id: updated.id,
        storyboardId: updated.storyboard_id,
        prompt: updated.prompt,
        imageData: updated.image_data,
        status: updated.status,
        retryCount: updated.retry_count,
        errorMessage: updated.error_message,
      },
    });
  } catch (error) {
    console.error('Failed to update image:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/images - Delete all images for a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const story = storiesOps.getByProject(projectId);

    if (!story) {
      return NextResponse.json({ success: true });
    }

    // Delete all images via storyboards
    const storyboards = storyboardsOps.getByStory(story.id);
    for (const sb of storyboards) {
      imagesOps.deleteByStoryboard(sb.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete images:', error);
    return NextResponse.json({ error: 'Failed to delete images' }, { status: 500 });
  }
}