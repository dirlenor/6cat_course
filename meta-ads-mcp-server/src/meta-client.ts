import { getMetaConfig, type MetaConfig } from "./config.js";

type GraphList<T> = {
  data?: T[];
  paging?: {
    cursors?: { before?: string; after?: string };
    next?: string;
  };
};

export class MetaApiError extends Error {}

export class MetaClient {
  private readonly config: MetaConfig;

  constructor(config = getMetaConfig()) {
    this.config = config;
  }

  get adAccountId(): string {
    return this.config.adAccountId;
  }

  async get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    const url = new URL(`https://graph.facebook.com/${this.config.graphApiVersion}/${path.replace(/^\/+/, "")}`);
    url.searchParams.set("access_token", this.config.accessToken);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    } catch {
      throw new MetaApiError("Could not reach Meta Marketing API. Check your network connection and try again.");
    }

    const body = await response.json().catch(() => ({})) as { error?: { message?: string; code?: number } } & T;
    if (!response.ok || body.error) {
      const detail = body.error?.message || `HTTP ${response.status}`;
      throw new MetaApiError(`Meta Marketing API request failed: ${detail}`);
    }
    return body;
  }

  async list<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<GraphList<T>> {
    return this.get<GraphList<T>>(path, params);
  }
}
