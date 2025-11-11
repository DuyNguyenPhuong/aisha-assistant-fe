import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { MyRuntimeProvider } from "@/contexts/my-runtime-provider";
import { Toaster } from "@/components/ui/sonner";
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Industrial AI Assistant",
  description: "Wastewater Treatment AI Assistant",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MyRuntimeProvider>
      <html lang="en">
        <body className={`${outfit.variable} antialiased`}>
          {children}
          <Toaster />
        </body>
      </html>
    </MyRuntimeProvider>
  );
}
