"use client";
import React, { useEffect, useState, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
export type VoiceRecorderProps = {
  onTranscriptChange?: (transcript: string) => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
};
const languages = [
  { code: "en-US", label: "en", flag: "🇬🇧" },
  { code: "ru-RU", label: "ru", flag: "🇷🇺" },
  { code: "vi-VN", label: "vi", flag: "🇻🇳" },
];
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptChange,
  onVoiceStart,
  onVoiceStop,
}) => {
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (onTranscriptChange) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);
  if (!browserSupportsSpeechRecognition) {
    return <span>Browser does not support speech recognition.</span>;
  }
  const handleIconClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setShowDropdown(false);
      if (onVoiceStop) onVoiceStop();
    } else {
      setShowDropdown(true);
    }
  };
  const handleLanguageSelect = (language: string) => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true, language });
    setShowDropdown(false);
    if (onVoiceStart) onVoiceStart();
  };
  return (
    <div className="flex relative items-center">
      <Button
        type="button"
        onClick={handleIconClick}
        variant="ghost"
        size="icon"
        className={`mr-2 rounded-full transition-transform duration-200 hover:scale-110 ${listening ? "text-red-500 animate-pulse" : ""}`}
      >
        <Mic className="w-5 h-5" />
      </Button>
      {showDropdown && !listening && (
        <div
          ref={dropdownRef}
          className="absolute top-2/3 left-full z-50 bg-white rounded border border-gray-300 shadow-lg transform -translate-y-1/2"
        >
          <ul className="py-1">
            {languages.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => handleLanguageSelect(lang.code)}
                  className="flex items-center px-3 py-2 w-full text-left hover:bg-gray-200"
                >
                  <span className="mr-1">{lang.flag}</span>
                  {lang.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
export default VoiceRecorder;
