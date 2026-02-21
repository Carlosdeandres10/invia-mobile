/**
 * Invia API Client — Typed wrapper for all panel_server.py endpoints
 *
 * Base URL should point to the Flask server.
 * Uses Axios with interceptors for auth session handling.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface AuthStatus {
  authenticated: boolean;
  user?: string;
  role?: string;
}

export interface LoginResponse {
  ok: boolean;
  user?: string;
  role?: string;
  error?: string;
}

export interface ApiStatusItem {
  name: string;
  configured: boolean;
  key_masked?: string;
}

export interface KpiData {
  apis: ApiStatusItem[];
  pipeline?: {
    last_run?: string;
    status?: string;
  };
}

export interface NielsenSalesRow {
  [key: string]: string | number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface RetailResult {
  titulo: string;
  precio: string | number;
  plataforma: string;
  url?: string;
  marca?: string;
  fecha?: string;
}

export interface DataExplorerResult {
  columns: string[];
  rows: (string | number | null)[][];
  row_count: number;
}

export interface PresentationExportResult {
  ok: boolean;
  artifact?: {
    id: string;
    title: string;
    created_at?: string;
    files?: Record<string, { filename?: string; size?: number; url?: string; public_url?: string }>;
    errors?: Record<string, string>;
  };
  error?: string;
}

// ------------------------------------------------------------------
// Storage keys
// ------------------------------------------------------------------
const STORAGE_KEY_BASE_URL = '@invia_base_url';
const DEFAULT_BASE_URL = 'https://hub.invia.es';

// ------------------------------------------------------------------
// Client class
// ------------------------------------------------------------------

class InviaApiClient {
  private client: AxiosInstance;
  private baseUrl: string = DEFAULT_BASE_URL;
  private sessionCookie: string = '';

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });

    // Response interceptor for session handling
    this.client.interceptors.response.use(
      (response) => {
        // Capture session cookie from Set-Cookie header
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          const sessionMatch = setCookie[0]?.match(/session=([^;]+)/);
          if (sessionMatch) {
            this.sessionCookie = sessionMatch[1];
          }
        }
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Session expired — will be handled by the auth store
        }
        return Promise.reject(error);
      }
    );

    // Request interceptor to add session cookie
    this.client.interceptors.request.use((config) => {
      if (this.sessionCookie) {
        config.headers.Cookie = `session=${this.sessionCookie}`;
      }
      config.baseURL = this.baseUrl;
      return config;
    });
  }

  // ------------------------------------------------------------------
  // Configuration
  // ------------------------------------------------------------------

  async loadBaseUrl(): Promise<string> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_BASE_URL);
    if (stored) {
      this.baseUrl = stored;
    }
    return this.baseUrl;
  }

  async setBaseUrl(url: string): Promise<void> {
    this.baseUrl = url.replace(/\/+$/, ''); // remove trailing slash
    await AsyncStorage.setItem(STORAGE_KEY_BASE_URL, this.baseUrl);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // ------------------------------------------------------------------
  // Auth
  // ------------------------------------------------------------------

  async getAuthStatus(): Promise<AuthStatus> {
    const { data } = await this.client.get<AuthStatus>('/api/auth/status');
    return data;
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const { data } = await this.client.post<LoginResponse>('/api/auth/login', {
      username,
      password,
    });
    return data;
  }

  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout');
    this.sessionCookie = '';
  }

  // ------------------------------------------------------------------
  // Status / KPIs
  // ------------------------------------------------------------------

  async getApiStatus(): Promise<{ apis: ApiStatusItem[] }> {
    const { data } = await this.client.get('/api/status');
    return data;
  }

  async getKeys(): Promise<Record<string, any>> {
    const { data } = await this.client.get('/api/keys');
    return data;
  }

  // ------------------------------------------------------------------
  // Chat (non-streaming request — fallback)
  // ------------------------------------------------------------------

  /**
   * For the SSE streaming chat, use the useSSE hook directly.
   * This is a simple request-response fallback.
   */
  async sendChatMessage(
    message: string,
    mode: string = 'pro',
    history: ChatMessage[] = []
  ): Promise<string> {
    const { data } = await this.client.post('/api/chat', {
      messages: [
        ...history.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
      mode,
    }, {
      headers: {
        'X-Client': 'mobile',
      },
    });
    return data?.data?.content || data?.content || data?.response || '';
  }

  getChatStreamUrl(): string {
    return `${this.baseUrl}/api/chat`;
  }

  // ------------------------------------------------------------------
  // Nielsen / Sales
  // ------------------------------------------------------------------

  async getSalesNielsen(): Promise<NielsenSalesRow[]> {
    const { data } = await this.client.get('/api/sales/nielsen');
    return data.data || data;
  }

  async getNielsenStatus(): Promise<Record<string, any>> {
    const { data } = await this.client.get('/api/nielsen/status');
    return data;
  }

  // ------------------------------------------------------------------
  // Retail
  // ------------------------------------------------------------------

  async testRetail(): Promise<RetailResult[]> {
    const { data } = await this.client.get('/api/test/retail');
    return data.results || data;
  }

  async testRetailTargeted(
    platform: string,
    query: string
  ): Promise<RetailResult[]> {
    const { data } = await this.client.post('/api/test/retail-targeted', {
      plataforma: platform,
      busqueda: query,
    });
    return data.results || data.data || [];
  }

  async scrapeRetailAdhoc(
    url: string,
    platform: string
  ): Promise<RetailResult[]> {
    const { data } = await this.client.post('/api/retail/scrape-adhoc', {
      url,
      plataforma: platform,
    });
    return data.results || data.data || [];
  }

  // ------------------------------------------------------------------
  // Climate / Weather
  // ------------------------------------------------------------------

  async testClima(): Promise<Record<string, any>> {
    const { data } = await this.client.get('/api/test/clima');
    return data;
  }

  async testVisualCrossing(): Promise<Record<string, any>> {
    const { data } = await this.client.get('/api/test/visualcrossing');
    return data;
  }

  // ------------------------------------------------------------------
  // Trends
  // ------------------------------------------------------------------

  async testTrends(): Promise<Record<string, any>> {
    const { data } = await this.client.get('/api/test/trends');
    return data;
  }

  // ------------------------------------------------------------------
  // Intelligence
  // ------------------------------------------------------------------

  async testIntelligence(): Promise<Record<string, any>> {
    const { data } = await this.client.get('/api/test/intelligence');
    return data;
  }

  // ------------------------------------------------------------------
  // Data Explorer (SQL)
  // ------------------------------------------------------------------

  async executeSQL(query: string): Promise<DataExplorerResult> {
    const { data } = await this.client.post('/api/studio/execute', {
      sql: query,
    });
    return data;
  }

  // ------------------------------------------------------------------
  // Pipeline
  // ------------------------------------------------------------------

  async getPipelineHistory(): Promise<Record<string, any>> {
    const { data } = await this.client.get('/api/pipeline/history');
    return data;
  }

  async runPipeline(): Promise<Record<string, any>> {
    const { data } = await this.client.post('/api/pipeline/run');
    return data;
  }

  async exportPresentation(
    answer: string,
    title: string = 'Presentación IA',
    formats: string[] = ['html']
  ): Promise<PresentationExportResult> {
    const { data } = await this.client.post<PresentationExportResult>(
      '/api/intelligence/presentation/export',
      { answer, title, formats },
      {
        headers: {
          'X-Client': 'mobile',
        },
      }
    );
    return data;
  }
}

// Singleton export
export const apiClient = new InviaApiClient();
