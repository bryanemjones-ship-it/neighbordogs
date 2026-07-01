import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      borderRadius: {
        nd: "1.25rem",
        "nd-lg": "1.75rem",
      },
    },
  },
} satisfies Config;

export default config;
