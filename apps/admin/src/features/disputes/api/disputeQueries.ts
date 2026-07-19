"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type {
  StampDisputeFilter,
  StampDisputeListItem,
} from "@repo/supabase/queries/stamp-disputes-shared";
import {
  subscribeStampDisputes,
  unsubscribeStampDisputes,
} from "@repo/supabase/realtime/stamp-disputes";
import { listAdminDisputesAction } from "@/features/disputes/api/disputeActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

export function adminDisputesQueryKey(filter: StampDisputeFilter) {
  return ["admin-disputes", filter] as const;
}

export function useAdminDisputes(
  filter: StampDisputeFilter,
  initialData?: StampDisputeListItem[],
) {
  const tErrors = useTranslations("errors.actions");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminDisputesQueryKey(filter),
    queryFn: async () => {
      const result = await listAdminDisputesAction(filter);
      if (result.error) {
        throw new Error(resolveActionError(tErrors, result.error));
      }
      return result.disputes;
    },
    initialData,
    staleTime: 0,
  });

  useEffect(() => {
    const channel = subscribeStampDisputes({ kind: "admin" }, {
      onChange: () => {
        void queryClient.refetchQueries({ queryKey: ["admin-disputes"] });
      },
    });

    return () => unsubscribeStampDisputes(channel);
  }, [queryClient]);

  return query;
}
