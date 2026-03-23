import type {
  Category,
  CategoryPayload,
  CurrentUserUpdatePayload,
  DashboardSummary,
  InventoryMovement,
  LoginPayload,
  MovementReport,
  PaginatedResponse,
  PaginationParams,
  Product,
  ProductPayload,
  Session,
  User,
  UserCreatePayload,
  UserUpdatePayload,
} from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
const STORAGE_KEY = 'inventory_session'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

function buildQuery(params?: PaginationParams) {
  const searchParams = new URLSearchParams()

  if (!params) {
    return ''
  }

  if (params.page) {
    searchParams.set('page', String(params.page))
  }
  if (params.search) {
    searchParams.set('search', params.search)
  }
  if (params.pageSize) {
    searchParams.set('page_size', String(params.pageSize))
  }
  if (params.ordering) {
    searchParams.set('ordering', params.ordering)
  }

  Object.entries(params.filters ?? {}).forEach(([key, value]) => {
    if (value === '' || value === undefined || value === null) {
      return
    }
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

async function apiRequest<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; token?: string } = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message = parseErrorMessage(errorBody)
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

function parseErrorMessage(errorBody: unknown) {
  if (!errorBody) {
    return 'Ocurrio un error en la solicitud.'
  }

  if (typeof errorBody === 'string') {
    return errorBody
  }

  if (typeof errorBody === 'object') {
    const entries = Object.entries(errorBody as Record<string, unknown>)
    return entries
      .map(([field, value]) => {
        if (Array.isArray(value)) {
          return `${field}: ${value.join(', ')}`
        }
        return `${field}: ${String(value)}`
      })
      .join(' | ')
  }

  return 'Ocurrio un error en la solicitud.'
}

export function getStoredSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as Session
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function setStoredSession(session: Session | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    return
  }
  localStorage.removeItem(STORAGE_KEY)
}

export function loginRequest(payload: LoginPayload) {
  return apiRequest<Session>('/auth/login', { method: 'POST', body: payload })
}

export function fetchDashboardSummary(session: Session) {
  return apiRequest<DashboardSummary>('/dashboard/summary', { token: session.access })
}

export function fetchCurrentUser(session: Session) {
  return apiRequest<User>('/auth/me', { token: session.access })
}

export function updateCurrentUser(session: Session, payload: CurrentUserUpdatePayload) {
  return apiRequest<User>('/auth/me', {
    method: 'PATCH',
    body: payload,
    token: session.access,
  })
}

export function fetchMovementReport(
  session: Session,
  params?: {
    movement_type?: string
    start_date?: string
    end_date?: string
  },
) {
  const filters = {
    ...(params?.movement_type ? { movement_type: params.movement_type } : {}),
    ...(params?.start_date ? { start_date: params.start_date } : {}),
    ...(params?.end_date ? { end_date: params.end_date } : {}),
  }

  return apiRequest<MovementReport>(
    `/reports/movements${buildQuery({
      filters,
    })}`,
    {
      token: session.access,
    },
  )
}

export function fetchProducts(session: Session, params?: PaginationParams) {
  return apiRequest<PaginatedResponse<Product>>(`/products/${buildQuery(params)}`, {
    token: session.access,
  })
}

export function createProduct(session: Session, payload: ProductPayload) {
  return apiRequest<Product>('/products/', {
    method: 'POST',
    body: payload,
    token: session.access,
  })
}

export function updateProduct(
  session: Session,
  productId: number,
  payload: Partial<ProductPayload>,
) {
  return apiRequest<Product>(`/products/${productId}/`, {
    method: 'PATCH',
    body: payload,
    token: session.access,
  })
}

export function deactivateProduct(session: Session, productId: number) {
  return apiRequest<Product>(`/products/${productId}/deactivate/`, {
    method: 'PATCH',
    token: session.access,
  })
}

export function fetchCategories(session: Session, params?: PaginationParams) {
  return apiRequest<PaginatedResponse<Category>>(`/categories/${buildQuery(params)}`, {
    token: session.access,
  })
}

export function createCategory(session: Session, payload: CategoryPayload) {
  return apiRequest<Category>('/categories/', {
    method: 'POST',
    body: payload,
    token: session.access,
  })
}

export function updateCategory(
  session: Session,
  categoryId: number,
  payload: CategoryPayload,
) {
  return apiRequest<Category>(`/categories/${categoryId}/`, {
    method: 'PUT',
    body: payload,
    token: session.access,
  })
}

export function deleteCategory(session: Session, categoryId: number) {
  return apiRequest<void>(`/categories/${categoryId}/`, {
    method: 'DELETE',
    token: session.access,
  })
}

export function fetchMovements(session: Session, params?: PaginationParams) {
  return apiRequest<PaginatedResponse<InventoryMovement>>(`/movements/${buildQuery(params)}`, {
    token: session.access,
  })
}

export function createMovement(
  session: Session,
  payload: {
    product: number
    movement_type: string
    quantity: number
    note: string
  },
) {
  return apiRequest<InventoryMovement>('/movements/', {
    method: 'POST',
    body: payload,
    token: session.access,
  })
}

export function fetchUsers(session: Session, params?: PaginationParams) {
  return apiRequest<PaginatedResponse<User>>(`/users/${buildQuery(params)}`, {
    token: session.access,
  })
}

export function createUser(session: Session, payload: UserCreatePayload) {
  return apiRequest<User>('/users/', {
    method: 'POST',
    body: payload,
    token: session.access,
  })
}

export function updateUser(
  session: Session,
  userId: number,
  payload: UserUpdatePayload,
) {
  return apiRequest<User>(`/users/${userId}/`, {
    method: 'PATCH',
    body: payload,
    token: session.access,
  })
}

export type { LoginPayload }
