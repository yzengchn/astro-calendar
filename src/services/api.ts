const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8787'

export function requestJson<T>(path: string, query: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = buildUrl(path, query)

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      dataType: 'json',
      success: (result) => {
        const statusCode = Number(result.statusCode || 0)
        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error(`API ${statusCode}: ${url}`))
          return
        }
        resolve(result.data as T)
      },
      fail: (error) => reject(error)
    })
  })
}

function buildUrl(path: string, query: Record<string, string | number | undefined>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const queryString = Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  return `${getApiBaseUrl()}${normalizedPath}${queryString ? `?${queryString}` : ''}`
}

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL
  return configured ? configured.replace(/\/+$/, '') : DEFAULT_API_BASE_URL
}
