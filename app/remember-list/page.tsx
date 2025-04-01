'use client';

import { NextPage } from 'next';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useTranslation } from 'react-i18next';

const RememberListPage: NextPage = () => {
  const { t } = useTranslation();

  // Fake items for now — you can fetch real remembered data later
  const rememberedItems = [
    'Backwash filter every Monday',
    'pH monitoring every 4 hours',
    'Add chlorine on low turbidity',
  ];

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
              {t('rememberListTitle', 'Remember List')}
            </h1>
            <p className="mt-2 text-gray-600">
              {t('rememberListSubtitle', 'Here are the things you’ve asked me to remember.')}
            </p>
          </header>

          <ul className="w-full max-w-3xl bg-white shadow rounded-lg divide-y divide-gray-200">
            {rememberedItems.map((item, index) => (
              <li key={index} className="p-4 text-gray-700">{item}</li>
            ))}
          </ul>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default RememberListPage;
