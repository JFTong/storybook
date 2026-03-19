import { NextRequest, NextResponse } from 'next/server';
import { charactersOps, projectsOps } from '@/lib/db';
import { type Character } from '@/types';

interface RouteParams {
  params: Promise<{ id: string; charId: string }>;
}

// GET /api/projects/[id]/characters/[charId] - Get a single character
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { charId } = await params;
    const character = charactersOps.getById(charId);

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    return NextResponse.json({
      character: {
        id: character.id,
        name: character.name,
        description: character.description,
        colors: {
          primary: character.primary_color,
          secondary: character.secondary_color,
        },
        clothing: character.clothing,
        expressions: JSON.parse(character.expressions || '[]'),
        referenceImage: character.reference_image || undefined,
        generatedImage: character.generated_image || undefined,
        agentConfig: JSON.parse(character.agent_config || '{"type":"creative"}'),
      }
    });
  } catch (error) {
    console.error('Failed to get character:', error);
    return NextResponse.json({ error: 'Failed to get character' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/characters/[charId] - Update a character
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { charId } = await params;
    const existing = charactersOps.getById(charId);

    if (!existing) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, string | null> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.colors?.primary !== undefined) updates.primary_color = body.colors.primary;
    if (body.colors?.secondary !== undefined) updates.secondary_color = body.colors.secondary;
    if (body.clothing !== undefined) updates.clothing = body.clothing;
    if (body.expressions !== undefined) updates.expressions = JSON.stringify(body.expressions);
    if (body.referenceImage !== undefined) updates.reference_image = body.referenceImage;
    if (body.generatedImage !== undefined) updates.generated_image = body.generatedImage;
    if (body.agentConfig !== undefined) updates.agent_config = JSON.stringify(body.agentConfig);

    const updated = charactersOps.update(charId, updates);

    return NextResponse.json({
      character: {
        id: updated!.id,
        name: updated!.name,
        description: updated!.description,
        colors: {
          primary: updated!.primary_color,
          secondary: updated!.secondary_color,
        },
        clothing: updated!.clothing,
        expressions: JSON.parse(updated!.expressions || '[]'),
        referenceImage: updated!.reference_image || undefined,
        generatedImage: updated!.generated_image || undefined,
        agentConfig: JSON.parse(updated!.agent_config || '{"type":"creative"}'),
      }
    });
  } catch (error) {
    console.error('Failed to update character:', error);
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/characters/[charId] - Delete a character
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { charId } = await params;
    const deleted = charactersOps.delete(charId);

    if (!deleted) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete character:', error);
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 });
  }
}