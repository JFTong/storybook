import { NextRequest, NextResponse } from 'next/server';
import { globalConfigOps } from '@/lib/db';

// GET /api/config/api-key - Get the actual API key (for server-side use)
// This should only be called by server-side API routes
export async function GET(request: NextRequest) {
  try {
    // Verify this is an internal request
    const authHeader = request.headers.get('x-internal-request');
    if (authHeader !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = globalConfigOps.get();
    return NextResponse.json({
      apiKey: config?.api_key || null,
      model: config?.model || 'gemini-2.0-flash-exp',
      feishuAppId: config?.feishu_app_id || null,
      feishuAppSecret: config?.feishu_app_secret || null,
      feishuEnabled: !!config?.feishu_enabled,
    });
  } catch (error) {
    console.error('Failed to get API config:', error);
    return NextResponse.json({ error: 'Failed to get API configuration' }, { status: 500 });
  }
}