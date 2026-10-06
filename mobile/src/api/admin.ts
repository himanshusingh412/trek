import { apiClient } from './client';
import { DepartureSummary, TrekSummary } from '../types/api';

export const AdminApi = {
  async getGuideAssignedDepartures(): Promise<DepartureSummary[]> {
    return apiClient<DepartureSummary[]>('/api/v1/guide/departures');
  },

  async getAdminStats(): Promise<{
    total_treks: number;
    active_departures: number;
    total_bookings: number;
    total_revenue_paise: number;
  }> {
    return apiClient('/api/v1/admin/insights');
  },

  async getAdminTracks(): Promise<TrekSummary[]> {
    return apiClient<TrekSummary[]>('/api/v1/admin/catalog/tracks');
  },

  async getAdminDepartures(): Promise<DepartureSummary[]> {
    return apiClient<DepartureSummary[]>('/api/v1/admin/catalog/departures');
  },
};
