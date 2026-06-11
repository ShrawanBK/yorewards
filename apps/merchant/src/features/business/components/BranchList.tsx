"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { cn } from "@repo/ui/lib/utils";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import { BranchFormDialog } from "@/features/business/components/BranchFormDialog";
import {
  deactivateBranchAction,
  setPrimaryBranchAction,
} from "@/features/business/api/locationActions";

export function BranchList({
  merchantId,
  locations,
}: {
  merchantId: string;
  locations: MerchantLocationRow[];
}) {
  const t = useTranslations("branches");
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MerchantLocationRow | null>(null);
  const [deactivating, setDeactivating] = useState<MerchantLocationRow | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeLocations = locations.filter((l) => l.is_active);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(location: MerchantLocationRow) {
    setEditing(location);
    setFormOpen(true);
  }

  function setPrimary(locationId: string) {
    startTransition(async () => {
      const result = await setPrimaryBranchAction(merchantId, locationId);
      if (result.error) setError(result.error);
      else {
        setError(null);
        router.refresh();
      }
    });
  }

  function confirmDeactivate() {
    if (!deactivating) return;
    startTransition(async () => {
      const result = await deactivateBranchAction(
        merchantId,
        deactivating.id,
      );
      if (result.error) setError(result.error);
      else {
        setError(null);
        setDeactivating(null);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-lg">{t("listTitle")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("listSubtitle")}
            </p>
          </div>
          <Button size="sm" onClick={openAdd}>
            {t("actions.addBranch")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {locations.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center">
              <p className="font-medium">{t("empty.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("empty.description")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {locations.map((location) => (
                <li
                  key={location.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
                    !location.is_active && "opacity-60",
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{location.name}</span>
                      {location.is_primary ? (
                        <Badge variant="outline" className="border-brand-purple text-brand-purple">
                          {t("badges.primary")}
                        </Badge>
                      ) : null}
                      {!location.is_active ? (
                        <Badge variant="secondary">{t("badges.inactive")}</Badge>
                      ) : null}
                    </div>
                    {(location.address || location.city) && (
                      <p className="text-sm text-muted-foreground">
                        {[location.address, location.city]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {location.is_active && !location.is_primary ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setPrimary(location.id)}
                      >
                        {t("actions.setPrimary")}
                      </Button>
                    ) : null}
                    {location.is_active ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => openEdit(location)}
                        >
                          {t("actions.edit")}
                        </Button>
                        {activeLocations.length > 1 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => setDeactivating(location)}
                          >
                            {t("actions.deactivate")}
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <BranchFormDialog
        merchantId={merchantId}
        open={formOpen}
        onOpenChange={setFormOpen}
        branch={editing}
      />

      <Dialog
        open={Boolean(deactivating)}
        onOpenChange={(open) => !open && setDeactivating(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deactivate.title")}</DialogTitle>
            <DialogDescription>
              {t("deactivate.description", {
                name: deactivating?.name ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeactivating(null)}
              disabled={isPending}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={confirmDeactivate}
            >
              {t("actions.deactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
