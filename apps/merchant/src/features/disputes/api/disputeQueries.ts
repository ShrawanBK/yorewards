"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { StampDisputeListItem } from "@repo/supabase/queries/stamp-disputes";
import {
  subscribeStampDisputes,
  unsubscribeStampDisputes,
} from "@repo/supabase/realtime/stamp-disputes";
import { listMerchantDisputesAction } from "@/features/disputes/api/disputeActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

export function merchantDisputesQueryKey(merchantId: string) {
  return ["merchant-disputes", merchantId] as const;
}

export function useMerchantDisputes(
  merchantId: string,
  initialData?: StampDisputeListItem[],
) {
  const tErrors = useTranslations("errors.actions");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: merchantDisputesQueryKey(merchantId),
    queryFn: async () => {
      const result = await listMerchantDisputesAction(merchantId, "all");
      if (result.error) {
        throw new Error(resolveActionError(tErrors, result.error));
      }
      return result.disputes;
    },
    initialData,
    staleTime: 0,
  });

  useEffect(() => {
    const channel = subscribeStampDisputes(
      { kind: "merchant", merchantId },
      {
        onChange: () => {
          void queryClient.refetchQueries({
            queryKey: merchantDisputesQueryKey(merchantId),
          });
        },
      },
    );

    return () => unsubscribeStampDisputes(channel);
  }, [merchantId, queryClient]);

  return query;
}
