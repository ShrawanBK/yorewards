"use client";

import { AdminCardDisputesPanel } from "@/features/disputes";
import { AdminStampToolView } from "@/features/stamps";

export function AdminStampsWorkbench({ initialCardId }: { initialCardId?: string }) {
  return (
    <AdminStampToolView
      initialCardId={initialCardId}
      renderCardExtras={(card, { refreshCard }) => (
        <AdminCardDisputesPanel
          customerCardId={card.customerCardId}
          currencyCode={card.currencyCode}
          onResolved={refreshCard}
        />
      )}
    />
  );
}
