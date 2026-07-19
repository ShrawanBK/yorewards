"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/tabs";
import type { Database, MerchantStatus } from "@repo/supabase/types";
import {
  MERCHANT_STATUS_BADGE,
  MerchantAdminActions,
} from "@/features/merchants/components/MerchantAdminActions";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

type FilterValue = "all" | MerchantStatus;

const STATUS_ORDER: MerchantStatus[] = [
  "pending",
  "pending_verification",
  "active",
  "suspended",
  "rejected",
];

const FILTERS: FilterValue[] = ["all", ...STATUS_ORDER];

export function MerchantQueue({ merchants }: { merchants: Merchant[] }) {
  const t = useTranslations("merchants");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const countries = useMemo(
    () => [...new Set(merchants.map((m) => m.country))].sort(),
    [merchants],
  );
  const categories = useMemo(
    () => [...new Set(merchants.map((m) => m.category))].sort(),
    [merchants],
  );

  const counts = useMemo(() => {
    const base: Record<FilterValue, number> = {
      all: merchants.length,
      pending: 0,
      pending_verification: 0,
      active: 0,
      suspended: 0,
      rejected: 0,
    };
    for (const merchant of merchants) base[merchant.status] += 1;
    return base;
  }, [merchants]);

  const filtered = useMemo(() => {
    let rows = merchants;

    if (filter !== "all") {
      rows = rows.filter((merchant) => merchant.status === filter);
    }
    if (countryFilter !== "all") {
      rows = rows.filter((merchant) => merchant.country === countryFilter);
    }
    if (categoryFilter !== "all") {
      rows = rows.filter((merchant) => merchant.category === categoryFilter);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((merchant) => {
        const name = merchant.business_name.toLowerCase();
        const email = merchant.email.toLowerCase();
        const phone = merchant.phone?.toLowerCase() ?? "";
        const category = merchant.category.toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          category.includes(q)
        );
      });
    }

    if (
      filter === "all" &&
      countryFilter === "all" &&
      categoryFilter === "all" &&
      !q
    ) {
      return [...rows].sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
      );
    }

    return rows;
  }, [merchants, filter, countryFilter, categoryFilter, query]);

  return (
    <div className="space-y-4">
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as FilterValue)}
      >
        <TabsList className="flex-wrap">
          {FILTERS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {t(`filters.${value}`)} ({counts[value]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("filters.country")}</span>
          <select
            value={countryFilter}
            onChange={(event) => setCountryFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="all">{t("filters.allCountries")}</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("filters.category")}</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="all">{t("filters.allCategories")}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <Card className="admin-card items-center py-12 text-center">
          <CardContent className="space-y-1">
            <p className="font-medium">{t("empty.title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("empty.description")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((merchant) => (
            <MerchantCard key={merchant.id} merchant={merchant} />
          ))}
        </div>
      )}
    </div>
  );
}

function MerchantCard({ merchant }: { merchant: Merchant }) {
  const t = useTranslations("merchants");
  const format = useFormatter();
  const name = merchant.business_name;
  const badge = MERCHANT_STATUS_BADGE[merchant.status];

  return (
    <Card className="admin-card">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/merchants/${merchant.id}`}
            className="hover:text-primary hover:underline"
          >
            {name}
          </Link>
          <Badge variant="secondary">{merchant.country}</Badge>
          <Badge variant={badge.variant} className={badge.className}>
            {t(`status.${merchant.status}`)}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {merchant.email} · {merchant.category}
          {merchant.phone ? ` · ${merchant.phone}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("registered", {
            date: format.dateTime(new Date(merchant.created_at), {
              dateStyle: "medium",
            }),
          })}
        </p>
        {merchant.status === "rejected" && merchant.rejection_reason ? (
          <p className="text-xs text-destructive">
            {t("rejectedReason", { reason: merchant.rejection_reason })}
          </p>
        ) : null}
        {merchant.status === "suspended" && merchant.status_reason ? (
          <p className="text-xs text-destructive">
            {t("suspendedReason", { reason: merchant.status_reason })}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          <MerchantAdminActions merchant={merchant} />
          <Button
            asChild
            variant="outline"
            size="lg"
            className="admin-btn-outline gap-1"
          >
            <Link href={`/admin/merchants/${merchant.id}`}>
              {t("detail.view")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
