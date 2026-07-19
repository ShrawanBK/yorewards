"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { StampDisputeListItem } from "@repo/supabase/queries/stamp-disputes-shared";
import {
  subscribeStampDisputes,
  unsubscribeStampDisputes,
} from "@repo/supabase/realtime/stamp-disputes";
import { listAdminCardDisputesAction } from "@/features/disputes/api/disputeActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

export function adminCardDisputesQueryKey(customerCardId: string) {
  return ["admin-card-disputes", customerCardId] as const;
}

export function useAdminCardDisputes(customerCardId: string) {
  const tErrors = useTranslations("errors.actions");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminCardDisputesQueryKey(customerCardId),
    queryFn: async () => {
      const result = await listAdminCardDisputesAction(customerCardId);
      if (result.error) {
        throw new Error(resolveActionError(tErrors, result.error));
      }
      return result.disputes;
    },
    enabled: Boolean(customerCardId),
    staleTime: 0,
  });

  useEffect(() => {
    if (!customerCardId) return;

    const channel = subscribeStampDisputes(
      { kind: "card", customerCardId },
      {
        onChange: () => {
          void queryClient.refetchQueries({
            queryKey: adminCardDisputesQueryKey(customerCardId),
          });
        },
      },
    );

    return () => unsubscribeStampDisputes(channel);
  }, [customerCardId, queryClient]);

  return query;
}

export type { StampDisputeListItem };
