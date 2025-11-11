"use client";
import { Thread } from "@/components/assistant-ui/thread";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MyRuntimeProvider } from "@/contexts/my-runtime-provider";
export default function Assistant() {
  return (
    <SidebarProvider>
      <MyRuntimeProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="h-full max-h-dvh">
            <Thread />
          </main>
        </SidebarInset>
      </MyRuntimeProvider>
    </SidebarProvider>
  );
}
