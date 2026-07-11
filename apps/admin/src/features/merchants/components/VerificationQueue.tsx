"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import {
  approveVerificationDocumentAction,
  rejectVerificationDocumentAction,
} from "@/features/merchants/api/verificationActions";

type VerificationQueueItem = {
  id: string;
  merchant_id: string;
  document_type: string;
  file_url: string;
  created_at: string;
  business_name: string;
  merchant_email: string;
};

export function VerificationQueue({
  documents,
}: {
  documents: VerificationQueueItem[];
}) {
  const t = useTranslations("merchants.verification");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("empty")}</p>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {doc.business_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{doc.merchant_email}</p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <p className="capitalize">{doc.document_type.replace("_", " ")}</p>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t("viewDocument")}
              </a>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="admin-btn-outline"
                disabled={pendingId === doc.id}
                onClick={async () => {
                  setPendingId(doc.id);
                  await rejectVerificationDocumentAction(doc.id, t("defaultRejectReason"));
                  setPendingId(null);
                  router.refresh();
                }}
              >
                {t("reject")}
              </Button>
              <Button
                type="button"
                disabled={pendingId === doc.id}
                onClick={async () => {
                  setPendingId(doc.id);
                  await approveVerificationDocumentAction(doc.id);
                  setPendingId(null);
                  router.refresh();
                }}
              >
                {t("approve")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
