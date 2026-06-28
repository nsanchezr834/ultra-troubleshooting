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
  isListening,
  onMicClick,
  isDarkMode = false,
  inputRef,
  resultsId,
  children,
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
        className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none"
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
          'w-full border rounded-2xl py-5 pl-14 pr-[4.5rem] sm:pr-72',
          'text-base font-semibold',
          'placeholder-neutral-400 focus:outline-none',
          'focus:border-ultra-orange focus:ring-1 focus:ring-ultra-orange',
          'transition-all duration-200 shadow-md',
          isDarkMode
            ? 'bg-[#0f1015] border-neutral-700 text-white placeholder-neutral-500'
            : 'bg-white border-neutral-200 text-black placeholder-neutral-400',
          // Listening pulse border
          isListening
            ? 'border-emerald-500 ring-1 ring-emerald-500/40 animate-[borderPulse_1s_ease-in-out_infinite]'
            : '',
        ].join(' ')}
      />

      {/* Right slot: mic button (always) + SpeechAgent badge (desktop only) */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {/* Mobile-only mic toggle (for the inline voice dictation in troubleshooting-search) */}
        <button
          type="button"
          onClick={onMicClick}
          aria-label={isListening ? 'Detener dictado por voz' : 'Dictado por voz'}
          aria-pressed={isListening}
          className={[
            'sm:hidden p-2 rounded-xl transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ultra-orange',
            isListening
              ? 'bg-[#FF6A00] text-white shadow-md shadow-[#FF6A00]/25'
              : isDarkMode
                ? 'bg-neutral-800 text-[#FF6A00] hover:text-white hover:bg-[#FF6A00]'
                : 'bg-neutral-100 text-neutral-500 hover:text-[#FF6A00]',
          ].join(' ')}
        >
          {isListening ? (
            <MicOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Mic className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {/* Desktop slot — SpeechAgent badge + mic button (visibility controlled by SpeechAgent) */}
        <div>{children}</div>
      </div>

      {/* ── Mobile badge (below the search bar) ── */}
      {!isListening && (
        <div className="sm:hidden absolute left-1/2 -translate-x-1/2 -bottom-6 flex items-center gap-1.5 pointer-events-none select-none w-max z-10" aria-hidden="true">
          <img src="/autoryx_badge_v2.svg" alt="" className={`w-4 h-4 object-contain shrink-0 ${isDarkMode ? 'invert opacity-80' : ''}`} />
          <span className={`text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-neutral-400' : 'text-neutral-400'}`}>powered by</span>
          <span className="text-[10px] font-black text-[#FF6A00] uppercase tracking-widest">Autoryx AI</span>
        </div>
      )}
    </div>
  );
}
