"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSidebar } from "@/components/ui/sidebar";
import "../app/i18n";
const SidebarLanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const { state } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const languages = [
    { code: "en", label: "ENG", flag: "🇬🇧" },
    { code: "ru", label: "RUS", flag: "🇷🇺" },
    { code: "vi", label: "VIE", flag: "🇻🇳" },
  ];
  const currentFlag =
    languages.find((lang) => lang.code === i18n.language)?.flag ||
    i18n.language.toUpperCase();
  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };
  return (
    <>
      {state !== "collapsed" && (
        <div className="relative" tabIndex={0} onBlur={() => setIsOpen(false)}>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center justify-between w-full border border-primary rounded-md py-1 px-3 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 focus:outline-none transition-colors duration-300"
          >
            <span className="text-primary">Language</span>
            <span className="text-xl">{currentFlag}</span>
          </button>
          {isOpen && (
            <div className="absolute left-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 transition transform origin-top">
              <div className="py-1">
                {languages.map(({ code, label, flag }) => (
                  <button
                    key={code}
                    onMouseDown={() => handleLanguageChange(code)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-muted flex items-center space-x-2"
                  >
                    <span>{flag}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
export default SidebarLanguageToggle;
