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

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
                ...options,
            });


            const data = await response.json();


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
    async getContracts(params: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string; handler?: string; status?: string } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.sortBy) query.append('sortBy', params.sortBy);
        if (params.sortOrder) query.append('sortOrder', params.sortOrder);
        if (params.handler) query.append('handler', params.handler);
        if (params.status) query.append('status', params.status);

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

    async createContract(data: Partial<Contract>) {
        return this.request<Contract>('/contracts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateContract(id: number, data: Partial<Contract>) {
        return this.request<Contract>(`/contracts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Payment Schedule
    async getPaymentSchedule(contractId: number) {
        return this.request<PaymentScheduleItem[]>(`/contracts/${contractId}/schedule`);
    }

    async savePaymentSchedule(contractId: number, items: Partial<PaymentScheduleItem>[]) {
        return this.request<{ success: boolean; data: any[] }>(`/contracts/${contractId}/schedule`, {
            method: 'POST',
            body: JSON.stringify({ items }),
        });
    }

    // Customers
    async getCustomers(params: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string } = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.sortBy) query.append('sortBy', params.sortBy);
        if (params.sortOrder) query.append('sortOrder', params.sortOrder);

        const response = await this.request<Customer[]>(`/customers?${query.toString()}`);

        const fullResponse = response as any;

        return {
            data: response.data || [],
            pagination: fullResponse.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
        };
    }

    async getCustomerById(id: number) {
        return this.request<Customer>(`/customers/${id}`);
    }

    async createCustomer(data: Partial<Customer>) {
        return this.request<Customer>('/customers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateCustomer(id: number, data: Partial<Customer>) {
        return this.request<Customer>(`/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteCustomer(id: number) {
        return this.request<{ success: boolean; id: number }>(`/customers/${id}`, {
            method: 'DELETE',
        });
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
    customer_phone2?: string;
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
    dcreated_at?: string;
    dmodified_at?: string;
}

export interface ContractStats {
    summary: {
        total_contracts: number;
        total_outstanding: number | string;
        total_arrears: number | string;
        total_loan_amount: number | string;
        total_handlers: number;
    };
    highPriority: Contract[];
    recent: Contract[];
}

export interface Customer {
    nid: number;
    cnik: string;
    cname: string;
    cemail?: string;
    cphone?: string;
    cphone2?: string;
    caddress_home?: string;
    caddress_ktp?: string;
    coffice_name?: string;
    coffice_address?: string;
    cec_name?: string;
    cec_phone?: string;
    cec_address?: string;
}

export interface PaymentScheduleItem {
    nid?: number;
    ncontract_id?: number;
    ddue_date: string;
    namount: number | string;
    cdescription?: string;
    cstatus?: 'UNPAID' | 'PAID' | 'PARTIAL';
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
export default api;
