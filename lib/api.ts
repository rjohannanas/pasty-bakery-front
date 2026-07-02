const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://pastyback.jblasc.com/api';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://pastyback.jblasc.com/ws';

export interface OptimizationParams {
  daily_stock: Record<string, number>;
  available_resources: Record<string, number>;
  target_production: number;
  min_variety: number;
}

export interface OptimizationResult {
  id: string;
  timestamp: string;
  quantity_to_produce: Record<string, number>;
  batch_active: Record<string, number>;
  variety_flag: Record<string, boolean>;
  expected_profit: number;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  }

  // Optimization endpoints
  async runOptimization(params: OptimizationParams): Promise<OptimizationResult> {
    return this.post('/optimize', params);
  }

  async getResults(id?: string): Promise<OptimizationResult | OptimizationResult[]> {
    return this.get(id ? `/results/${id}` : '/results');
  }

  async getProducts() {
    return this.get('/products');
  }

  async getIngredients() {
    return this.get('/ingredients');
  }

  async getMachines() {
    return this.get('/machines');
  }

  async createProduct(data: unknown) {
    return this.post('/products', data);
  }

  async createIngredient(data: unknown) {
    return this.post('/ingredients', data);
  }

  async createMachine(data: unknown) {
    return this.post('/machines', data);
  }
}

export const apiClient = new ApiClient();

export function createWebSocketConnection(onMessage: (data: unknown) => void, onError?: (error: Event) => void) {
  const ws = new WebSocket(WS_BASE_URL);
  
  ws.onopen = () => {
    console.log('[v0] WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('[v0] WebSocket message parse error:', e);
    }
  };

  ws.onerror = (error) => {
    console.error('[v0] WebSocket error:', error);
    onError?.(error);
  };

  ws.onclose = () => {
    console.log('[v0] WebSocket disconnected');
  };

  return ws;
}
