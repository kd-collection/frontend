/**
 * API Client for CollectPro CRM
 * Centralized API service layer
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
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
            console.error('API Error:', error);
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
    async getContracts() {
        return this.request<Contract[]>('/contracts');
    }

    async getContractStats() {
        return this.request<ContractStats>('/contracts/stats');
    }

    async getContractById(id: number) {
        return this.request<Contract>(`/contracts/${id}`);
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
    cname?: string;           // Legacy field
    customer_name?: string;   // From DB join
    noutstanding: number | string;
    narrears: number | string;
    dlast_payment?: string;
    darea_date?: string;
    chandler?: string;
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
