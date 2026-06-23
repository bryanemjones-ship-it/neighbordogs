import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        nd: {
          cream: "#FFF8EC",
          "card-cream": "#FFFDF7",
          butter: "#FFE9A8",
          golden: "#E9A84A",
          "golden-deep": "#C9923F",
          peach: "#FFD6B0",
          coral: "#F28B82",
          collar: "#5C8FD6",
          purple: "#C7B7F3",
          grass: "#4FA76B",
          "grass-dark": "#459A5E",
          mint: "#CDEFD8",
          text: "#2E2722",
          "text-soft": "#71665D",
          border: "#EADDC8",
          sky: "#DCEEFF",
          heart: "#F28B82",
        },
      },
      borderRadius: {
        nd: "1.25rem",
        "nd-lg": "1.75rem",
      },
    },
  },
} satisfies Config;

export default config;
