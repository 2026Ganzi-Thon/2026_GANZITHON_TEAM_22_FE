const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Pass only the path after `/api/v1`, such as `tasks`. */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!configuredBaseUrl) {
    throw new ApiError('API 주소가 설정되지 않았어요. .env.local을 확인해 주세요.', 0);
  }

  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${configuredBaseUrl.replace(/\/+$/, '')}/api/v1/${path.replace(/^\/+/, '')}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof body === 'object' && body && 'message' in body
      ? String(body.message)
      : `요청에 실패했어요 (${response.status})`;
    throw new ApiError(message, response.status, body);
  }
  return body as T;
}
