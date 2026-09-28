import api from "../api";

export interface DashboardStats{
    messages: number;
    contacts: number;
    campaigns: number;
}

export interface AdminDashboardStats {
    overall: {
        totalGrossRevenue: number;
        totalCost: number;
        totalProfit: number;
        totalDeliveredSms: number;
        totalFailedSms: number;
        totalSms: number;
    };
    dailyRevenue: { date: string; revenue: number }[];
    dailySms: { date: string; delivered: number; failed: number }[];
}

export const StatsService = {
    getDashboardStats: async (range?: string): Promise<DashboardStats> => {
        const resp = await api.get(range ? `/stats/dashboard?range=${range}` : '/stats/dashboard');
        return resp.data;
    },

    getAdminDashboardStats: async (range?: string): Promise<AdminDashboardStats> => {
        const resp = await api.get(range ? `/stats/admin?range=${range}` : '/stats/admin');
        return resp.data;
    },

    getResellerDashboardStats: async (range?: string): Promise<any> => {
        const resp = await api.get(range ? `/stats/reseller?range=${range}` : '/stats/reseller');
        return resp.data;
    }
}