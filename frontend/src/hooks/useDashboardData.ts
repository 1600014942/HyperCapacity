import { useState, useEffect } from 'react';

export interface DashboardData {
  meta: {
    project: string;
    dashboard: string;
    version: string;
    currency: string;
    last_updated: string;
    last_checked: string;
    auto_update: boolean;
    default_range: string;
    disclaimer: string;
  };
  sections: Array<{
    id: string;
    title: string;
    subtitle: string;
    cards: Array<any>;
    charts: Record<string, any>;
  }>;
}

const API_URL = 'http://127.0.0.1:8000/api/dashboard/overview';

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const json = await response.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-update every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, lastUpdated, refetch: fetchData };
}
