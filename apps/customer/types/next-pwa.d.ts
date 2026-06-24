declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PwaConfig = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    reloadOnOnline?: boolean;
    scope?: string;
    sw?: string;
    runtimeCaching?: unknown[];
  };

  export default function withPWAInit(
    config: PwaConfig,
  ): (nextConfig: NextConfig) => NextConfig;
}
