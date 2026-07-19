"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import type { LoyaltyCardLocationRow } from "@repo/supabase/queries/loyalty-card-locations";
import { cn } from "@repo/ui/lib/utils";

export type BranchRuleState = {
  locationId: string;
  stampAllowed: boolean;
  redeemAllowed: boolean;
};

function buildInitialRules(
  locations: MerchantLocationRow[],
  existing: LoyaltyCardLocationRow[],
): BranchRuleState[] {
  if (existing.length === 0) {
    return locations.map((location) => ({
      locationId: location.id,
      stampAllowed: true,
      redeemAllowed: true,
    }));
  }

  return locations.map((location) => {
    const rule = existing.find((row) => row.location_id === location.id);
    return {
      locationId: location.id,
      stampAllowed: rule?.stamp_allowed ?? false,
      redeemAllowed: rule?.redeem_allowed ?? false,
    };
  });
}

export function LoyaltyCardBranchRules({
  locations,
  existingRules,
  readOnly,
  onChange,
}: {
  locations: MerchantLocationRow[];
  existingRules: LoyaltyCardLocationRow[];
  readOnly: boolean;
  onChange: (rules: BranchRuleState[]) => void;
}) {
  const t = useTranslations("loyaltyCard.branches");
  const activeLocations = useMemo(
    () => locations.filter((location) => location.is_active),
    [locations],
  );
  const [rules, setRules] = useState<BranchRuleState[]>(() =>
    buildInitialRules(activeLocations, existingRules),
  );

  useEffect(() => {
    const initial = buildInitialRules(activeLocations, existingRules);
    setRules(initial);
    onChange(initial);
    // onChange is stable (setState); sync when server rules refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLocations, existingRules]);

  if (activeLocations.length <= 1) {
    return null;
  }

  function updateRule(
    locationId: string,
    patch: Partial<Pick<BranchRuleState, "stampAllowed" | "redeemAllowed">>,
  ) {
    if (readOnly) return;
    const next = rules.map((rule) =>
      rule.locationId === locationId ? { ...rule, ...patch } : rule,
    );
    setRules(next);
    onChange(next);
  }

  return (
    <Card className="merchant-glass-card">
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <p className="text-sm merchant-body-muted">{t("subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeLocations.map((location) => {
          const rule = rules.find((r) => r.locationId === location.id);
          if (!rule) return null;

          return (
            <div
              key={location.id}
              className="rounded-lg border border-border p-4"
            >
              <p className="font-medium text-foreground">{location.name}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-6">
                <label
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 text-sm",
                    readOnly && "cursor-not-allowed opacity-70",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={rule.stampAllowed}
                    disabled={readOnly}
                    className="size-4 rounded border-input"
                    onChange={(e) =>
                      updateRule(location.id, {
                        stampAllowed: e.target.checked,
                      })
                    }
                  />
                  {t("stampAllowed")}
                </label>
                <label
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 text-sm",
                    readOnly && "cursor-not-allowed opacity-70",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={rule.redeemAllowed}
                    disabled={readOnly}
                    className="size-4 rounded border-input"
                    onChange={(e) =>
                      updateRule(location.id, {
                        redeemAllowed: e.target.checked,
                      })
                    }
                  />
                  {t("redeemAllowed")}
                </label>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function serializeBranchRules(rules: BranchRuleState[]): string {
  return JSON.stringify(rules);
}
