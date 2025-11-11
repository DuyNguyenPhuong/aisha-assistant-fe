"use client";
import { NextPage } from "next";
import MapComponent from "@/components/locationmap";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useTranslation } from "react-i18next";
const LocationPage: NextPage = () => {
  const { t } = useTranslation();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="relative min-h-screen flex flex-col items-center justify-center p-8">
          <div className="absolute top-4 left-4 z-10">
            <SidebarTrigger />
          </div>
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">
              {t("ourLocationTitle")}
            </h1>
            <p className="mt-2 text-gray-600">{t("ourLocationSubTitle")}</p>
          </header>
          <div className="w-full max-w-4xl p-4 bg-white shadow rounded-lg">
            <MapComponent />
          </div>
          <footer className="mt-8 text-center text-gray-600">
            <p>
              <strong>{t("address")}</strong>: {t("realAddress")}
            </p>
            <p>
              <strong>{t("phoneNumber")}</strong>: +(84) 966666998
            </p>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
export default LocationPage;
