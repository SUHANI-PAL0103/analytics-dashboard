const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export interface DashboardStats {
  total_spend_ytd: number;
  total_invoices: number;
  documents_uploaded: number;
  average_invoice_value: number;
}

export interface InvoiceTrend {
  month: string;
  invoice_count: number;
  spend: number;
}

export interface VendorSpend {
  vendor_id: string;
  vendor_name: string;
  spend: number;
}

export interface CategorySpend {
  category: string;
  spend: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  vendor_name: string;
  customer_name: string;
  issue_date: string;
  due_date: string | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

export interface InvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChatResponse {
  sql: string;
  rows: any[];
  columns: string[];
  metadata: {
    elapsed_ms: number;
    row_count: number;
    query: string;
  };
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  getStats: () => fetchAPI<DashboardStats>("/stats"),
  
  getInvoiceTrends: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    return fetchAPI<InvoiceTrend[]>(`/invoice-trends?${params}`);
  },

  getTopVendors: () => fetchAPI<VendorSpend[]>("/vendors/top10"),

  getCategorySpend: () => fetchAPI<CategorySpend[]>("/category-spend"),

  getCashOutflow: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    return fetchAPI<any[]>(`/cash-outflow?${params}`);
  },

  getInvoices: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sort?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.sort) searchParams.append("sort", params.sort);
    return fetchAPI<InvoicesResponse>(`/invoices?${searchParams}`);
  },

  chatWithData: (query: string) =>
    fetchAPI<ChatResponse>("/chat-with-data", {
      method: "POST",
      body: JSON.stringify({ query }),
    }),
};
