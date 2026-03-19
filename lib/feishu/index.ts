/**
 * Feishu API Client for document creation and sync
 */

interface FeishuConfig {
  appId: string;
  appSecret: string;
}

interface AccessTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

interface CreateDocumentResponse {
  code: number;
  msg: string;
  data: {
    document: {
      document_id: string;
      title: string;
      revision_id: number;
    };
  };
}

interface CreateBlockResponse {
  code: number;
  msg: string;
  data: {
    children: Array<{
      block_type: number;
      block_id: string;
    }>;
  };
}

export class FeishuClient {
  private appId: string;
  private appSecret: string;
  private accessToken: string | null = null;
  private tokenExpireAt: number = 0;

  constructor(config: FeishuConfig) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
  }

  /**
   * Get tenant access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpireAt) {
      return this.accessToken;
    }

    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: this.appId,
        app_secret: this.appSecret,
      }),
    });

    const data: AccessTokenResponse = await response.json();

    if (data.code !== 0) {
      throw new Error(`Failed to get access token: ${data.msg}`);
    }

    this.accessToken = data.tenant_access_token;
    // Set expiry 5 minutes before actual expiry
    this.tokenExpireAt = Date.now() + (data.expire - 300) * 1000;

    return this.accessToken;
  }

  /**
   * Create a new document
   */
  async createDocument(title: string): Promise<{ documentId: string; documentUrl: string }> {
    const token = await this.getAccessToken();

    const response = await fetch('https://open.feishu.cn/open-apis/docx/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
      }),
    });

    const data: CreateDocumentResponse = await response.json();

    if (data.code !== 0) {
      throw new Error(`Failed to create document: ${data.msg}`);
    }

    const documentId = data.data.document.document_id;
    const documentUrl = `https://feishu.cn/docx/${documentId}`;

    return { documentId, documentUrl };
  }

  /**
   * Add a heading block to a document
   */
  async addHeading(documentId: string, text: string, level: 1 | 2 | 3 = 1): Promise<string> {
    const token = await this.getAccessToken();

    const response = await fetch(`https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        children: [
          {
            block_type: 4, // heading
            heading1: level === 1 ? {
              elements: [{ text_run: { content: text } }],
              style: {},
            } : undefined,
            heading2: level === 2 ? {
              elements: [{ text_run: { content: text } }],
              style: {},
            } : undefined,
            heading3: level === 3 ? {
              elements: [{ text_run: { content: text } }],
              style: {},
            } : undefined,
          },
        ],
        index: 0,
      }),
    });

    const data: CreateBlockResponse = await response.json();

    if (data.code !== 0) {
      throw new Error(`Failed to add heading: ${data.msg}`);
    }

    return data.data.children[0].block_id;
  }

  /**
   * Add a text block to a document
   */
  async addText(documentId: string, text: string): Promise<string> {
    const token = await this.getAccessToken();

    const response = await fetch(`https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        children: [
          {
            block_type: 2, // text
            text: {
              elements: [{ text_run: { content: text } }],
              style: {},
            },
          },
        ],
        index: 0,
      }),
    });

    const data: CreateBlockResponse = await response.json();

    if (data.code !== 0) {
      throw new Error(`Failed to add text: ${data.msg}`);
    }

    return data.data.children[0].block_id;
  }

  /**
   * Add a table to a document
   */
  async addTable(documentId: string, headers: string[], rows: string[][]): Promise<string> {
    const token = await this.getAccessToken();

    const response = await fetch(`https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        children: [
          {
            block_type: 20, // table
            table: {
              property: {
                row_size: rows.length + 1,
                column_size: headers.length,
              },
              cells: [
                // Header row
                ...headers.map((header, colIndex) => ({
                  row_index: 0,
                  column_index: colIndex,
                  content: [{
                    block_type: 2,
                    text: {
                      elements: [{ text_run: { content: header } }],
                    },
                  }],
                })),
                // Data rows
                ...rows.flatMap((row, rowIndex) =>
                  row.map((cell, colIndex) => ({
                    row_index: rowIndex + 1,
                    column_index: colIndex,
                    content: [{
                      block_type: 2,
                      text: {
                        elements: [{ text_run: { content: cell } }],
                      },
                    }],
                  }))
                ),
              ],
            },
          },
        ],
        index: 0,
      }),
    });

    const data: CreateBlockResponse = await response.json();

    if (data.code !== 0) {
      throw new Error(`Failed to add table: ${data.msg}`);
    }

    return data.data.children[0].block_id;
  }

  /**
   * Add an image to a document (from base64)
   */
  async addImage(documentId: string, imageBase64: string, imageName: string = 'image.jpg'): Promise<string> {
    const token = await this.getAccessToken();

    // First upload the image
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), imageName);
    formData.append('file_name', imageName);
    formData.append('parent_type', 'docx_image');
    formData.append('parent_node_key', documentId);

    const uploadResponse = await fetch('https://open.feishu.cn/open-apis/drive/v1/medias/upload_all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const uploadData = await uploadResponse.json();

    if (uploadData.code !== 0) {
      throw new Error(`Failed to upload image: ${uploadData.msg}`);
    }

    const fileToken = uploadData.data.file_token;

    // Then add the image block
    const response = await fetch(`https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        children: [
          {
            block_type: 27, // image
            image: {
              token: fileToken,
            },
          },
        ],
        index: 0,
      }),
    });

    const data: CreateBlockResponse = await response.json();

    if (data.code !== 0) {
      throw new Error(`Failed to add image: ${data.msg}`);
    }

    return data.data.children[0].block_id;
  }

  /**
   * Sync a storybook to a Feishu document
   */
  async syncStorybook(params: {
    title: string;
    theme: string;
    storyContent: string;
    storyboards: Array<{
      pageNumber: number;
      scene: string;
      description: string;
      visualPrompt: string;
      imageData?: string;
    }>;
  }): Promise<{ documentId: string; documentUrl: string }> {
    const { title, theme, storyContent, storyboards } = params;

    // Create document
    const { documentId, documentUrl } = await this.createDocument(title);

    // Add title
    await this.addHeading(documentId, title, 1);

    // Add theme
    await this.addHeading(documentId, 'Theme', 2);
    await this.addText(documentId, theme);

    // Add story content
    await this.addHeading(documentId, 'Story', 2);
    await this.addText(documentId, storyContent);

    // Add storyboards table
    await this.addHeading(documentId, 'Storyboards', 2);
    await this.addTable(
      documentId,
      ['Page', 'Scene', 'Description', 'Visual Prompt'],
      storyboards.map(sb => [
        String(sb.pageNumber),
        sb.scene,
        sb.description,
        sb.visualPrompt,
      ])
    );

    // Add images
    await this.addHeading(documentId, 'Images', 2);
    for (const sb of storyboards) {
      if (sb.imageData) {
        await this.addHeading(documentId, `Page ${sb.pageNumber}: ${sb.scene}`, 3);
        await this.addImage(documentId, sb.imageData, `page-${sb.pageNumber}.jpg`);
      }
    }

    return { documentId, documentUrl };
  }
}