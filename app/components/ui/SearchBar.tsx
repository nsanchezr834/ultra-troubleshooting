'use client';

import React, { useId } from 'react';
import { Search, Mic, MicOff } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
//  SearchBar — isolated, accessible search input with mic toggle
//
//  Why a separate component?
//  - Removes 80+ lines of inline JSX from troubleshooting-search.
//  - Encapsulates all a11y requirements: label, aria-controls,
//    aria-expanded, role="searchbox", input autocomplete.
//  - The parent controls state; this component is purely presentational.
//
//  Props:
//  - value / onChange  →  controlled input
//  - placeholder       →  context-aware placeholder passed from parent
//  - isListening       →  shows mic as active / pulsing
//  - onMicClick        →  toggles voice dictation
//  - isDarkMode        →  theme flag
//  - onClearInput      →  optional clear button
// ─────────────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isListening: boolean;
  onMicClick: () => void;
  isDarkMode?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  /** ID of the results listbox (for aria-controls) */
  resultsId?: string;
  children?: React.ReactNode; // slot for SpeechAgent badge
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Escribe la falla o síntoma…',
  isDarkMode = false,
  inputRef,
  resultsId,
}: SearchBarProps) {
  const inputId = useId();

  return (
    <div className="relative w-full">
      {/* Hidden label for screen readers */}
      <label htmlFor={inputId} className="sr-only">
        Buscar falla o síntoma
      </label>

      {/* Search icon — decorative */}
      <Search
        className="absolute left-5 top-[26px] sm:top-[34px] -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none"
        aria-hidden="true"
      />

      {/* Input */}
      <input
        id={inputId}
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="search"
        role="searchbox"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-controls={resultsId}
        aria-expanded={value.trim().length > 0}
        aria-autocomplete="list"
        className={[
          'w-full border rounded-2xl py-5 pl-14 pr-[4.5rem] sm:pr-8',
          'text-base font-semibold',
          'placeholder-neutral-400 focus:outline-none',
          'focus:border-ultra-orange focus:ring-1 focus:ring-ultra-orange',
          'transition-all duration-200 shadow-md',
          isDarkMode
            ? 'bg-[#0f1015] border-neutral-700 text-white placeholder-neutral-500'
            : 'bg-white border-neutral-200 text-black placeholder-neutral-400',
        ].join(' ')}
      />
    </div>
  );
}
