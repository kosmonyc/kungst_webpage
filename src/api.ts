// Thin client for the kungst backend. Types mirror backend/app/schemas.py.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";
const TOKEN_KEY = "kungst.token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: session lasts until reload */
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// FastAPI errors: {detail: string} or {detail: [{loc, msg}, ...]}
function describe(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) => {
        const loc = (d.loc ?? []).filter((p) => p !== "body").join(" → ");
        return loc ? `${loc}: ${d.msg}` : d.msg ?? JSON.stringify(d);
      })
      .join("\n");
  }
  return JSON.stringify(detail);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, `Can't reach the backend at ${BASE}. Is it running?`);
  }
  if (response.status === 401 && token) {
    setToken(null);
    window.dispatchEvent(new Event("kungst:logout"));
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(response.status, describe(data.detail));
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

// --- types ------------------------------------------------------------------ //

export interface User { id: number; email: string; name: string | null; created_at: string }
export interface Project {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  latest_version: number | null;
}
export interface QuestionSummary { id: string; type: QuestionType; label: string; options: string[] }
export interface StructureVersion {
  id: number;
  version: number;
  hash: string;
  created_at: string;
  questions: QuestionSummary[];
  content: Record<string, unknown>;
}

export type QuestionType = "choice" | "score" | "binary";
export interface OptionScore {
  option_id: string;
  label: string;
  similarity: number;
  probability: number;
  value: number | null;
}
interface DistributionResult {
  question_id: string;
  question: string;
  top_option_id: string;
  top_probability: number;
  margin: number;
  entropy: number;
  options: OptionScore[];
}
export interface ChoiceResult extends DistributionResult { type: "choice" }
export interface ScoreResult extends DistributionResult { type: "score"; expected_value: number; std: number }
export interface BinaryResult {
  type: "binary";
  question_id: string;
  question: string;
  option_id: string;
  probability: number;
  similarity: number;
  negative_similarity: number | null;
}
export type QuestionResult = ChoiceResult | ScoreResult | BinaryResult;
export interface Prediction { query: string; questions: QuestionResult[] }
export interface PredictOut { version: number; predictions: Prediction[]; answers: Record<string, unknown>[] }

export interface Example { id: number; text: string; answers: Record<string, unknown>; created_at: string }
export interface QuestionMetrics {
  type: QuestionType;
  metrics: Record<string, number | null>;
  confusions: { gold: string; predicted: string; count: number }[];
}
export interface Evaluation {
  version: number;
  n_cases: number;
  macro_accuracy: number;
  exact_match: number;
  questions: Record<string, QuestionMetrics>;
}

// --- endpoints -------------------------------------------------------------- //

export const api = {
  register: (email: string, password: string, name: string | null) =>
    request<User>("POST", "/auth/register", { email, password, name }),
  login: (email: string, password: string) =>
    request<{ access_token: string }>("POST", "/auth/login", { email, password }),
  me: () => request<User>("GET", "/auth/me"),
  updateMe: (patch: { name: string | null }) => request<User>("PATCH", "/auth/me", patch),

  projects: () => request<Project[]>("GET", "/projects"),
  project: (id: number) => request<Project>("GET", `/projects/${id}`),
  createProject: (name: string, description: string | null) =>
    request<Project>("POST", "/projects", { name, description }),
  deleteProject: (id: number) => request<void>("DELETE", `/projects/${id}`),

  structures: (id: number) => request<StructureVersion[]>("GET", `/projects/${id}/structures`),
  createStructure: (id: number, content: unknown) =>
    request<StructureVersion>("POST", `/projects/${id}/structures`, content),

  predict: (id: number, texts: string[], version?: number) =>
    request<PredictOut>("POST", `/projects/${id}/predict`, { texts, version }),

  examples: (id: number) => request<Example[]>("GET", `/projects/${id}/examples`),
  addExamples: (id: number, examples: { text: string; answers: Record<string, unknown> }[]) =>
    request<Example[]>("POST", `/projects/${id}/examples`, examples),
  deleteExample: (id: number, exampleId: number) =>
    request<void>("DELETE", `/projects/${id}/examples/${exampleId}`),

  evaluate: (id: number, version?: number) =>
    request<Evaluation>("POST", `/projects/${id}/evaluate`, { version }),
};
