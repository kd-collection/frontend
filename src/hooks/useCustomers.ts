import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Customer } from "@/lib/api";

// Fallback Mock Data
let MOCK_CUSTOMERS: Customer[] = [
    { nid: 1, cnik: "3171234567890001", cname: "Budi Santoso", cphone: "081234567890", caddress_home: "Jl. Sudirman No. 1", cemail: "budi@example.com" },
    { nid: 2, cnik: "3171234567890002", cname: "Siti Aminah", cphone: "081234567891", caddress_home: "Jl. Thamrin No. 2", cemail: "siti@example.com" },
    { nid: 3, cnik: "3171234567890003", cname: "Rudi Hartono", cphone: "081234567892", caddress_home: "Jl. Gatot Subroto No. 3" },
];

export interface UseCustomersParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}

export function useCustomers(params: UseCustomersParams = {}) {
    const { page = 1, limit = 10, search = "", sortBy = "created_at", sortOrder = "DESC" } = params;

    return useQuery({
        queryKey: ["customers", page, limit, search, sortBy, sortOrder],
        queryFn: async () => {
            try {
                const response = await api.getCustomers({ page, limit, search, sortBy, sortOrder });

                if (response && response.data) {
                    return response;
                }

                throw new Error("Failed to fetch customers");
            } catch (error) {
                console.error('[DEBUG useCustomers] ERROR in queryFn', error);
                if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
                    console.warn("API Error, falling back to mock data (DEMO MODE ACTIVE)");

                    let filtered = MOCK_CUSTOMERS;
                    if (search) {
                        filtered = filtered.filter(c =>
                            c.cname.toLowerCase().includes(search.toLowerCase()) ||
                            c.cnik.includes(search)
                        );
                    }

                    return {
                        data: filtered.slice((page - 1) * limit, page * limit),
                        pagination: {
                            page,
                            limit,
                            total: filtered.length,
                            totalPages: Math.ceil(filtered.length / limit) || 1
                        }
                    };
                }
                throw error;
            }
        },
        placeholderData: (previousData) => previousData,
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Customer>) => api.createCustomer(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        }
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) => api.updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        }
    });
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.deleteCustomer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        }
    });
}
