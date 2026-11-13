import { useCallback, useEffect, useState } from 'react';
import { billingApi } from '../services/api';

export function useBillingQuota() {
  const [summary, setSummary] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(true);

  const refreshQuota = useCallback(async () => {
    try {
      const res = await billingApi.current();
      setSummary(res.data || null);
    } catch {
      // Fail open on read if billing endpoint is temporarily unreachable;
      // backend store endpoints still enforce quota authoritatively.
    } finally {
      setQuotaLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  const getResourceQuota = useCallback(
    (resource) => {
      const entry = summary?.usage?.[resource];
      if (!entry) {
        return {
          loaded: false,
          blocked: false,
          unavailable: false,
          exceeded: false,
          overLimit: false,
          unlimited: false,
          current: 0,
          limit: null,
          label: resource,
          planName: summary?.plan?.name || 'Starter',
          planCode: summary?.plan?.code || 'starter',
        };
      }

      const unavailable = !entry.unlimited && entry.limit === 0;
      const blocked = !entry.unlimited && (unavailable || entry.exceeded || entry.over_limit);

      return {
        loaded: true,
        blocked,
        unavailable,
        exceeded: Boolean(entry.exceeded),
        overLimit: Boolean(entry.over_limit),
        unlimited: Boolean(entry.unlimited),
        current: entry.current ?? 0,
        limit: entry.limit,
        percentage: entry.percentage ?? 0,
        label: entry.label || resource,
        planName: summary?.plan?.name || 'Starter',
        planCode: summary?.plan?.code || 'starter',
      };
    },
    [summary]
  );

  return {
    billingSummary: summary,
    quotaLoading,
    refreshQuota,
    getResourceQuota,
  };
}

