import type { APIRequestContext } from '@playwright/test';

export interface ApiRequestOptions {
  data?: unknown;
  expectedStatus?: number | number[];
  headers?: Record<string, string>;
}

export interface ApiClientOptions {
  authHeaders?: Record<string, string>;
  baseURL: string;
  headers?: Record<string, string>;
  request: APIRequestContext;
}

export class ApiError extends Error {
  constructor(
    readonly method: string,
    readonly url: string,
    readonly status: number,
    readonly responseBody: unknown,
  ) {
    const body =
      responseBody === undefined ? '' : `: ${JSON.stringify(responseBody)}`;
    super(`${method} ${url} returned HTTP ${status}${body}`);
    this.name = 'ApiError';
  }
}

export class BaseApiClient {
  private readonly baseURL: string;

  constructor(private readonly options: ApiClientOptions) {
    this.baseURL = options.baseURL.replace(/\/+$/, '');
  }

  async request<T>(
    method: string,
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const url = `${this.baseURL}/${path.replace(/^\/+/, '')}`;
    const response = await this.options.request.fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...this.options.headers,
        ...this.options.authHeaders,
        ...options.headers,
      },
      ...(options.data === undefined ? {} : { data: options.data }),
    });
    const responseBody = await this.parseResponse(response);
    const expectedStatus = options.expectedStatus;
    const expectedStatuses = Array.isArray(expectedStatus)
      ? expectedStatus
      : expectedStatus === undefined
        ? undefined
        : [expectedStatus];
    const isExpected = expectedStatuses
      ? expectedStatuses.includes(response.status())
      : response.status() >= 200 && response.status() < 300;

    if (!isExpected) {
      throw new ApiError(method, url, response.status(), responseBody);
    }

    return responseBody as T;
  }

  get<T>(
    path: string,
    options: Omit<ApiRequestOptions, 'data'> = {},
  ): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  post<T>(
    path: string,
    data?: unknown,
    options: Omit<ApiRequestOptions, 'data'> = {},
  ): Promise<T> {
    return this.request<T>('POST', path, { ...options, data });
  }

  put<T>(
    path: string,
    data?: unknown,
    options: Omit<ApiRequestOptions, 'data'> = {},
  ): Promise<T> {
    return this.request<T>('PUT', path, { ...options, data });
  }

  patch<T>(
    path: string,
    data?: unknown,
    options: Omit<ApiRequestOptions, 'data'> = {},
  ): Promise<T> {
    return this.request<T>('PATCH', path, { ...options, data });
  }

  delete<T = void>(
    path: string,
    options: Omit<ApiRequestOptions, 'data'> = {},
  ): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  private async parseResponse(
    response: Awaited<ReturnType<APIRequestContext['fetch']>>,
  ): Promise<unknown> {
    const text = await response.text();
    if (text.length === 0) {
      return undefined;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
}