export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
  is_active: boolean
  created_at: string
}

export interface Session {
  refresh: string
  access: string
  user: User
}

export interface Category {
  id: number
  name: string
  description: string
  created_at: string
}

export interface Product {
  id: number
  name: string
  sku: string
  description: string
  price: string
  stock: number
  minimum_stock: number
  category: number
  category_name: string
  is_active: boolean
  is_low_stock: boolean
  created_at: string
  updated_at: string
}

export interface InventoryMovement {
  id: number
  product: number
  product_name: string
  product_sku: string
  movement_type: 'entrada' | 'salida' | 'ajuste'
  quantity: number
  note: string
  user: User
  created_at: string
}

export interface DashboardSummary {
  total_products: number
  low_stock_products: number
  total_categories: number
  recent_movements: InventoryMovement[]
}

export interface MovementTypeSummary {
  movement_type: 'entrada' | 'salida' | 'ajuste'
  total_quantity: number
  movement_count: number
}

export interface MovementChartPoint {
  label: string
  total_quantity: number
  movement_count: number
}

export interface MovementReport {
  applied_filters: {
    movement_type: string
    start_date: string
    end_date: string
  }
  total_movements: number
  total_quantity: number
  type_summary: MovementTypeSummary[]
  daily_summary: MovementChartPoint[]
  movements: InventoryMovement[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ProductPayload {
  name: string
  sku: string
  description: string
  price: number
  stock: number
  minimum_stock: number
  category: number
  is_active: boolean
}

export interface CategoryPayload {
  name: string
  description: string
}

export interface UserCreatePayload {
  name: string
  email: string
  password: string
  role: 'admin' | 'employee'
  is_active: boolean
}

export interface UserUpdatePayload {
  role?: 'admin' | 'employee'
  is_active?: boolean
}

export interface PaginationParams {
  page?: number
  search?: string
  pageSize?: number
  ordering?: string
  filters?: Record<string, string | number | boolean>
}

export interface LoginPayload {
  email: string
  password: string
}
