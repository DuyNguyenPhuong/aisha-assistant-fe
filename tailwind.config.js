module.exports = {
  content: [
    "./pages*.{js,ts,jsx,tsx,mdx}",
    "./components*.{js,ts,jsx,tsx,mdx}",
    "./app*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
      },
      colors: {
        primary: "#1e5631",
        secondary: "#a3c986",
        accent: "#3d5a45",
        background: "#e9eee9",
        foreground: "#1a2e1a",
        muted: "#c0c9c0",
        "muted-foreground": "#4d5e4d",
      },
      backgroundImage: {
        "gradient-main": "linear-gradient(180deg, #3d5a45 0%, #a3c986 100%)",
      },
    },
  },
  plugins: [],
};
