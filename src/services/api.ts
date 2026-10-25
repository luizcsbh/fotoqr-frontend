import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types';

const envApiUrl = import.meta.env.VITE_API_URL || '';
const isDev = import.meta.env.DEV;
const isLocalhostTarget = envApiUrl.includes('localhost') || envApiUrl.includes('127.0.0.1');

// When accessing from mobile on local Wi-Fi, use relative path '' so Vite proxies to backend
const baseURL = isDev && isLocalhostTarget ? '' : envApiUrl;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45s for file uploads and cold starts
});

export const resolveApiUrl = (url: string): string =>
  new URL(url, api.defaults.baseURL || window.location.origin).toString();

// Event listeners for Cold Start detection
type ColdStartListener = (isColdStarting: boolean) => void;
const coldStartListeners = new Set<ColdStartListener>();

export const onColdStartChange = (listener: ColdStartListener): (() => void) => {
  coldStartListeners.add(listener);
  return () => {
    coldStartListeners.delete(listener);
  };
};

const notifyColdStart = (isColdStarting: boolean) => {
  coldStartListeners.forEach((listener) => {
    try {
      listener(isColdStarting);
    } catch {
      // Ignore listener errors
    }
  });
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // If request succeeds, server is responsive
    notifyColdStart(false);
    return response;
  },
  (error: AxiosError<{ message?: string; code?: string; error?: string }>) => {
    // Detect cold start: network error, connection refused, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
    const isNetworkOrTimeout =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      (error.response.status >= 502 && error.response.status <= 504);

    if (isNetworkOrTimeout) {
      notifyColdStart(true);
    } else {
      notifyColdStart(false);
    }

    const normalizedError: ApiError = {
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Ocorreu um erro inesperado na comunicação com o servidor.',
      code: error.response?.data?.code || error.code,
      status: error.response?.status,
      details: error.response?.data,
    };

    return Promise.reject(normalizedError);
  }
);

export const checkServerHealth = async (): Promise<boolean> => {
  try {
    await api.get('/api/health', { timeout: 8000 });
    notifyColdStart(false);
    return true;
  } catch {
    return false;
  }
};
