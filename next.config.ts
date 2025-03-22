import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  i18n: {
    locales: ['en', 'ru', 'vi'],
    defaultLocale: 'en',
  },
};

export default nextConfig;
