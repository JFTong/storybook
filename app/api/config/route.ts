import { NextRequest, NextResponse } from 'next/server';
import { globalConfigOps } from '@/lib/db';

// GET /api/config - Get global configuration
export async function GET() {
  try {
    const config = globalConfigOps.get();

    // Don't expose sensitive fields entirely, but return enough for the UI
    return NextResponse.json({
      apiKey: config?.api_key ? '********' : null, // Masked
      hasApiKey: !!config?.api_key,
      model: config?.model || 'gemini-2.0-flash-exp',
      feishuAppId: config?.feishu_app_id ? '********' : null,
      hasFeishuAppId: !!config?.feishu_app_id,
      hasFeishuAppSecret: !!config?.feishu_app_secret,
      feishuEnabled: !!config?.feishu_enabled,
    });
  } catch (error) {
    console.error('Failed to get config:', error);
    return NextResponse.json({ error: 'Failed to get configuration' }, { status: 500 });
  }
}

// POST /api/config - Create or update global configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, model, feishuAppId, feishuAppSecret, feishuEnabled } = body;

    // Only update fields that are provided
    const updates: Record<string, string | number | undefined> = {};

    if (apiKey !== undefined) {
      updates.api_key = apiKey;
    }
    if (model !== undefined) {
      updates.model = model;
    }
    if (feishuAppId !== undefined) {
      updates.feishu_app_id = feishuAppId;
    }
    if (feishuAppSecret !== undefined) {
      updates.feishu_app_secret = feishuAppSecret;
    }
    if (feishuEnabled !== undefined) {
      updates.feishu_enabled = feishuEnabled ? 1 : 0;
    }

    globalConfigOps.upsert(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}

// DELETE /api/config - Clear sensitive configuration
export async function DELETE() {
  try {
    globalConfigOps.upsert({
      api_key: null,
      feishu_app_id: null,
      feishu_app_secret: null,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear config:', error);
    return NextResponse.json({ error: 'Failed to clear configuration' }, { status: 500 });
  }
}