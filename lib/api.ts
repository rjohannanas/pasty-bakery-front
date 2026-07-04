import type { components } from './generated/openapi';
import { logDuration, logEvent } from './logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://pastyback.jblasc.com/api';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://pastyback.jblasc.com/ws';
// El backend no maneja login/usuarios: un header fijo compartido evita que
// cualquiera con la URL pegue directo a la API. No es un secreto fuerte
// (vive en el bundle del cliente), solo un filtro contra acceso casual.
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

type Schema<Name extends keyof components['schemas']> = components['schemas'][Name];

export type Scenario = Schema<'Scenario'>;
export type ScenarioStatus = Schema<'ScenarioStatus'>;
export type Product = Schema<'Product'> & {
  ingredients?: ProductIngredient[];
  machines?: ProductMachine[];
  operational_resources?: ProductOperationalResource[];
};
export type Ingredient = Schema<'Ingredient'>;
export type Machine = Schema<'Machine'>;
export type OperationalResource = Schema<'OperationalResource'>;
export type JobStatus = Schema<'OptimizationStatus'>;
export type OptimizationResultRow = Schema<'OptimizationResult'> & {
  product?: Product;
};
export type Optimization = Schema<'Optimization'> & {
  id: number;
  job_id: string;
  status: JobStatus;
  created_at: string;
  total_profit?: number;
  results?: OptimizationResultRow[];
  scenario?: ScenarioDetail;
};

export interface ScenarioDetail extends Scenario {
  products?: Product[];
  ingredients?: Ingredient[];
  machines?: Machine[];
  operational_resources?: OperationalResource[];
}

export interface StockIngredient {
  id: number;
  stock_id: number;
  ingredient_id: number;
  quantity_available: number;
  ingredient?: Ingredient;
}

export interface Stock {
  id: number;
  name: string;
  scenario_id: number;
  ingredients?: StockIngredient[];
}

export interface ResourceMachine {
  id: number;
  resource_id: number;
  machine_id: number;
  capacity_minutes: number;
  machine?: Machine;
}

export interface Resource {
  id: number;
  name: string;
  scenario_id: number;
  machines?: ResourceMachine[];
  operational_resources?: OperationalResource[];
}

export interface ProductIngredient {
  id: number;
  product_id: number;
  ingredient_id: number;
  quantity: number;
  ingredient?: Ingredient;
}

export interface ProductMachine {
  id: number;
  product_id: number;
  machine_id: number;
  minutes_per_unit: number;
  machine?: Machine;
}

export interface ProductOperationalResource {
  id: number;
  product_id: number;
  operational_resource_id: number;
  consumption_per_batch: number;
  operational_resource?: OperationalResource;
}

export interface LingoLog {
  id: number;
  job_id: string;
  optimization_id: number;
  level: string;
  message: string;
  model_generated?: string;
  lingo_output?: string;
  duration_ms?: number;
  created_at: string;
}

export interface RunOptimizationParams {
  scenario_id?: number;
  max_production?: number;
  min_variety?: number;
  use_integer_vars?: boolean;
  use_binary_vars?: boolean;
}

function normalizeApiError(response: Response, body: unknown) {
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }
  return `API error: ${response.status} ${response.statusText}`;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function summarizePayload(payload: unknown): unknown {
  if (Array.isArray(payload)) return { type: 'array', length: payload.length };
  if (payload && typeof payload === 'object') return { type: 'object', keys: Object.keys(payload).slice(0, 20) };
  return payload;
}

class ApiClient {
  private baseUrl: string;
  private activeScenarioId: number | null = null;
  private activeScenarioPromise: Promise<ScenarioDetail> | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['X-API-Key'] = API_KEY;
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const startedAt = performance.now();
    logEvent('debug', 'api', 'HTTP request started', { method: 'GET', endpoint });
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.headers(),
    });
    const body = response.status === 204 ? undefined : await response.json().catch(() => undefined);
    logDuration('api', 'HTTP request finished', startedAt, {
      method: 'GET',
      endpoint,
      status: response.status,
      ok: response.ok,
      response: summarizePayload(body),
    });
    if (!response.ok) throw new ApiError(normalizeApiError(response, body), response.status);
    return body as T;
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const startedAt = performance.now();
    logEvent('debug', 'api', 'HTTP request started', {
      method: 'POST',
      endpoint,
      request: summarizePayload(data),
    });
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.headers(),
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const body = response.status === 204 ? undefined : await response.json().catch(() => undefined);
    logDuration('api', 'HTTP request finished', startedAt, {
      method: 'POST',
      endpoint,
      status: response.status,
      ok: response.ok,
      response: summarizePayload(body),
    });
    if (!response.ok) throw new ApiError(normalizeApiError(response, body), response.status);
    return body as T;
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const startedAt = performance.now();
    logEvent('debug', 'api', 'HTTP request started', {
      method: 'PUT',
      endpoint,
      request: summarizePayload(data),
    });
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
    const body = response.status === 204 ? undefined : await response.json().catch(() => undefined);
    logDuration('api', 'HTTP request finished', startedAt, {
      method: 'PUT',
      endpoint,
      status: response.status,
      ok: response.ok,
      response: summarizePayload(body),
    });
    if (!response.ok) throw new ApiError(normalizeApiError(response, body), response.status);
    return body as T;
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const startedAt = performance.now();
    logEvent('debug', 'api', 'HTTP request started', {
      method: 'PATCH',
      endpoint,
      request: summarizePayload(data),
    });
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
    const body = response.status === 204 ? undefined : await response.json().catch(() => undefined);
    logDuration('api', 'HTTP request finished', startedAt, {
      method: 'PATCH',
      endpoint,
      status: response.status,
      ok: response.ok,
      response: summarizePayload(body),
    });
    if (!response.ok) throw new ApiError(normalizeApiError(response, body), response.status);
    return body as T;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const startedAt = performance.now();
    logEvent('debug', 'api', 'HTTP request started', { method: 'DELETE', endpoint });
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    const body = response.status === 204 ? undefined : await response.json().catch(() => undefined);
    logDuration('api', 'HTTP request finished', startedAt, {
      method: 'DELETE',
      endpoint,
      status: response.status,
      ok: response.ok,
      response: summarizePayload(body),
    });
    if (!response.ok) throw new ApiError(normalizeApiError(response, body), response.status);
    return body as T;
  }

  clearActiveScenarioCache() {
    logEvent('debug', 'scenario', 'Active scenario cache cleared', {
      previous_scenario_id: this.activeScenarioId,
    });
    this.activeScenarioId = null;
    this.activeScenarioPromise = null;
  }

  async getScenarios(includeArchived = false): Promise<Scenario[]> {
    return this.get(`/scenarios?include_archived=${includeArchived ? 'true' : 'false'}`);
  }

  async createScenario(data: components['schemas']['ScenarioCreate']): Promise<Scenario> {
    logEvent('info', 'scenario', 'Creating scenario', { name: data.name });
    const scenario = await this.post<Scenario>('/scenarios', data);
    this.activeScenarioId = scenario.id;
    this.activeScenarioPromise = null;
    logEvent('info', 'scenario', 'Scenario created and selected', {
      scenario_id: scenario.id,
      status: scenario.status,
    });
    return scenario;
  }

  async cloneScenario(id: number, name?: string): Promise<Scenario> {
    logEvent('info', 'scenario', 'Cloning scenario', { source_scenario_id: id, name });
    const scenario = await this.post<Scenario>(`/scenarios/${id}/clone`, name ? { name } : undefined);
    this.activeScenarioId = scenario.id;
    this.activeScenarioPromise = null;
    logEvent('info', 'scenario', 'Scenario cloned and selected', {
      scenario_id: scenario.id,
      parent_id: scenario.parent_id,
      status: scenario.status,
    });
    return scenario;
  }

  async updateScenario(id: number, data: components['schemas']['ScenarioUpdate']): Promise<Scenario> {
    const scenario = await this.patch<Scenario>(`/scenarios/${id}`, data);
    this.activeScenarioPromise = null;
    return scenario;
  }

  async getScenario(id: number): Promise<ScenarioDetail> {
    return this.get<ScenarioDetail>(`/scenarios/${id}`);
  }

  // Si el escenario ya no es draft (se congeló al optimizar), busca un draft
  // ya forkeado de él (parent_id) antes de clonar uno nuevo. Nombres de
  // escenario son únicos globales, así que el nombre del clon se genera
  // contra la lista real (no un literal fijo que choque con clones previos).
  // Si igual choca (409, carrera con otra pestaña) reintenta re-resolviendo
  // desde cero, así levanta el draft que haya ganado la carrera.
  private async resolveDraftScenarioId(scenario: Scenario | ScenarioDetail, attempt = 0): Promise<number> {
    if (scenario.status === 'draft') return scenario.id;
    if (attempt > 5) throw new Error(`No se pudo clonar el escenario ${scenario.id}: demasiados reintentos por nombre duplicado`);

    const scenarios = await this.getScenarios();
    const existingDraft = scenarios.find((s) => s.status === 'draft' && s.parent_id === scenario.id);
    if (existingDraft) {
      logEvent('info', 'scenario', 'Reusing existing draft fork', {
        parent_id: scenario.id,
        draft_id: existingDraft.id,
      });
      return existingDraft.id;
    }

    const existingNames = new Set(scenarios.map((s) => s.name));
    let name = `${scenario.name} - editable`;
    let suffix = 2;
    while (existingNames.has(name)) {
      name = `${scenario.name} - editable (${suffix})`;
      suffix += 1;
    }

    logEvent('info', 'scenario', 'No draft fork found; cloning frozen scenario', {
      parent_id: scenario.id,
      name,
      attempt,
    });

    try {
      const cloned = await this.cloneScenario(scenario.id, name);
      return cloned.id;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        logEvent('warn', 'scenario', 'Clone name collided; re-resolving draft', { name, attempt });
        return this.resolveDraftScenarioId(scenario, attempt + 1);
      }
      throw error;
    }
  }

  async getActiveScenario(): Promise<ScenarioDetail> {
    if (this.activeScenarioPromise) {
      logEvent('debug', 'scenario', 'Using active scenario promise/cache', {
        scenario_id: this.activeScenarioId,
      });
      return this.activeScenarioPromise;
    }

    this.activeScenarioPromise = (async () => {
      if (this.activeScenarioId) {
        logEvent('debug', 'scenario', 'Loading selected scenario', {
          scenario_id: this.activeScenarioId,
        });
        const cached = await this.getScenario(this.activeScenarioId);
        if (cached.status === 'draft') return cached;

        logEvent('info', 'scenario', 'Cached scenario no longer draft; resolving a draft', {
          scenario_id: cached.id,
          status: cached.status,
        });
        const draftId = await this.resolveDraftScenarioId(cached);
        this.activeScenarioId = draftId;
        return this.getScenario(draftId);
      }

      const scenarios = await this.getScenarios();
      logEvent('debug', 'scenario', 'Scenarios loaded for active selection', {
        count: scenarios.length,
        draft_count: scenarios.filter((scenario) => scenario.status === 'draft').length,
      });
      const active =
        scenarios.find((scenario) => scenario.status === 'draft' && scenario.is_base) ??
        scenarios.find((scenario) => scenario.status === 'draft') ??
        scenarios.find((scenario) => scenario.is_base && scenario.status !== 'archived') ??
        scenarios.find((scenario) => scenario.status !== 'archived');

      if (!active) {
        logEvent('info', 'scenario', 'No scenario found; creating base draft');
        const created = await this.createScenario({ name: 'Plan base' });
        this.activeScenarioId = created.id;
        return this.getScenario(created.id);
      }

      const draftId = await this.resolveDraftScenarioId(active);
      this.activeScenarioId = draftId;
      const draft = await this.getScenario(draftId);
      logEvent('info', 'scenario', 'Active scenario selected', {
        scenario_id: draft.id,
        status: draft.status,
        parent_id: draft.parent_id,
      });
      return draft;
    })();

    return this.activeScenarioPromise;
  }

  private async scenarioPath(path: string, scenarioId?: number) {
    const id = scenarioId ?? (await this.getActiveScenario()).id;
    logEvent('debug', 'scenario', 'Resolved scenario path', { scenario_id: id, path });
    return `/scenarios/${id}${path}`;
  }

  private scenarioToStock(scenario: ScenarioDetail): Stock {
    return {
      id: scenario.id,
      name: scenario.name,
      scenario_id: scenario.id,
      ingredients: (scenario.ingredients ?? []).map((ingredient) => ({
        id: ingredient.id,
        stock_id: scenario.id,
        ingredient_id: ingredient.id,
        quantity_available: ingredient.stock_available,
        ingredient,
      })),
    };
  }

  private scenarioToResource(scenario: ScenarioDetail): Resource {
    return {
      id: scenario.id,
      name: scenario.name,
      scenario_id: scenario.id,
      machines: (scenario.machines ?? []).map((machine) => ({
        id: machine.id,
        resource_id: scenario.id,
        machine_id: machine.id,
        capacity_minutes: machine.capacity_minutes,
        machine,
      })),
      operational_resources: scenario.operational_resources ?? [],
    };
  }

  // Optimization endpoints
  async runOptimization(params: RunOptimizationParams): Promise<{ job_id: string; status: JobStatus }> {
    const scenarioId = params.scenario_id ?? (await this.getActiveScenario()).id;
    logEvent('info', 'optimization', 'Starting optimization request', {
      scenario_id: scenarioId,
      max_production: params.max_production,
      min_variety: params.min_variety,
      use_integer_vars: params.use_integer_vars,
      use_binary_vars: params.use_binary_vars,
    });

    const payload: Record<string, unknown> = {};
    if (params.max_production !== undefined) payload.max_production = params.max_production;
    if (params.use_binary_vars !== false && params.min_variety !== undefined) {
      payload.min_variety = params.min_variety;
    }
    if (params.use_integer_vars !== undefined) payload.use_integer_vars = params.use_integer_vars;
    if (params.use_binary_vars !== undefined) payload.use_binary_vars = params.use_binary_vars;

    return this.post(`/scenarios/${scenarioId}/optimize`, payload);
  }

  async getOptimizationStatus(jobId: string): Promise<Optimization> {
    return this.get(`/optimizations/${jobId}`);
  }

  async getQueueStatus() {
    return this.get('/optimize/queue/status');
  }

  async getResults(): Promise<Optimization[]>;
  async getResults(id: number): Promise<Optimization>;
  async getResults(id?: number): Promise<Optimization | Optimization[]> {
    return this.get(id ? `/results/${id}` : '/results');
  }

  async getLogs(jobId?: string): Promise<LingoLog[]> {
    return this.get(jobId ? `/logs/lingo/${jobId}` : '/logs/lingo');
  }

  // Products endpoints
  async getProducts(scenarioId?: number): Promise<Product[]> {
    return this.get(await this.scenarioPath('/products', scenarioId));
  }

  async getProduct(id: number, scenarioId?: number): Promise<Product> {
    const scenario = scenarioId ? await this.getScenario(scenarioId) : await this.getActiveScenario();
    const product = (scenario.products ?? []).find((item) => item.id === id);
    if (!product) throw new Error('Producto no encontrado en el escenario activo');
    return product;
  }

  async createProduct(data: components['schemas']['ProductInput']) {
    const created = await this.post<Product>(await this.scenarioPath('/products'), data);
    this.activeScenarioPromise = null;
    return created;
  }

  async updateProduct(id: number, data: Partial<components['schemas']['ProductInput']>) {
    const updated = await this.patch<Product>(await this.scenarioPath(`/products/${id}`), data);
    this.activeScenarioPromise = null;
    return updated;
  }

  async deleteProduct(id: number) {
    const deleted = await this.delete<void>(await this.scenarioPath(`/products/${id}`));
    this.activeScenarioPromise = null;
    return deleted;
  }

  // Product ingredients (Q matrix)
  async getProductIngredients(productId: number): Promise<ProductIngredient[]> {
    return (await this.getProduct(productId)).ingredients ?? [];
  }

  async addProductIngredient(productId: number, data: { ingredient_id: number; quantity: number }) {
    return this.updateProductIngredient(productId, data.ingredient_id, { quantity: data.quantity });
  }

  async updateProductIngredient(productId: number, ingredientId: number, data: { quantity: number }) {
    const result = await this.put<void>(await this.scenarioPath(`/products/${productId}/ingredients/${ingredientId}`), data);
    this.activeScenarioPromise = null;
    return result;
  }

  async deleteProductIngredient(productId: number, ingredientId: number) {
    const deleted = await this.delete<void>(await this.scenarioPath(`/products/${productId}/ingredients/${ingredientId}`));
    this.activeScenarioPromise = null;
    return deleted;
  }

  // Product machines (T matrix)
  async getProductMachines(productId: number): Promise<ProductMachine[]> {
    return (await this.getProduct(productId)).machines ?? [];
  }

  async addProductMachine(productId: number, data: { machine_id: number; minutes_per_unit: number }) {
    return this.updateProductMachine(productId, data.machine_id, { minutes_per_unit: data.minutes_per_unit });
  }

  async updateProductMachine(productId: number, machineId: number, data: { minutes_per_unit: number }) {
    const result = await this.put<void>(await this.scenarioPath(`/products/${productId}/machines/${machineId}`), data);
    this.activeScenarioPromise = null;
    return result;
  }

  async deleteProductMachine(productId: number, machineId: number) {
    const deleted = await this.delete<void>(await this.scenarioPath(`/products/${productId}/machines/${machineId}`));
    this.activeScenarioPromise = null;
    return deleted;
  }

  // Product operational resources (CM matrix)
  async getProductResources(productId: number): Promise<ProductOperationalResource[]> {
    return (await this.getProduct(productId)).operational_resources ?? [];
  }

  async addProductResource(productId: number, data: { operational_resource_id: number; consumption_per_batch: number }) {
    return this.updateProductResource(productId, data.operational_resource_id, {
      consumption_per_batch: data.consumption_per_batch,
    });
  }

  async updateProductResource(productId: number, opresId: number, data: { consumption_per_batch: number }) {
    const result = await this.put<void>(
      await this.scenarioPath(`/products/${productId}/operational-resources/${opresId}`),
      data
    );
    this.activeScenarioPromise = null;
    return result;
  }

  async deleteProductResource(productId: number, opresId: number) {
    const deleted = await this.delete<void>(await this.scenarioPath(`/products/${productId}/operational-resources/${opresId}`));
    this.activeScenarioPromise = null;
    return deleted;
  }

  // Ingredients endpoints
  async getIngredients(scenarioId?: number): Promise<Ingredient[]> {
    return this.get(await this.scenarioPath('/ingredients', scenarioId));
  }

  async getIngredient(id: number, scenarioId?: number): Promise<Ingredient> {
    const ingredients = await this.getIngredients(scenarioId);
    const ingredient = ingredients.find((item) => item.id === id);
    if (!ingredient) throw new Error('Ingrediente no encontrado en el escenario activo');
    return ingredient;
  }

  async createIngredient(data: components['schemas']['IngredientInput']) {
    const created = await this.post<Ingredient>(await this.scenarioPath('/ingredients'), data);
    this.activeScenarioPromise = null;
    return created;
  }

  async updateIngredient(id: number, data: Partial<components['schemas']['IngredientInput']>) {
    const updated = await this.patch<Ingredient>(await this.scenarioPath(`/ingredients/${id}`), data);
    this.activeScenarioPromise = null;
    return updated;
  }

  async deleteIngredient(id: number) {
    const deleted = await this.delete<void>(await this.scenarioPath(`/ingredients/${id}`));
    this.activeScenarioPromise = null;
    return deleted;
  }

  // Machines endpoints
  async getMachines(scenarioId?: number): Promise<Machine[]> {
    return this.get(await this.scenarioPath('/machines', scenarioId));
  }

  async getMachine(id: number, scenarioId?: number): Promise<Machine> {
    const machines = await this.getMachines(scenarioId);
    const machine = machines.find((item) => item.id === id);
    if (!machine) throw new Error('Máquina no encontrada en el escenario activo');
    return machine;
  }

  async createMachine(data: components['schemas']['MachineInput']) {
    const created = await this.post<Machine>(await this.scenarioPath('/machines'), data);
    this.activeScenarioPromise = null;
    return created;
  }

  async updateMachine(id: number, data: Partial<components['schemas']['MachineInput']>) {
    const updated = await this.patch<Machine>(await this.scenarioPath(`/machines/${id}`), data);
    this.activeScenarioPromise = null;
    return updated;
  }

  async deleteMachine(id: number) {
    const deleted = await this.delete<void>(await this.scenarioPath(`/machines/${id}`));
    this.activeScenarioPromise = null;
    return deleted;
  }

  // Scenario-scoped stock/capacity compatibility helpers.
  async getDefaultStock(): Promise<Stock> {
    return this.scenarioToStock(await this.getActiveScenario());
  }

  async getStocks(): Promise<Stock[]> {
    return [await this.getDefaultStock()];
  }

  async getStock(id: number): Promise<Stock> {
    return this.scenarioToStock(await this.getScenario(id));
  }

  async createStock() {
    return this.getDefaultStock();
  }

  async updateStock(id: number, data: { name?: string }) {
    if (data.name) await this.updateScenario(id, { name: data.name });
    return this.getStock(id);
  }

  async deleteStock(id: number) {
    return this.delete<void>(`/scenarios/${id}`);
  }

  async upsertStockIngredient(stockId: number, ingredientId: number, quantityAvailable: number) {
    const updated = await this.patch<Ingredient>(`/scenarios/${stockId}/ingredients/${ingredientId}`, {
      stock_available: quantityAvailable,
    });
    this.activeScenarioPromise = null;
    return updated;
  }

  async removeStockIngredient(stockId: number, ingredientId: number) {
    return this.deleteIngredient(ingredientId);
  }

  async getDefaultResource(): Promise<Resource> {
    return this.scenarioToResource(await this.getActiveScenario());
  }

  async getResources(): Promise<Resource[]> {
    return [await this.getDefaultResource()];
  }

  async getResource(id: number): Promise<Resource> {
    return this.scenarioToResource(await this.getScenario(id));
  }

  async createResource() {
    return this.getDefaultResource();
  }

  async deleteResource(id: number) {
    return this.delete<void>(`/scenarios/${id}`);
  }

  async upsertResourceMachine(resourceId: number, machineId: number, capacityMinutes: number) {
    const updated = await this.patch<Machine>(`/scenarios/${resourceId}/machines/${machineId}`, {
      capacity_minutes: capacityMinutes,
    });
    this.activeScenarioPromise = null;
    return updated;
  }

  async removeResourceMachine(resourceId: number, machineId: number) {
    return this.deleteMachine(machineId);
  }

  async getOperationalResources(scenarioId?: number): Promise<OperationalResource[]> {
    return this.get(await this.scenarioPath('/operational-resources', scenarioId));
  }

  async addResourceOperationalResource(resourceId: number, data: components['schemas']['OperationalResourceInput']) {
    const created = await this.post<OperationalResource>(`/scenarios/${resourceId}/operational-resources`, data);
    this.activeScenarioPromise = null;
    return created;
  }

  async updateResourceOperationalResource(
    resourceId: number,
    opresId: number,
    data: Partial<components['schemas']['OperationalResourceInput']>
  ) {
    const updated = await this.patch<OperationalResource>(`/scenarios/${resourceId}/operational-resources/${opresId}`, data);
    this.activeScenarioPromise = null;
    return updated;
  }

  async deleteResourceOperationalResource(resourceId: number, opresId: number) {
    const deleted = await this.delete<void>(`/scenarios/${resourceId}/operational-resources/${opresId}`);
    this.activeScenarioPromise = null;
    return deleted;
  }
}

export const apiClient = new ApiClient();

export interface ManagedWebSocket {
  close: () => void;
}

// El backend cierra conexiones muertas con ping/pong a nivel de protocolo
// (el navegador responde el pong solo, no requiere código). Acá solo
// reconectamos con backoff si la conexión se cae de forma inesperada.
export function createWebSocketConnection(
  onMessage: (data: unknown) => void,
  onError?: (error: Event) => void
): ManagedWebSocket {
  const url = API_KEY ? `${WS_BASE_URL}?api_key=${encodeURIComponent(API_KEY)}` : WS_BASE_URL;
  let ws: WebSocket | null = null;
  let closedByClient = false;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    ws = new WebSocket(url);

    ws.onopen = () => {
      logEvent('info', 'ws', 'WebSocket connected');
      reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        logEvent('debug', 'ws', 'WebSocket message received', { data });
        onMessage(data);
      } catch (e) {
        logEvent('error', 'ws', 'WebSocket message parse error', { error: e, raw: event.data });
      }
    };

    ws.onerror = (error) => {
      logEvent('error', 'ws', 'WebSocket error', { error });
      onError?.(error);
    };

    ws.onclose = () => {
      logEvent('warn', 'ws', 'WebSocket disconnected', { closed_by_client: closedByClient });
      if (closedByClient) return;
      const delay = Math.min(1000 * 2 ** reconnectAttempts, 15000);
      reconnectAttempts += 1;
      logEvent('info', 'ws', 'Scheduling WebSocket reconnect', {
        reconnect_attempts: reconnectAttempts,
        delay_ms: delay,
      });
      reconnectTimer = setTimeout(connect, delay);
    };
  };

  connect();

  return {
    close: () => {
      closedByClient = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      logEvent('info', 'ws', 'WebSocket close requested by client');
      ws?.close();
    },
  };
}
