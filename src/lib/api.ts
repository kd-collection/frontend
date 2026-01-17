/**
 * API Client for CollectPro CRM
 * Centralized API service layer
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        console.log('[DEBUG api.ts] Starting fetch to:', url);
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
                ...options,
            });
            console.log('[DEBUG api.ts] Fetch completed, status:', response.status);

            const data = await response.json();
            console.log('[DEBUG api.ts] JSON parsed:', data);

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Request failed',
                    error: data.error,
                };
            }

            return data;
        } catch (error) {
            console.error('[DEBUG api.ts] Fetch ERROR:', error);
            return {
                success: false,
                message: 'Network error - please check your connection',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    // Health check
    async health() {
        return this.request('/health');
    }

    // Contracts
    async getContracts(params: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string; handler?: string } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.sortBy) query.append('sortBy', params.sortBy);
        if (params.sortOrder) query.append('sortOrder', params.sortOrder);
        if (params.handler) query.append('handler', params.handler);

        const response = await this.request<Contract[]>(`/contracts?${query.toString()}`);

        // The backend returns flattened structure { success: true, data: [], pagination: {} }
        // We cast to any to access the pagination sibling property
        const fullResponse = response as any;

        return {
            data: response.data || [],
            pagination: fullResponse.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
        };
    }

    async getContractStats() {
        return this.request<ContractStats>('/contracts/stats');
    }

    async getContractById(id: number) {
        return this.request<Contract>(`/contracts/${id}`);
    }

    async deleteContract(id: number) {
        return this.request<{ success: boolean; id: number }>(`/contracts/${id}`, {
            method: 'DELETE',
        });
    }

    // Customers
    async getCustomers() {
        return this.request<Customer[]>('/customers');
    }

    async getCustomerById(id: number) {
        return this.request<Customer>(`/customers/${id}`);
    }
}

// Types
export interface Contract {
    nid: number;
    ccontract_no: string;
    ccust_id?: string;
    cname?: string;           // Legacy field
    customer_name?: string;   // From DB join
    customer_nik?: string;
    customer_phone?: string;
    customer_email?: string;
    noutstanding: number | string;
    nloan_amount?: number | string;
    ntenor?: number;
    narrears: number | string;
    ncard_count?: number;
    nlundis?: number | string;
    cva_account?: string;
    chandler?: string;
    carea?: string;
    dlast_payment?: string;
    darea_date?: string;
    ddisbursement?: string;
    // Customer addresses
    caddress_home?: string;
    caddress_ktp?: string;
    coffice_name?: string;
    coffice_address?: string;
    // Emergency contact
    cec_name?: string;
    cec_phone?: string;
    cec_address?: string;
}

export interface ContractStats {
    totalOutstanding: number;
    totalContracts: number;
    overdueContracts: number;
    recoveryRate: number;
}

export interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
export default api;
