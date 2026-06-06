import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#7C3AED",
          pink: "#EC4899",
          green: "#10B981",
          amber: "#F59E0B",
          deep: "#1E1B4B",
          surface: "#F8F7FF",
          red: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
};

export default config;
