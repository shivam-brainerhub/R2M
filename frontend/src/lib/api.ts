export interface UserProfile {
  id: number;
  email: string;
  username: string;
  full_name?: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  is_email_verified: boolean;
  created_at?: string;
  last_login_at?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginPayload {
  username_or_email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  reset_token?: string | null;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface MessageResponse {
  message: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMessage = 'Request failed';
    if (isJson && data) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((err: { msg?: string; message?: string }) => err.msg || err.message).filter(Boolean).join(', ');
      } else if (data.message) {
        errorMessage = data.message;
      }
    }
    throw new ApiError(errorMessage || `Request failed with status ${response.status}`, response.status, data);
  }

  return data as T;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthTokens>(response);
  },

  async register(payload: RegisterPayload): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(response);
  },

  async getMe(token: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<UserProfile>(response);
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return handleResponse<AuthTokens>(response);
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<ForgotPasswordResponse>(response);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<MessageResponse>(response);
  },

  async verifyEmail(token: string): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    return handleResponse<MessageResponse>(response);
  },

  async resendVerification(email: string): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse<MessageResponse>(response);
  },
};

export interface AdminUserFilterParams {
  search?: string;
  role?: 'admin' | 'user' | '';
  is_active?: boolean | null;
  is_email_verified?: boolean | null;
  sort_by?: 'id' | 'username' | 'email' | 'created_at' | 'last_login_at';
  sort_order?: 'asc' | 'desc';
  skip?: number;
  limit?: number;
}

export interface AdminCreateUserPayload {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  role?: 'admin' | 'user';
  is_active?: boolean;
}

export interface AdminUpdateUserPayload {
  email?: string;
  username?: string;
  full_name?: string;
  role?: 'admin' | 'user';
  is_active?: boolean;
}

export const adminUsersApi = {
  async listUsers(token: string, params: AdminUserFilterParams = {}): Promise<UserProfile[]> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.is_active !== undefined && params.is_active !== null) {
      query.append('is_active', String(params.is_active));
    }
    if (params.is_email_verified !== undefined && params.is_email_verified !== null) {
      query.append('is_email_verified', String(params.is_email_verified));
    }
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit));

    const response = await fetch(`${API_BASE_URL}/api/admin/users?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<UserProfile[]>(response);
  },

  async createUser(token: string, payload: AdminCreateUserPayload): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(response);
  },

  async updateUser(token: string, userId: number, payload: AdminUpdateUserPayload): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(response);
  },

  async toggleStatus(token: string, userId: number, isActive: boolean): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/status?is_active=${isActive}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<UserProfile>(response);
  },

  async deleteUser(token: string, userId: number): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<MessageResponse>(response);
  },

  async setPassword(token: string, userId: number, newPassword: string): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/set-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ new_password: newPassword }),
    });
    return handleResponse<MessageResponse>(response);
  },

  async resendConfirmation(token: string, userId: number): Promise<{ message: string; email: string }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/resend-confirmation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<{ message: string; email: string }>(response);
  },
};

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  code?: string | null;
  description?: string | null;
  icon?: string | null;
  product_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  code?: string;
  description?: string;
  icon?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  code?: string;
  description?: string;
  icon?: string;
}

export interface BrandItem {
  id: number;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  country?: string | null;
  description?: string | null;
  website_url?: string | null;
  featured_in_slider: boolean;
  product_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBrandPayload {
  name: string;
  slug?: string;
  logo_url?: string;
  country?: string;
  description?: string;
  website_url?: string;
  featured_in_slider?: boolean;
}

export interface UpdateBrandPayload {
  name?: string;
  slug?: string;
  logo_url?: string;
  country?: string;
  description?: string;
  website_url?: string;
  featured_in_slider?: boolean;
}

export interface BrandToggleSliderResponse {
  id: number;
  name: string;
  featured_in_slider: boolean;
  message: string;
}

export const categoriesApi = {
  async listCategories(params: { search?: string; sort_by?: string; sort_order?: string } = {}): Promise<CategoryItem[]> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/categories${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
    });
    return handleResponse<CategoryItem[]>(response);
  },

  async getCategory(categoryId: number): Promise<CategoryItem> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
      method: 'GET',
    });
    return handleResponse<CategoryItem>(response);
  },

  async createCategory(token: string, payload: CreateCategoryPayload): Promise<CategoryItem> {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<CategoryItem>(response);
  },

  async updateCategory(token: string, categoryId: number, payload: UpdateCategoryPayload): Promise<CategoryItem> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<CategoryItem>(response);
  },

  async deleteCategory(token: string, categoryId: number): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<MessageResponse>(response);
  },
};

export const brandsApi = {
  async listBrands(params: { search?: string; featured_in_slider?: boolean; sort_by?: string; sort_order?: string } = {}): Promise<BrandItem[]> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.featured_in_slider !== undefined) {
      query.append('featured_in_slider', String(params.featured_in_slider));
    }
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/brands${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
    });
    return handleResponse<BrandItem[]>(response);
  },

  async getBrand(brandId: number): Promise<BrandItem> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
      method: 'GET',
    });
    return handleResponse<BrandItem>(response);
  },

  async createBrand(token: string, payload: CreateBrandPayload): Promise<BrandItem> {
    const response = await fetch(`${API_BASE_URL}/api/brands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<BrandItem>(response);
  },

  async updateBrand(token: string, brandId: number, payload: UpdateBrandPayload): Promise<BrandItem> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<BrandItem>(response);
  },

  async toggleSlider(token: string, brandId: number): Promise<BrandToggleSliderResponse> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/toggle-slider`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<BrandToggleSliderResponse>(response);
  },

  async uploadLogo(token: string, file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/brands/upload-logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse<{ url: string; filename: string }>(response);
  },

  async deleteBrand(token: string, brandId: number): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<MessageResponse>(response);
  },
};

export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  // If it's already a full external URL (e.g. S3 / GCS cloud bucket), return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // If it's a relative path starting with /media, return as relative path
  // Next.js will route /media to backend via next.config.ts rewrites (or Nginx proxy)
  if (path.startsWith('/')) {
    return path;
  }
  return `/${path}`;
}

export { ApiError };
