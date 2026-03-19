import { NextRequest, NextResponse } from 'next/server';
import { projectsOps, charactersOps, storiesOps, storyboardsOps, imagesOps, referenceImageOps } from '@/lib/db';
import { characterFromDB, storyboardFromDB, generatedImageFromDB, type CharacterDB, type StoryDB, type StoryboardDB, type GeneratedImageDB } from '@/types';

// GET /api/projects - Get all projects
export async function GET() {
  try {
    const projects = projectsOps.getAll();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to get projects:', error);
    return NextResponse.json({ error: 'Failed to get projects' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const project = projectsOps.create(id, title.trim());

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}