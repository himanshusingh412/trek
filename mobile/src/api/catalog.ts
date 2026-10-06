import { apiClient } from './client';
import { DepartureSummary, TrekSummary } from '../types/api';

export const CatalogApi = {
  async getTreks(params?: {
    region?: string;
    difficulty?: string;
    search?: string;
  }): Promise<TrekSummary[]> {
    const query = new URLSearchParams();
    if (params?.region) query.append('region', params.region);
    if (params?.difficulty) query.append('difficulty', params.difficulty);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    return apiClient<TrekSummary[]>(
      `/api/v1/catalog/treks${queryString ? '?' + queryString : ''}`
    );
  },

  async getTrekBySlug(slug: string): Promise<TrekSummary & {
    description?: string;
    itinerary?: Array<{ day: number; title: string; description: string; distance_km?: number }>;
    included?: string[];
    excluded?: string[];
  }> {
    return apiClient(`/api/v1/catalog/treks/${slug}`);
  },

  async getTrekDepartures(slug: string): Promise<DepartureSummary[]> {
    return apiClient<DepartureSummary[]>(`/api/v1/catalog/treks/${slug}/departures`);
  },

  async getDepartureById(id: string): Promise<DepartureSummary> {
    return apiClient<DepartureSummary>(`/api/v1/catalog/departures/${id}`);
  },

  async getSnowReport(slug: string): Promise<{
    snow_depth_cm: number;
    last_updated: string;
    condition: string;
    notice?: string;
  }> {
    return apiClient(`/api/v1/snow/${slug}`);
  },
};
