import type { MerchantStatus } from "@repo/supabase/types";
import { Badge } from "@repo/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { CheckCircle2, Clock, ShieldAlert, XCircle } from "lucide-react";

const statusConfig: Record<
  MerchantStatus,
  {
    label: string;
    description: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof Clock;
  }
> = {
  pending: {
    label: "Pending approval",
    description:
      "Your application is under review. We'll notify you once an admin approves your account.",
    variant: "secondary",
    icon: Clock,
  },
  active: {
    label: "Active",
    description:
      "Your account is approved. Set up loyalty cards and start collecting stamps.",
    variant: "default",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    description:
      "Your application was not approved. See the reason below or contact support.",
    variant: "destructive",
    icon: XCircle,
  },
  suspended: {
    label: "Suspended",
    description:
      "Your account is temporarily suspended. Contact support for assistance.",
    variant: "outline",
    icon: ShieldAlert,
  },
};

export function MerchantStatusPanel({
  businessName,
  status,
  rejectionReason,
}: {
  businessName: string;
  status: MerchantStatus;
  rejectionReason: string | null;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className="border-brand-purple/20 bg-gradient-to-br from-brand-surface to-white">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{businessName}</CardTitle>
            <CardDescription>Account status</CardDescription>
          </div>
          <Badge variant={config.variant} className="shrink-0 capitalize">
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 rounded-lg border bg-background/80 p-4">
          <Icon className="mt-0.5 size-5 shrink-0 text-brand-purple" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {config.description}
          </p>
        </div>
        {status === "rejected" && rejectionReason && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">Rejection reason</p>
            <p className="mt-1 text-muted-foreground">{rejectionReason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
