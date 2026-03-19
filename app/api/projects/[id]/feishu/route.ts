import { NextRequest, NextResponse } from 'next/server';
import { globalConfigOps, storiesOps, storyboardsOps, imagesOps, feishuOps, projectsOps } from '@/lib/db';
import { FeishuClient } from '@/lib/feishu';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/projects/[id]/feishu - Sync project to Feishu
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    // Get global config
    const config = globalConfigOps.get();
    if (!config?.feishu_app_id || !config?.feishu_app_secret || !config?.feishu_enabled) {
      return NextResponse.json(
        { error: 'Feishu integration is not configured or enabled' },
        { status: 400 }
      );
    }

    // Get project data
    const project = projectsOps.getById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const story = storiesOps.getByProject(projectId);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 400 });
    }

    const storyboardsDb = storyboardsOps.getByStory(story.id);
    const images = imagesOps.getByStory(story.id);

    // Build storyboards with images
    const imagesMap = new Map(images.map(img => [img.storyboard_id, img]));
    const storyboards = storyboardsDb.map(sb => ({
      pageNumber: sb.page_number,
      scene: sb.scene,
      description: sb.description,
      visualPrompt: sb.visual_prompt,
      imageData: imagesMap.get(sb.id)?.image_data || undefined,
    }));

    // Create Feishu client
    const feishuClient = new FeishuClient({
      appId: config.feishu_app_id,
      appSecret: config.feishu_app_secret,
    });

    // Check if document already exists
    const existingDoc = feishuOps.getDocument(projectId);
    let documentId: string;
    let documentUrl: string;

    try {
      if (existingDoc) {
        // For existing documents, we'd need to update instead of create
        // For simplicity, we'll create a new document each time
        const result = await feishuClient.syncStorybook({
          title: `${project.title} (Updated)`,
          theme: story.theme,
          storyContent: story.content || '',
          storyboards,
        });
        documentId = result.documentId;
        documentUrl = result.documentUrl;

        // Update existing record
        feishuOps.updateDocument(projectId, { document_id: documentId, document_url: documentUrl });
      } else {
        // Create new document
        const result = await feishuClient.syncStorybook({
          title: project.title,
          theme: story.theme,
          storyContent: story.content || '',
          storyboards,
        });
        documentId = result.documentId;
        documentUrl = result.documentUrl;

        // Save document mapping
        feishuOps.createDocument({
          id: crypto.randomUUID(),
          project_id: projectId,
          document_id: documentId,
          document_url: documentUrl,
        });
      }

      // Log success
      feishuOps.addSyncLog({
        id: crypto.randomUUID(),
        project_id: projectId,
        document_id: documentId,
        operation: existingDoc ? 'update' : 'create',
        status: 'success',
        error_message: null,
      });

      return NextResponse.json({
        success: true,
        documentUrl,
        documentId,
      });
    } catch (syncError) {
      const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error';

      // Log failure
      feishuOps.addSyncLog({
        id: crypto.randomUUID(),
        project_id: projectId,
        document_id: null,
        operation: existingDoc ? 'update' : 'create',
        status: 'failed',
        error_message: errorMessage,
      });

      return NextResponse.json(
        { error: `Failed to sync to Feishu: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to sync to Feishu:', error);
    return NextResponse.json(
      { error: 'Failed to sync to Feishu' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/feishu - Get Feishu sync status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    const document = feishuOps.getDocument(projectId);
    const syncLogs = feishuOps.getSyncLogs(projectId, 5);

    return NextResponse.json({
      document: document ? {
        id: document.id,
        documentId: document.document_id,
        documentUrl: document.document_url,
        createdAt: document.created_at,
        updatedAt: document.updated_at,
      } : null,
      syncLogs: syncLogs.map(log => ({
        id: log.id,
        operation: log.operation,
        status: log.status,
        errorMessage: log.error_message,
        syncedAt: log.synced_at,
      })),
    });
  } catch (error) {
    console.error('Failed to get Feishu sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get Feishu sync status' },
      { status: 500 }
    );
  }
}