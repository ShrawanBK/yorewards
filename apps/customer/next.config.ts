import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "next-pwa";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  env: {
    NEXT_PUBLIC_YOREWARDS_APP: "customer",
  },
};

export default withPWA(withNextIntl(nextConfig));
