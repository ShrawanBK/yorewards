import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  env: {
    NEXT_PUBLIC_YOREWARDS_APP: "customer",
  },
};

export default withNextIntl(nextConfig);
