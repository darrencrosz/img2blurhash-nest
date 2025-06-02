export interface ClientOptions {
  baseUrl?: string;
  token?: string;
}

export interface UrlOptions {
  componentX?: number;
  componentY?: number;
}

export interface DecodeOptions {
  width?: number;
  height?: number;
  punch?: number;
}

export interface BatchUrlItem extends UrlOptions {
  url: string;
}

export interface BatchDecodeItem extends DecodeOptions {
  blurhash: string;
}

export interface MixedBatchItem extends UrlOptions {
  type: 'url' | 'file';
  value: string; // url or filename
}

export class BlurhashClient {
  private baseUrl: string;
  private token?: string;

  constructor(options?: ClientOptions) {
    this.baseUrl = options?.baseUrl ?? 'http://localhost:3000/api/v1';
    this.token = options?.token;
  }

  private headers(isForm = false): Record<string, string> {
    const headers: Record<string, string> = {};
    if (!isForm) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async login(apiKey: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ apiKey }),
    });
    if (!res.ok) {
      throw new Error(`Login failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    this.token = data?.data?.token;
    return this.token as string;
  }

  async generateFromUrl(url: string, options?: UrlOptions): Promise<any> {
    const res = await fetch(`${this.baseUrl}/blurhashes/url`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ url, ...options }),
    });
    return res.json();
  }

  async batchFromUrl(items: BatchUrlItem[]): Promise<any> {
    const res = await fetch(`${this.baseUrl}/blurhashes/batch-url`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ items }),
    });
    return res.json();
  }

  async uploadFile(filePath: string, options?: UrlOptions): Promise<any> {
    const fs = await import('fs');
    const path = await import('path');
    const form = new FormData();
    const buffer = fs.readFileSync(filePath);
    form.append('file', new Blob([buffer]), path.basename(filePath));
    if (options?.componentX !== undefined) {
      form.append('componentX', String(options.componentX));
    }
    if (options?.componentY !== undefined) {
      form.append('componentY', String(options.componentY));
    }
    const res = await fetch(`${this.baseUrl}/blurhashes/upload-file`, {
      method: 'POST',
      headers: this.headers(true),
      body: form,
    });
    return res.json();
  }

  async mixedBatch(items: MixedBatchItem[], files?: Record<string, string>): Promise<any> {
    const fs = await import('fs');
    const path = await import('path');
    const form = new FormData();
    if (files) {
      for (const [name, filePath] of Object.entries(files)) {
        const buffer = fs.readFileSync(filePath);
        form.append('files', new Blob([buffer]), name);
      }
    }
    form.append('items', JSON.stringify({ items }));
    const res = await fetch(`${this.baseUrl}/blurhashes/mixed-batch`, {
      method: 'POST',
      headers: this.headers(true),
      body: form,
    });
    return res.json();
  }

  async decode(blurhash: string, options?: DecodeOptions): Promise<Buffer> {
    const res = await fetch(`${this.baseUrl}/blurhashes/decode`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ blurhash, ...options }),
    });
    if (!res.ok) {
      throw new Error(`Decode failed: ${res.status} ${res.statusText}`);
    }
    const array = await res.arrayBuffer();
    return Buffer.from(array);
  }

  async batchDecode(items: BatchDecodeItem[]): Promise<any> {
    const res = await fetch(`${this.baseUrl}/blurhashes/batch-decode`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ blurhashes: items }),
    });
    return res.json();
  }
}
