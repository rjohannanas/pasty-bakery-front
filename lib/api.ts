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
  status: 'pending' | 'completed' | 'failed' | 'done' | 'error' | 'cancelled' | 'processing';
  error?: string;
  result?: OptimizationResult;
  progress?: number;
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

  async getOptimizationStatus(jobId: string) {
    return this.get(`/optimize/${jobId}`);
  }

  async getQueueStatus() {
    return this.get('/optimize/queue/status');
  }

  async getResults(id?: string): Promise<OptimizationResult | OptimizationResult[]> {
    return this.get(id ? `/results/${id}` : '/results');
  }

  async getLogs(jobId?: string) {
    return this.get(jobId ? `/logs/lingo/${jobId}` : '/logs/lingo');
  }

  // Products endpoints
  async getProducts() {
    return this.get('/products');
  }

  async getProduct(id: string) {
    return this.get(`/products/${id}`);
  }

  async createProduct(data: unknown) {
    return this.post('/products', data);
  }

  async updateProduct(id: string, data: unknown) {
    return this.put(`/products/${id}`, data);
  }

  async deleteProduct(id: string) {
    return this.delete(`/products/${id}`);
  }

  // Product ingredients (Q matrix)
  async getProductIngredients(productId: string) {
    return this.get(`/products/${productId}/ingredients`);
  }

  async addProductIngredient(productId: string, data: unknown) {
    return this.post(`/products/${productId}/ingredients`, data);
  }

  async updateProductIngredient(productId: string, ingredientId: string, data: unknown) {
    return this.put(`/products/${productId}/ingredients/${ingredientId}`, data);
  }

  async deleteProductIngredient(productId: string, ingredientId: string) {
    return this.delete(`/products/${productId}/ingredients/${ingredientId}`);
  }

  // Product machines (T matrix)
  async getProductMachines(productId: string) {
    return this.get(`/products/${productId}/machines`);
  }

  async addProductMachine(productId: string, data: unknown) {
    return this.post(`/products/${productId}/machines`, data);
  }

  async updateProductMachine(productId: string, machineId: string, data: unknown) {
    return this.put(`/products/${productId}/machines/${machineId}`, data);
  }

  async deleteProductMachine(productId: string, machineId: string) {
    return this.delete(`/products/${productId}/machines/${machineId}`);
  }

  // Product operational resources (CM matrix)
  async getProductResources(productId: string) {
    return this.get(`/products/${productId}/operational-resources`);
  }

  async addProductResource(productId: string, data: unknown) {
    return this.post(`/products/${productId}/operational-resources`, data);
  }

  async updateProductResource(productId: string, resourceId: string, data: unknown) {
    return this.put(`/products/${productId}/operational-resources/${resourceId}`, data);
  }

  async deleteProductResource(productId: string, resourceId: string) {
    return this.delete(`/products/${productId}/operational-resources/${resourceId}`);
  }

  // Ingredients endpoints
  async getIngredients() {
    return this.get('/ingredients');
  }

  async getIngredient(id: string) {
    return this.get(`/ingredients/${id}`);
  }

  async createIngredient(data: unknown) {
    return this.post('/ingredients', data);
  }

  async updateIngredient(id: string, data: unknown) {
    return this.put(`/ingredients/${id}`, data);
  }

  async deleteIngredient(id: string) {
    return this.delete(`/ingredients/${id}`);
  }

  // Machines endpoints
  async getMachines() {
    return this.get('/machines');
  }

  async getMachine(id: string) {
    return this.get(`/machines/${id}`);
  }

  async createMachine(data: unknown) {
    return this.post('/machines', data);
  }

  async updateMachine(id: string, data: unknown) {
    return this.put(`/machines/${id}`, data);
  }

  async deleteMachine(id: string) {
    return this.delete(`/machines/${id}`);
  }

  // Stocks endpoints
  async getStocks() {
    return this.get('/stocks');
  }

  async getStock(id: string) {
    return this.get(`/stocks/${id}`);
  }

  async createStock(data: unknown) {
    return this.post('/stocks', data);
  }

  async updateStock(id: string, data: unknown) {
    return this.put(`/stocks/${id}`, data);
  }

  async deleteStock(id: string) {
    return this.delete(`/stocks/${id}`);
  }

  // Resources endpoints
  async getResources() {
    return this.get('/resources');
  }

  async createResource(data: unknown) {
    return this.post('/resources', data);
  }

  async deleteResource(id: string) {
    return this.delete(`/resources/${id}`);
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
