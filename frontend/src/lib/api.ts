export type PermissionLevel = "none" | "read" | "read_write";

export type PermissionSection =
  | "quotes"
  | "products"
  | "categories"
  | "inquiries"
  | "content"
  | "users"
  | "roles";

export type UserPermissions = Record<
  PermissionSection | string,
  PermissionLevel
>;

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_system: boolean;
  permissions: UserPermissions;
  user_count?: number;
  created_at?: string;
}

export interface RoleCreatePayload {
  name: string;
  description?: string;
  permissions?: Partial<Record<PermissionSection, PermissionLevel>>;
}

export interface RoleUpdatePayload {
  name?: string;
  description?: string;
  permissions?: Partial<Record<PermissionSection, PermissionLevel>>;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  full_name?: string | null;
  phone?: string | null;
  organization?: string | null;
  role: string;
  role_id?: number | null;
  role_name?: string | null;
  is_admin?: boolean;
  has_custom_permissions?: boolean;
  custom_permissions?: Partial<
    Record<PermissionSection, PermissionLevel>
  > | null;
  permissions?: UserPermissions;
  is_active: boolean;
  is_email_verified: boolean;
  created_at?: string;
  last_login_at?: string | null;
}

export interface UpdateProfilePayload {
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  organization?: string | null;
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
  phone?: string;
  organization?: string;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMessage = "Request failed";
    if (isJson && data) {
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail
          .map(
            (err: { msg?: string; message?: string }) => err.msg || err.message,
          )
          .filter(Boolean)
          .join(", ");
      } else if (data.message) {
        errorMessage = data.message;
      }
    }
    throw new ApiError(
      errorMessage || `Request failed with status ${response.status}`,
      response.status,
      data,
    );
  }

  return data as T;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthTokens>(response);
  },

  async register(payload: RegisterPayload): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(response);
  },

  async getMe(token: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<UserProfile>(response);
  },

  async updateMe(
    token: string,
    payload: UpdateProfilePayload,
  ): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(response);
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return handleResponse<AuthTokens>(response);
  },

  async forgotPassword(
    payload: ForgotPasswordPayload,
  ): Promise<ForgotPasswordResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<ForgotPasswordResponse>(response);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<MessageResponse>(response);
  },

  async verifyEmail(token: string): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
    return handleResponse<MessageResponse>(response);
  },

  async resendVerification(email: string): Promise<MessageResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/resend-verification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );
    return handleResponse<MessageResponse>(response);
  },

  async changePassword(
    token: string,
    payload: { current_password: string; new_password: string },
  ): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<MessageResponse>(response);
  },
};

export interface AdminUserFilterParams {
  search?: string;
  role?: string;
  is_active?: boolean | null;
  is_email_verified?: boolean | null;
  sort_by?: "id" | "username" | "email" | "created_at" | "last_login_at";
  sort_order?: "asc" | "desc";
  skip?: number;
  limit?: number;
}

export interface AdminCreateUserPayload {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  phone?: string;
  organization?: string;
  role?: string;
  role_id?: number | null;
  custom_permissions?: Partial<
    Record<PermissionSection, PermissionLevel>
  > | null;
  is_active?: boolean;
}

export interface AdminUpdateUserPayload {
  email?: string;
  username?: string;
  full_name?: string;
  phone?: string;
  organization?: string;
  role?: string;
  role_id?: number | null;
  custom_permissions?: Partial<
    Record<PermissionSection, PermissionLevel>
  > | null;
  is_active?: boolean;
}

export const adminUsersApi = {
  async listUsers(
    token: string,
    params: AdminUserFilterParams = {},
  ): Promise<UserProfile[]> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.role) query.append("role", params.role);
    if (params.is_active !== undefined && params.is_active !== null) {
      query.append("is_active", String(params.is_active));
    }
    if (
      params.is_email_verified !== undefined &&
      params.is_email_verified !== null
    ) {
      query.append("is_email_verified", String(params.is_email_verified));
    }
    if (params.sort_by) query.append("sort_by", params.sort_by);
    if (params.sort_order) query.append("sort_order", params.sort_order);
    if (params.skip !== undefined) query.append("skip", String(params.skip));
    if (params.limit !== undefined) query.append("limit", String(params.limit));

    const response = await fetch(
      `${API_BASE_URL}/api/admin/users?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return handleResponse<UserProfile[]>(response);
  },

  async createUser(
    token: string,
    payload: AdminCreateUserPayload,
  ): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(response);
  },

  async updateUser(
    token: string,
    userId: number,
    payload: AdminUpdateUserPayload,
  ): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(response);
  },

  async toggleStatus(
    token: string,
    userId: number,
    isActive: boolean,
  ): Promise<UserProfile> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/users/${userId}/status?is_active=${isActive}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return handleResponse<UserProfile>(response);
  },

  async deleteUser(token: string, userId: number): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<MessageResponse>(response);
  },

  async setPassword(
    token: string,
    userId: number,
    newPassword: string,
  ): Promise<MessageResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/users/${userId}/set-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
      },
    );
    return handleResponse<MessageResponse>(response);
  },

  async resendConfirmation(
    token: string,
    userId: number,
  ): Promise<{ message: string; email: string }> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/users/${userId}/resend-confirmation`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return handleResponse<{ message: string; email: string }>(response);
  },
};

export const adminRolesApi = {
  async listRoles(token: string): Promise<Role[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/roles`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<Role[]>(response);
  },

  async getRole(token: string, roleId: number): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/api/admin/roles/${roleId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<Role>(response);
  },

  async createRole(token: string, payload: RoleCreatePayload): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/api/admin/roles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Role>(response);
  },

  async updateRole(
    token: string,
    roleId: number,
    payload: RoleUpdatePayload,
  ): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/api/admin/roles/${roleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Role>(response);
  },

  async deleteRole(token: string, roleId: number): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/roles/${roleId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<MessageResponse>(response);
  },
};

export interface SubcategoryItem {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  product_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  code?: string | null;
  description?: string | null;
  icon?: string | null;
  product_count: number;
  subcategories?: SubcategoryItem[];
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

export interface CreateSubcategoryPayload {
  name: string;
  slug?: string;
  category_id?: number;
}

export interface UpdateSubcategoryPayload {
  name?: string;
  slug?: string;
  category_id?: number;
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
  async listCategories(
    params: { search?: string; sort_by?: string; sort_order?: string } = {},
  ): Promise<CategoryItem[]> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.sort_by) query.append("sort_by", params.sort_by);
    if (params.sort_order) query.append("sort_order", params.sort_order);

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/categories${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await fetch(url, {
      method: "GET",
    });
    return handleResponse<CategoryItem[]>(response);
  },

  async getCategory(categoryId: number): Promise<CategoryItem> {
    const response = await fetch(
      `${API_BASE_URL}/api/categories/${categoryId}`,
      {
        method: "GET",
      },
    );
    return handleResponse<CategoryItem>(response);
  },

  async createCategory(
    token: string,
    payload: CreateCategoryPayload,
  ): Promise<CategoryItem> {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<CategoryItem>(response);
  },

  async updateCategory(
    token: string,
    categoryId: number,
    payload: UpdateCategoryPayload,
  ): Promise<CategoryItem> {
    const response = await fetch(
      `${API_BASE_URL}/api/categories/${categoryId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );
    return handleResponse<CategoryItem>(response);
  },

  async deleteCategory(
    token: string,
    categoryId: number,
  ): Promise<MessageResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/categories/${categoryId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return handleResponse<MessageResponse>(response);
  },

  async createSubcategory(
    token: string,
    categoryId: number,
    payload: CreateSubcategoryPayload,
  ): Promise<SubcategoryItem> {
    const response = await fetch(
      `${API_BASE_URL}/api/categories/${categoryId}/subcategories`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );
    return handleResponse<SubcategoryItem>(response);
  },

  async updateSubcategory(
    token: string,
    subcategoryId: number,
    payload: UpdateSubcategoryPayload,
  ): Promise<SubcategoryItem> {
    const response = await fetch(
      `${API_BASE_URL}/api/subcategories/${subcategoryId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );
    return handleResponse<SubcategoryItem>(response);
  },

  async deleteSubcategory(
    token: string,
    subcategoryId: number,
    force: boolean = false,
  ): Promise<MessageResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/subcategories/${subcategoryId}${
        force ? "?force=true" : ""
      }`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return handleResponse<MessageResponse>(response);
  },
};

export const brandsApi = {
  async listBrands(
    params: {
      search?: string;
      featured_in_slider?: boolean;
      sort_by?: string;
      sort_order?: string;
    } = {},
  ): Promise<BrandItem[]> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.featured_in_slider !== undefined) {
      query.append("featured_in_slider", String(params.featured_in_slider));
    }
    if (params.sort_by) query.append("sort_by", params.sort_by);
    if (params.sort_order) query.append("sort_order", params.sort_order);

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/brands${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await fetch(url, {
      method: "GET",
    });
    return handleResponse<BrandItem[]>(response);
  },

  async getBrand(brandId: number): Promise<BrandItem> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
      method: "GET",
    });
    return handleResponse<BrandItem>(response);
  },

  async createBrand(
    token: string,
    payload: CreateBrandPayload,
  ): Promise<BrandItem> {
    const response = await fetch(`${API_BASE_URL}/api/brands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<BrandItem>(response);
  },

  async updateBrand(
    token: string,
    brandId: number,
    payload: UpdateBrandPayload,
  ): Promise<BrandItem> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<BrandItem>(response);
  },

  async toggleSlider(
    token: string,
    brandId: number,
  ): Promise<BrandToggleSliderResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/brands/${brandId}/toggle-slider`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return handleResponse<BrandToggleSliderResponse>(response);
  },

  async uploadLogo(
    token: string,
    file: File,
  ): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/brands/upload-logo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse<{ url: string; filename: string }>(response);
  },

  async deleteBrand(token: string, brandId: number): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<MessageResponse>(response);
  },
};

export interface ProductImageItem {
  id?: number;
  image_url: string;
  alt_text?: string | null;
  is_primary: boolean;
  display_order: number;
}

export interface ProductPropertyItem {
  property_id?: number;
  name: string;
  value: string;
  group?: string | null;
}

export interface ProductDocument {
  id?: number;
  product_id?: number | null;
  title: string;
  file_url: string;
  type: "Brochure" | "Specifications" | "User Manual" | "Certificate" | string;
  created_at?: string;
}

export interface ResourceItem {
  id: number;
  title: string;
  file_url: string;
  type: string;
  product_id?: number | null;
  product_name?: string | null;
  product_slug?: string | null;
  product_sku?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  category_slug?: string | null;
  brand_id?: number | null;
  brand_name?: string | null;
  brand_logo_url?: string | null;
  created_at?: string;
}

export interface SectorItem {
  id: number;
  name: string;
  product_count?: number;
}

export interface ProductItem {
  id: number;
  name: string;
  slug: string;
  sku?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  subcategory_id?: number | null;
  subcategory_name?: string | null;
  brand_id?: number | null;
  brand_name?: string | null;
  brand_logo_url?: string | null;
  description?: string | null;
  short_description?: string | null;
  primary_image_url?: string | null;
  images: ProductImageItem[];
  brochure_url?: string | null;
  documents?: ProductDocument[];
  sectors?: SectorItem[];
  status: "Active" | "Draft";
  specifications?: Record<string, string>;
  properties: ProductPropertyItem[];
  meta_title?: string | null;
  meta_description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCreatePayload {
  name: string;
  slug?: string;
  sku?: string;
  category_id?: number | null;
  subcategory_id?: number | null;
  brand_id?: number | null;
  description?: string;
  short_description?: string;
  brochure_url?: string;
  documents?: ProductDocument[];
  sector_ids?: number[];
  status?: "Active" | "Draft";
  meta_title?: string;
  meta_description?: string;
  images?: ProductImageItem[];
  properties?: ProductPropertyItem[];
}

export interface ProductUpdatePayload {
  name?: string;
  slug?: string;
  sku?: string;
  category_id?: number | null;
  subcategory_id?: number | null;
  brand_id?: number | null;
  description?: string;
  short_description?: string;
  brochure_url?: string;
  documents?: ProductDocument[];
  sector_ids?: number[];
  status?: "Active" | "Draft";
  meta_title?: string;
  meta_description?: string;
  images?: ProductImageItem[];
  properties?: ProductPropertyItem[];
}

export interface ProductComparePropertyRow {
  name: string;
  group?: string | null;
  values: Record<string, string | null>;
}

export interface ProductCompareResponse {
  products: ProductItem[];
  properties: ProductComparePropertyRow[];
}

export interface ProductStatsResponse {
  total_products: number;
  active_products: number;
  draft_products: number;
  with_brochure_count: number;
  total_brands: number;
  total_categories: number;
  total_properties: number;
  category_distribution: Record<string, number>;
  brand_distribution: Record<string, number>;
}

export interface PropertyItem {
  id: number;
  name: string;
  category_id?: number | null;
  category_name?: string | null;
  group?: string | null;
  description?: string | null;
  product_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePropertyPayload {
  name: string;
  category_id?: number | null;
  group?: string | null;
  description?: string | null;
}

export interface UpdatePropertyPayload {
  name?: string;
  category_id?: number | null;
  group?: string | null;
  description?: string | null;
}

export interface SubcategoryFilterOption {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  product_count: number;
}

export interface CategoryFilterOption {
  id: number;
  name: string;
  slug: string;
  code?: string | null;
  description?: string | null;
  icon?: string | null;
  product_count: number;
  subcategories: SubcategoryFilterOption[];
}

export interface BrandFilterOption {
  id?: number | null;
  name: string;
  slug?: string | null;
  count: number;
}

export interface PropertyValueOption {
  value: string;
  count: number;
}

export interface PropertyGroupFilterOption {
  name: string;
  group?: string | null;
  options: PropertyValueOption[];
}

export interface SectorFilterOption {
  id: number;
  name: string;
  count: number;
}

export interface AvailabilityFilterOption {
  active_count: number;
  brochure_count: number;
}

export interface ProductFilterOptionsResponse {
  total_products: number;
  categories: CategoryFilterOption[];
  brands: BrandFilterOption[];
  sectors: SectorFilterOption[];
  properties: PropertyGroupFilterOption[];
  availability: AvailabilityFilterOption;
}

export interface SearchSuggestionProduct {
  id: number;
  name: string;
  slug: string;
  sku?: string | null;
  brand_name?: string | null;
  category_name?: string | null;
  primary_image_url?: string | null;
}

export interface SearchSuggestionCategory {
  id: number;
  name: string;
  slug: string;
  product_count: number;
}

export interface SearchSuggestionBrand {
  id: number;
  name: string;
  slug: string;
  product_count: number;
}

export interface SearchSuggestionsResponse {
  query: string;
  products: SearchSuggestionProduct[];
  categories: SearchSuggestionCategory[];
  brands: SearchSuggestionBrand[];
}

export const productsApi = {
  async getSuggestions(
    query: string,
    limit = 6,
  ): Promise<SearchSuggestionsResponse> {
    if (!query || !query.trim()) {
      return { query: "", products: [], categories: [], brands: [] };
    }
    const cleanQuery = encodeURIComponent(query.trim());
    const response = await fetch(
      `${API_BASE_URL}/api/products/suggest?q=${cleanQuery}&limit=${limit}`,
      {
        method: "GET",
      },
    );
    return handleResponse<SearchSuggestionsResponse>(response);
  },

  async getFilterOptions(): Promise<ProductFilterOptionsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/products/filters`, {
      method: "GET",
    });
    return handleResponse<ProductFilterOptionsResponse>(response);
  },

  async listProducts(
    params: {
      search?: string;
      category?: string;
      subcategory?: string;
      brand?: string;
      sector?: string;
      status?: string;
      sort_by?: string;
      sort_order?: string;
      limit?: number;
      skip?: number;
    } = {},
  ): Promise<ProductItem[]> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category) query.append("category", params.category);
    if (params.subcategory) query.append("subcategory", params.subcategory);
    if (params.brand) query.append("brand", params.brand);
    if (params.sector) query.append("sector", params.sector);
    if (params.status && params.status !== "All")
      query.append("status", params.status);
    if (params.sort_by) query.append("sort_by", params.sort_by);
    if (params.sort_order) query.append("sort_order", params.sort_order);
    if (params.limit !== undefined) query.append("limit", String(params.limit));
    if (params.skip !== undefined) query.append("skip", String(params.skip));

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/products${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await fetch(url, { method: "GET" });
    return handleResponse<ProductItem[]>(response);
  },

  async getProduct(slugOrId: string | number): Promise<ProductItem> {
    const response = await fetch(`${API_BASE_URL}/api/products/${slugOrId}`, {
      method: "GET",
    });
    return handleResponse<ProductItem>(response);
  },

  async getRelatedProducts(
    slugOrId: string | number,
    limit = 4,
  ): Promise<ProductItem[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/products/${slugOrId}/related?limit=${limit}`,
      {
        method: "GET",
      },
    );
    return handleResponse<ProductItem[]>(response);
  },

  async getStats(): Promise<ProductStatsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/products/stats`, {
      method: "GET",
    });
    return handleResponse<ProductStatsResponse>(response);
  },

  async compareProducts(
    items: string[] | string,
  ): Promise<ProductCompareResponse> {
    const itemsParam = Array.isArray(items) ? items.join(",") : items;
    const response = await fetch(
      `${API_BASE_URL}/api/products/compare?items=${encodeURIComponent(
        itemsParam,
      )}`,
      {
        method: "GET",
      },
    );
    return handleResponse<ProductCompareResponse>(response);
  },

  async createProduct(
    token: string,
    payload: ProductCreatePayload,
  ): Promise<ProductItem> {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<ProductItem>(response);
  },

  async updateProduct(
    token: string,
    productId: number,
    payload: ProductUpdatePayload,
  ): Promise<ProductItem> {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<ProductItem>(response);
  },

  async toggleStatus(token: string, productId: number): Promise<ProductItem> {
    const response = await fetch(
      `${API_BASE_URL}/api/products/${productId}/toggle-status`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return handleResponse<ProductItem>(response);
  },

  async deleteProduct(
    token: string,
    productId: number,
  ): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<MessageResponse>(response);
  },

  async uploadBrochure(
    token: string,
    file: File,
  ): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_BASE_URL}/api/products/upload-brochure`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );
    return handleResponse<{ url: string; filename: string; size: number }>(
      response,
    );
  },

  async uploadImage(
    token: string,
    file: File,
  ): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/products/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse<{ url: string; filename: string; size: number }>(
      response,
    );
  },

  async deleteMedia(
    token: string,
    fileUrl: string,
    force = false,
  ): Promise<MessageResponse> {
    const query = new URLSearchParams({ file_url: fileUrl });
    if (force) query.append("force", "true");
    const response = await fetch(
      `${API_BASE_URL}/api/products/media?${query.toString()}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return handleResponse<MessageResponse>(response);
  },
};

export const sectorsApi = {
  async listSectors(): Promise<SectorItem[]> {
    const response = await fetch(`${API_BASE_URL}/api/sectors`, {
      method: "GET",
    });
    return handleResponse<SectorItem[]>(response);
  },

  async getSector(sectorId: number): Promise<SectorItem> {
    const response = await fetch(`${API_BASE_URL}/api/sectors/${sectorId}`, {
      method: "GET",
    });
    return handleResponse<SectorItem>(response);
  },
};

export const propertiesApi = {
  async listProperties(
    params: { search?: string; category_id?: number; group?: string } = {},
  ): Promise<PropertyItem[]> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category_id)
      query.append("category_id", String(params.category_id));
    if (params.group) query.append("group", params.group);

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/properties${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await fetch(url, { method: "GET" });
    return handleResponse<PropertyItem[]>(response);
  },

  async getProperty(id: number): Promise<PropertyItem> {
    const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
      method: "GET",
    });
    return handleResponse<PropertyItem>(response);
  },

  async createProperty(
    token: string,
    payload: CreatePropertyPayload,
  ): Promise<PropertyItem> {
    const response = await fetch(`${API_BASE_URL}/api/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<PropertyItem>(response);
  },

  async updateProperty(
    token: string,
    propertyId: number,
    payload: UpdatePropertyPayload,
  ): Promise<PropertyItem> {
    const response = await fetch(
      `${API_BASE_URL}/api/properties/${propertyId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );
    return handleResponse<PropertyItem>(response);
  },

  async deleteProperty(
    token: string,
    propertyId: number,
  ): Promise<MessageResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/properties/${propertyId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return handleResponse<MessageResponse>(response);
  },
};

export interface HeroContent {
  headlinePart1: string;
  headlinePart2: string;
  headlineAccent: string;
  subheading: string;
  showSearchBar: boolean;
  searchPlaceholder?: string;
  popularSearches?: string[];
  badgeTitle?: string;
  badgeTagline?: string;
  headline_part1?: string;
  headline_part2?: string;
  headline_accent?: string;
  show_search_bar?: boolean;
  search_placeholder?: string;
  popular_searches?: string[];
  badge_title?: string;
  badge_tagline?: string;
}

export interface CompanyContent {
  companyName: string;
  phone: string;
  tollFree?: string;
  email: string;
  salesEmail?: string;
  physicalAddress: string;
  hours: string;
  company_name?: string;
  toll_free?: string;
  sales_email?: string;
  physical_address?: string;
}

export interface WhyUsItem {
  id?: string | number;
  icon: string;
  title: string;
  description: string;
}

export interface WhyUsContent {
  sectionTag?: string;
  section_tag?: string;
  title?: string;
  items: WhyUsItem[];
}

export interface CTAContent {
  heading: string;
  subheading: string;
  buttonText?: string;
  button_text?: string;
  buttonLink?: string;
  button_link?: string;
  phone?: string;
  email?: string;
}

export interface LegalSectionItem {
  id?: string | number;
  heading: string;
  content: string;
}

export interface LegalContent {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  last_updated?: string;
  content: string;
  sections?: LegalSectionItem[];
}

export interface ProductsPageContent {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  search_placeholder?: string;
  popularSearches?: string[];
  popular_searches?: string[];
}

export interface SiteContentData {
  hero: HeroContent;
  company: CompanyContent;
  why_us?: WhyUsContent;
  cta?: CTAContent;
  privacy_policy?: LegalContent;
  terms_of_use?: LegalContent;
  products_page?: ProductsPageContent;
  sections?: Record<
    string,
    {
      id?: number;
      key: string;
      title?: string;
      content: unknown;
      updated_at?: string;
    }
  >;
}

export interface SiteContentSectionResponse {
  id?: number;
  key: string;
  title?: string;
  content: unknown;
  created_at?: string;
  updated_at?: string;
}

export const contentApi = {
  async getAll(): Promise<SiteContentData> {
    const response = await fetch(`${API_BASE_URL}/api/content`, {
      method: "GET",
    });
    return handleResponse<SiteContentData>(response);
  },

  async getSection(key: string): Promise<SiteContentSectionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/content/${key}`, {
      method: "GET",
    });
    return handleResponse<SiteContentSectionResponse>(response);
  },

  async updateSection(
    token: string,
    key: string,
    payload: {
      content:
        | Record<string, unknown>
        | HeroContent
        | CompanyContent
        | WhyUsContent
        | CTAContent
        | LegalContent
        | ProductsPageContent;
      title?: string;
    },
  ): Promise<SiteContentSectionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/content/${key}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<SiteContentSectionResponse>(response);
  },

  async updateBatch(
    token: string,
    sections: Record<string, unknown>,
  ): Promise<SiteContentData> {
    const response = await fetch(`${API_BASE_URL}/api/content/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sections }),
    });
    return handleResponse<SiteContentData>(response);
  },

  async resetSection(token: string, key?: string): Promise<SiteContentData> {
    const url = `${API_BASE_URL}/api/content/reset${key ? `?key=${key}` : ""}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<SiteContentData>(response);
  },

  async uploadImage(
    token: string,
    file: File,
  ): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}/api/content/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse<{ url: string; filename: string }>(response);
  },
};

// ==============================================================================
// Inquiries & Applications API
// ==============================================================================

export interface ContactMessageItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  organization?: string | null;
  message: string;
  status: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SubmitContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  organization?: string;
  message: string;
}

export interface UpdateContactPayload {
  status?: string;
  notes?: string;
}

export interface SupplierApplicationItem {
  id: number;
  company_name: string;
  website?: string | null;
  contact_person: string;
  job_title?: string | null;
  email: string;
  phone: string;
  category: string;
  overview: string;
  status: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SubmitSupplierPayload {
  company_name: string;
  website?: string;
  contact_person: string;
  job_title?: string;
  email: string;
  phone: string;
  category: string;
  overview: string;
}

export interface UpdateSupplierPayload {
  status?: string;
  notes?: string;
}

export interface InquiriesStatsResponse {
  new_contact: number;
  total_contact: number;
  new_supplier: number;
  total_supplier: number;
  total_new: number;
  in_progress_contact?: number;
  under_review_supplier?: number;
  total_in_progress?: number;
}

export const inquiriesApi = {
  // Public submissions
  async submitContact(
    payload: SubmitContactPayload,
  ): Promise<ContactMessageItem> {
    const response = await fetch(`${API_BASE_URL}/api/inquiries/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<ContactMessageItem>(response);
  },

  async submitSupplier(
    payload: SubmitSupplierPayload,
  ): Promise<SupplierApplicationItem> {
    const response = await fetch(`${API_BASE_URL}/api/inquiries/supplier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<SupplierApplicationItem>(response);
  },

  // Admin Contact operations
  async listContactMessages(
    token: string,
    params: {
      status?: string;
      search?: string;
      skip?: number;
      limit?: number;
    } = {},
  ): Promise<ContactMessageItem[]> {
    const query = new URLSearchParams();
    if (params.status && params.status !== "All")
      query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.skip !== undefined) query.append("skip", String(params.skip));
    if (params.limit !== undefined) query.append("limit", String(params.limit));

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/inquiries/contact${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<ContactMessageItem[]>(response);
  },

  async updateContactMessage(
    token: string,
    id: number,
    payload: UpdateContactPayload,
  ): Promise<ContactMessageItem> {
    const response = await fetch(
      `${API_BASE_URL}/api/inquiries/contact/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );
    return handleResponse<ContactMessageItem>(response);
  },

  async deleteContactMessage(token: string, id: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/inquiries/contact/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!response.ok) {
      await handleResponse<void>(response);
    }
  },

  // Admin Supplier operations
  async listSupplierApplications(
    token: string,
    params: {
      status?: string;
      search?: string;
      skip?: number;
      limit?: number;
    } = {},
  ): Promise<SupplierApplicationItem[]> {
    const query = new URLSearchParams();
    if (params.status && params.status !== "All")
      query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.skip !== undefined) query.append("skip", String(params.skip));
    if (params.limit !== undefined) query.append("limit", String(params.limit));

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/inquiries/supplier${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<SupplierApplicationItem[]>(response);
  },

  async updateSupplierApplication(
    token: string,
    id: number,
    payload: UpdateSupplierPayload,
  ): Promise<SupplierApplicationItem> {
    const response = await fetch(
      `${API_BASE_URL}/api/inquiries/supplier/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );
    return handleResponse<SupplierApplicationItem>(response);
  },

  async deleteSupplierApplication(token: string, id: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/inquiries/supplier/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!response.ok) {
      await handleResponse<void>(response);
    }
  },

  // Admin Stats
  async getInquiriesStats(token: string): Promise<InquiriesStatsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/inquiries/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<InquiriesStatsResponse>(response);
  },
};

// ==============================================================================
// Quotes & RFQ Types & API
// ==============================================================================

export interface QuoteItemPayload {
  product_id?: number | null;
  product_name: string;
  product_sku?: string | null;
  brand_name?: string | null;
  quantity: number;
  item_notes?: string | null;
}

export interface SubmitQuotePayload {
  facility_name: string;
  contact_name: string;
  email: string;
  phone: string;
  sector?: string | null;
  department?: string | null;
  city?: string | null;
  address?: string | null;
  postal_code?: string | null;
  urgency?: string;
  notes?: string | null;
  items: QuoteItemPayload[];
}

export interface QuoteItemData {
  id: number;
  quote_request_id: number;
  product_id?: number | null;
  product_name: string;
  product_sku?: string | null;
  brand_name?: string | null;
  quantity: number;
  item_notes?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface QuoteRequestData {
  id: number;
  quote_number: string;
  user_id?: number | null;
  facility_name: string;
  contact_name: string;
  email: string;
  phone: string;
  sector?: string | null;
  department?: string | null;
  city?: string | null;
  address?: string | null;
  postal_code?: string | null;
  urgency: string;
  status: "New" | "In Review" | "Quoted" | "Approved" | "Declined" | string;
  notes?: string | null;
  internal_notes?: string | null;
  quoted_amount?: string | null;
  created_at: string;
  updated_at?: string;
  items: QuoteItemData[];
}

export interface UpdateQuotePayload {
  status?: string;
  internal_notes?: string | null;
  quoted_amount?: string | null;
}

export interface QuoteStatsData {
  total_quotes: number;
  new_quotes: number;
  in_review_quotes: number;
  quoted_quotes: number;
  approved_quotes: number;
  declined_quotes: number;
}

export const quotesApi = {
  // Submit a new quote (Public or Authenticated)
  async submitQuote(
    payload: SubmitQuotePayload,
    token?: string | null,
  ): Promise<QuoteRequestData> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/quotes`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<QuoteRequestData>(response);
  },

  // Get current user's submitted quote requests
  async getMyQuotes(token: string): Promise<QuoteRequestData[]> {
    const response = await fetch(`${API_BASE_URL}/api/quotes/my-quotes`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<QuoteRequestData[]>(response);
  },

  // Get details for a specific quote
  async getQuoteDetails(
    identifier: string | number,
    token?: string | null,
    verifyEmail?: string,
  ): Promise<QuoteRequestData> {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const query = verifyEmail
      ? `?verify_email=${encodeURIComponent(verifyEmail)}`
      : "";
    const response = await fetch(
      `${API_BASE_URL}/api/quotes/${identifier}${query}`,
      {
        method: "GET",
        headers,
      },
    );
    return handleResponse<QuoteRequestData>(response);
  },

  // Admin: List all quotes with filter/search
  async listQuotes(
    token: string,
    params: {
      status?: string;
      urgency?: string;
      search?: string;
      skip?: number;
      limit?: number;
    } = {},
  ): Promise<QuoteRequestData[]> {
    const query = new URLSearchParams();
    if (params.status && params.status !== "All")
      query.append("status", params.status);
    if (params.urgency && params.urgency !== "All")
      query.append("urgency", params.urgency);
    if (params.search) query.append("search", params.search);
    if (params.skip !== undefined) query.append("skip", String(params.skip));
    if (params.limit !== undefined) query.append("limit", String(params.limit));

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/quotes${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<QuoteRequestData[]>(response);
  },

  // Admin: Update status, internal notes, or quoted amount
  async updateQuote(
    token: string,
    id: number,
    payload: UpdateQuotePayload,
  ): Promise<QuoteRequestData> {
    const response = await fetch(`${API_BASE_URL}/api/quotes/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<QuoteRequestData>(response);
  },

  // Admin: Delete quote request
  async deleteQuote(token: string, id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/quotes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      await handleResponse<unknown>(response);
    }
  },

  // Admin: Statistics for badges
  async getQuoteStats(token: string): Promise<QuoteStatsData> {
    const response = await fetch(`${API_BASE_URL}/api/quotes/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<QuoteStatsData>(response);
  },
};

export interface ResourceFilterParams {
  search?: string;
  category?: string;
  brand?: string;
  type?: string;
  page?: number;
  pageSize?: number;
  skip?: number;
  limit?: number;
  paginated?: boolean;
}

export interface PaginatedResourcesResult {
  items: ResourceItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export const resourcesApi = {
  async listResources(
    params: ResourceFilterParams = {},
  ): Promise<ResourceItem[]> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category && params.category !== "all")
      query.append("category", params.category);
    if (params.brand && params.brand !== "all")
      query.append("brand", params.brand);
    if (params.type && params.type !== "all") query.append("type", params.type);
    if (params.page !== undefined) query.append("page", String(params.page));
    if (params.pageSize !== undefined)
      query.append("page_size", String(params.pageSize));
    if (params.skip !== undefined) query.append("skip", String(params.skip));
    if (params.limit !== undefined) query.append("limit", String(params.limit));

    const response = await fetch(
      `${API_BASE_URL}/api/resources?${query.toString()}`,
      {
        method: "GET",
      },
    );
    return handleResponse<ResourceItem[]>(response);
  },

  async listResourcesPaginated(
    params: ResourceFilterParams = {},
  ): Promise<PaginatedResourcesResult> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category && params.category !== "all")
      query.append("category", params.category);
    if (params.brand && params.brand !== "all")
      query.append("brand", params.brand);
    if (params.type && params.type !== "all") query.append("type", params.type);
    if (params.page !== undefined) query.append("page", String(params.page));
    if (params.pageSize !== undefined)
      query.append("page_size", String(params.pageSize));
    if (params.skip !== undefined) query.append("skip", String(params.skip));
    if (params.limit !== undefined) query.append("limit", String(params.limit));
    query.append("paginated", "true");

    const response = await fetch(
      `${API_BASE_URL}/api/resources?${query.toString()}`,
      {
        method: "GET",
      },
    );
    const rawData = await handleResponse<
      | {
          items?: ResourceItem[];
          total?: number;
          page?: number;
          page_size?: number;
          total_pages?: number;
          has_more?: boolean;
        }
      | ResourceItem[]
    >(response);

    if (Array.isArray(rawData)) {
      const totalHeader = response.headers.get("X-Total-Count");
      const hasMoreHeader = response.headers.get("X-Has-More");
      const limit = params.pageSize ?? params.limit ?? 12;
      const total = totalHeader ? parseInt(totalHeader, 10) : rawData.length;
      const hasMore =
        hasMoreHeader !== null
          ? hasMoreHeader === "true"
          : rawData.length === limit;
      return {
        items: rawData,
        total,
        page: params.page ?? 1,
        pageSize: limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasMore,
      };
    }

    const items = Array.isArray(rawData?.items) ? rawData.items : [];
    const total =
      typeof rawData?.total === "number" ? rawData.total : items.length;
    const page =
      typeof rawData?.page === "number" ? rawData.page : params.page ?? 1;
    const pageSize =
      typeof rawData?.page_size === "number" ? rawData.page_size : 12;
    const totalPages =
      typeof rawData?.total_pages === "number"
        ? rawData.total_pages
        : Math.max(1, Math.ceil(total / pageSize));
    const hasMore =
      typeof rawData?.has_more === "boolean"
        ? rawData.has_more
        : items.length === pageSize;

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasMore,
    };
  },

  getDownloadUrl(fileUrl: string, token?: string | null): string {
    const normalizedBaseUrl = (API_BASE_URL || "http://localhost:8000").replace(
      /\/+$/,
      "",
    );
    const cleanUrl = fileUrl.trim();
    const query = new URLSearchParams({ url: cleanUrl });
    if (token) {
      query.append("token", token);
    }
    return `${normalizedBaseUrl}/api/documents/download?${query.toString()}`;
  },
};

export function getProtectedDownloadUrl(
  fileUrl?: string | null,
  token?: string | null,
): string {
  if (!fileUrl) return "";
  return resourcesApi.getDownloadUrl(fileUrl, token);
}

export function getMediaUrl(path?: string | null): string {
  if (!path) return "";
  // If it's already a full external URL (e.g. S3 / GCS cloud bucket), return as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // If path is a document/brochure/PDF, return full backend URL for direct downloads/links
  const isDocument =
    /\.(pdf|docx?|zip|xlsx?|csv)$/i.test(cleanPath) ||
    cleanPath.startsWith("/brochures/");
  if (isDocument) {
    const normalizedBaseUrl = (API_BASE_URL || "http://localhost:8000").replace(
      /\/+$/,
      "",
    );
    if (cleanPath.startsWith("/media/")) {
      return `${normalizedBaseUrl}${cleanPath}`;
    }
    return `${normalizedBaseUrl}/media${cleanPath}`;
  }

  // For images and other assets, return relative path so Next.js Image component handles them via rewrites without SSRF issues
  return cleanPath;
}

export function getFileUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalizedBaseUrl = (API_BASE_URL || "http://localhost:8000").replace(
    /\/+$/,
    "",
  );
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith("/media/")) {
    return `${normalizedBaseUrl}${cleanPath}`;
  }
  if (cleanPath.startsWith("/brochures/")) {
    return `${normalizedBaseUrl}/media${cleanPath}`;
  }
  return `${normalizedBaseUrl}/media${cleanPath}`;
}

export { ApiError };
