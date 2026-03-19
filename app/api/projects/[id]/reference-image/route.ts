import { NextRequest, NextResponse } from 'next/server';
import { referenceImageOps, projectsOps } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/reference-image - Get character reference image
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const project = projectsOps.getById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const refImage = referenceImageOps.getByProject(projectId);

    return NextResponse.json({
      referenceImage: refImage?.image_data || null,
    });
  } catch (error) {
    console.error('Failed to get reference image:', error);
    return NextResponse.json({ error: 'Failed to get reference image' }, { status: 500 });
  }
}

// POST /api/projects/[id]/reference-image - Set character reference image
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const project = projectsOps.getById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { imageData } = body;

    const id = crypto.randomUUID();
    referenceImageOps.upsert(projectId, id, imageData || null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to set reference image:', error);
    return NextResponse.json({ error: 'Failed to set reference image' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/reference-image - Delete character reference image
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    referenceImageOps.delete(projectId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete reference image:', error);
    return NextResponse.json({ error: 'Failed to delete reference image' }, { status: 500 });
  }
}