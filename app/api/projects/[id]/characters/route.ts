import { NextRequest, NextResponse } from 'next/server';
import { charactersOps, projectsOps } from '@/lib/db';
import { characterToDB, type Character, type AgentConfig } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/characters - Get all characters for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const project = projectsOps.getById(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const charactersDb = charactersOps.getByProject(id);
    const characters = charactersDb.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      colors: {
        primary: c.primary_color,
        secondary: c.secondary_color,
      },
      clothing: c.clothing,
      expressions: JSON.parse(c.expressions || '[]'),
      referenceImage: c.reference_image || undefined,
      generatedImage: c.generated_image || undefined,
      agentConfig: JSON.parse(c.agent_config || '{"type":"creative"}'),
    }));

    return NextResponse.json({ characters });
  } catch (error) {
    console.error('Failed to get characters:', error);
    return NextResponse.json({ error: 'Failed to get characters' }, { status: 500 });
  }
}

// POST /api/projects/[id]/characters - Create a new character
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const project = projectsOps.getById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, colors, clothing, expressions, referenceImage, generatedImage, agentConfig } = body as Omit<Character, 'id'>;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const charId = crypto.randomUUID();
    const charData = {
      id: charId,
      project_id: projectId,
      name: name.trim(),
      description: description || '',
      primary_color: colors?.primary || '#4A90D9',
      secondary_color: colors?.secondary || '#F5A623',
      clothing: clothing || '',
      expressions: JSON.stringify(expressions || []),
      reference_image: referenceImage || null,
      generated_image: generatedImage || null,
      agent_config: JSON.stringify(agentConfig || { type: 'creative' }),
    };

    charactersOps.create(charData);

    return NextResponse.json({
      character: {
        id: charId,
        name: charData.name,
        description: charData.description,
        colors: {
          primary: charData.primary_color,
          secondary: charData.secondary_color,
        },
        clothing: charData.clothing,
        expressions: expressions || [],
        referenceImage: referenceImage,
        generatedImage: generatedImage,
        agentConfig: agentConfig || { type: 'creative' },
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create character:', error);
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/characters - Batch update characters
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const project = projectsOps.getById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { characters } = body as { characters: Character[] };

    // Delete all existing characters and recreate
    const existingChars = charactersOps.getByProject(projectId);
    for (const c of existingChars) {
      charactersOps.delete(c.id);
    }

    // Create new characters
    for (const char of characters) {
      const charData = {
        id: char.id || crypto.randomUUID(),
        project_id: projectId,
        name: char.name,
        description: char.description || '',
        primary_color: char.colors?.primary || '#4A90D9',
        secondary_color: char.colors?.secondary || '#F5A623',
        clothing: char.clothing || '',
        expressions: JSON.stringify(char.expressions || []),
        reference_image: char.referenceImage || null,
        generated_image: char.generatedImage || null,
        agent_config: JSON.stringify(char.agentConfig || { type: 'creative' }),
      };
      charactersOps.create(charData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update characters:', error);
    return NextResponse.json({ error: 'Failed to update characters' }, { status: 500 });
  }
}