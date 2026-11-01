/** RFC 9457 problem body as returned by the backend. */
interface ProblemBody {
  status?: number
  detail?: string
  code?: string
  errors?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly fieldErrors: Record<string, string>

  constructor(status: number, problem: ProblemBody) {
    super(problem.detail ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = problem.code
    this.fieldErrors = problem.errors ?? {}
  }
}

/** Thrown when the server could not be reached at all (offline, DNS, CORS, timeout). */
export class NetworkError extends Error {
  constructor() {
    super('Could not reach the server')
    this.name = 'NetworkError'
  }
}

export async function postJson<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new NetworkError()
  }

  if (!response.ok) {
    // The body may be empty or not JSON (for example a proxy error page).
    const problem = (await response.json().catch(() => ({}))) as ProblemBody
    throw new ApiError(response.status, problem)
  }
  return (await response.json()) as T
}
