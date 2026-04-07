import { HearingResult, SpeechResult } from './audiometry';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://auralis-digital-audiometry.onrender.com';
const TOKEN_KEY = 'sonicArchitectToken';
const USER_KEY = 'sonicArchitectUser';

export function getAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  const stored = window.localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function buildHeaders(headers: Record<string, string> = {}) {
  const token = getAuthToken();
  const base: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (token) {
    base.Authorization = `Bearer ${token}`;
  }
  return base;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options.headers as Record<string, string>),
  });

  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw data || { message: 'API request failed' };
  }

  return data;
}

// ================= AUTH =================

export async function login(email: string, password: string) {
  const data = await apiFetch<{ token: string; user: any }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function register(email: string, password: string, name: string) {
  const data = await apiFetch<{ token: string; user: any }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  setAuthToken(data.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function googleLogin(idToken: string) {
  const data = await apiFetch<{ token: string; user: any }>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  setAuthToken(data.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

// ================= PROFILE =================

export async function fetchProfile() {
  return apiFetch<{ user: any }>('/api/auth/profile');
}

export async function updateProfile(name: string, email: string) {
  const data = await apiFetch<{ user: any }>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, email }),
  });
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

// ================= HEARING =================

export async function submitHearingResult(result: HearingResult) {
  return apiFetch<{ hearingResult: any }>('/api/hearing-results', {
    method: 'POST',
    body: JSON.stringify(result),
  });
}

export async function fetchHearingResults() {
  return apiFetch<{ results: HearingResult[] }>('/api/hearing-results');
}

// ================= SPEECH =================

export async function submitSpeechResult(result: SpeechResult) {
  return apiFetch<{ speechResult: any }>('/api/speech-results', {
    method: 'POST',
    body: JSON.stringify({
      prompts: result.wordsPresented,
      correctCount: result.wordsCorrect,
      totalCount: result.totalWords,
      score: result.score,
      rating: result.rating,
      ambientNoise: result.ambientNoise,
    }),
  });
}

export async function fetchSpeechResults() {
  return apiFetch<{ results: SpeechResult[] }>('/api/speech-results');
}

// ================= 3D SOUND =================

export async function submit3DSoundResults(result: {
  results: any[];
  overallAccuracy: number;
  averageLatency: number;
  frontalBias: number;
  lateralDelay: number;
  spatialAccuracy: any;
  quadrantAnalysis: any;
}) {
  return apiFetch<{ soundResult: any }>('/api/3d-sound-results', {
    method: 'POST',
    body: JSON.stringify(result),
  });
}

export async function fetch3DSoundResults() {
  return apiFetch<{ results: any[] }>('/api/3d-sound-results');
}

// ================= HISTORY =================

export async function fetchHistory() {
  return apiFetch<{ history: any[] }>('/api/history');
}