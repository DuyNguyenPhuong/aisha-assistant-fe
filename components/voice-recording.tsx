'use client';

import React, { useEffect, useState, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export type VoiceRecorderProps = {
  onTranscriptChange?: (transcript: string) => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
};

const languages = [
  { code: 'en-US', label: 'en', flag: '🇬🇧' },
  { code: 'ru-RU', label: 'ru', flag: '🇷🇺' },
  { code: 'vi-VN', label: 'vi', flag: '🇻🇳' },
];

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptChange,
  onVoiceStart,
  onVoiceStop,
}) => {
  const { transcript, listening, browserSupportsSpeechRecognition, resetTranscript } = useSpeechRecognition();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onTranscriptChange) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleIconClick}
        className="p-1 rounded-full focus:outline-none transition-transform duration-200 mr-2 hover:scale-110"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className={`w-6 h-6 ${listening ? 'text-red-500 animate-pulse' : 'text-black'}`}
        >
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5 10a7 7 0 0014 0h-2a5 5 0 01-10 0H5z"
          />
          <path d="M12 19v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {showDropdown && !listening && (
        <div
          ref={dropdownRef}
          className="absolute left-full top-2/3 transform -translate-y-1/2 bg-white border border-gray-300 rounded shadow-lg z-50"
        >
          <ul className="py-1">
            {languages.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => handleLanguageSelect(lang.code)}
                  className="flex items-center w-full text-left px-3 py-2 hover:bg-gray-200"
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