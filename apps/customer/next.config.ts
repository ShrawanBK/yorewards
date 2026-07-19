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
  // Update when your LAN IP changes (ipconfig). Phone must match an entry here.
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.68.104", // Local IP?
    "192.168.68.104:3000", // Local IP
  ],
};

export default withPWA(withNextIntl(nextConfig));
