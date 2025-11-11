"use client";
import { useEffect, useState } from "react";
import { NextPage } from "next";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useTranslation } from "react-i18next";
import { backendUrl } from "@/lib/constants";
import { CalendarDays } from "lucide-react";
interface Entry {
  timestamp: string;
  lines: string[];
}
const RememberListPage: NextPage = () => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filename, setFilename] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [length, setLength] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/context/render`);
        const data = await response.json();
        const parsedHistory: Entry[] = JSON.parse(data.context);
        setEntries(parsedHistory);
        setFilename(data.filename);
        setUpdatedAt(new Date(data.updated_at).toLocaleString());
        setLength(data.length);
      } catch (error) {
        console.error("Error fetching remembered context:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, []);
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
              {t("rememberListTitle", "Remember List")}
            </h1>
            <p className="mt-2 text-gray-600">
              {t(
                "rememberListSubtitle",
                "Here are the things you’ve asked me to remember.",
              )}
            </p>
          </header>
          <div className="w-full max-w-3xl space-y-8">
            {}
            {!loading && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 shadow-sm">
                <p>
                  <strong>{t(`File`)}:</strong> {filename}
                </p>
                <p>
                  <strong>{t(`Length`)}:</strong> {length} {t(`characters`)}
                </p>
                <p>
                  <strong>{t(`lastUpdated`)}:</strong> {updatedAt}
                </p>
              </div>
            )}
            {}
            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : entries.length > 0 ? (
              entries.map((entry, i) => (
                <div key={i}>
                  {}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <CalendarDays className="w-4 h-4 text-green-500" />
                    <span className="font-semibold">{t(`Updated`)}:</span>
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                  {}
                  <ul className="bg-white shadow rounded-lg divide-y divide-gray-100">
                    {entry.lines.map((line, j) => (
                      <li
                        key={j}
                        className="p-4 text-gray-800 font-mono whitespace-pre-wrap"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                No remembered items found.
              </p>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
export default RememberListPage;
