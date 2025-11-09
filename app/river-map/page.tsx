"use client"

import { NextPage } from 'next';
import RiverMap from '@/components/river-map';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useTranslation } from 'react-i18next';

const RiverMapPage: NextPage = () => {
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
              {t('riverMapTitle', 'River Map Simulation')}
            </h1>
            <p className="mt-2 text-gray-600">
              {t('riverMapSubTitle', 'Interactive river map showing coordinates along an 8000m waterway')}
            </p>
          </header>

          <div className="w-full max-w-5xl p-6 bg-white shadow-lg rounded-lg">
            <RiverMap width={900} height={500} />
          </div>

          <div className="mt-8 text-center text-gray-600 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  {t('riverMapFeature1Title', 'Interactive Navigation')}
                </h3>
                <p className="text-blue-600">
                  {t('riverMapFeature1Desc', 'Move your mouse over the river to see precise coordinates')}
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">
                  {t('riverMapFeature2Title', '8000m Length')}
                </h3>
                <p className="text-green-600">
                  {t('riverMapFeature2Desc', 'Simulated river spanning 8 kilometers with natural curves')}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">
                  {t('riverMapFeature3Title', 'Real Coordinates')}
                </h3>
                <p className="text-purple-600">
                  {t('riverMapFeature3Desc', 'Live latitude and longitude display based on Hanoi region')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default RiverMapPage;