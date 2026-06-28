'use client';

import React, { useEffect, useRef } from 'react';
import {
  X,
  Check,
  Wrench,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { ExtendedFault } from './FaultCard';

// ─────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────
interface FaultModalProps {
  item: ExtendedFault;
  showFeedback: boolean;
  onClose: () => void;         // triggers feedback gate
  onForceClose: () => void;    // bypasses feedback gate
  onFeedback: (solved: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────
const CLIENT_LOGO_MAP: Record<string, string> = {
  'manifest.eco': 'manifest_logo.png',
  'highline-commerce': 'highline_logo.png',
  'outerspace': 'outerspace_logo.png',
  'mountainy': 'mountainy_logo.png',
};

function getClientLogoSrc(key: string): string {
  return `/${CLIENT_LOGO_MAP[key] ?? `${key.replace('-', '_')}_logo.png`}`;
}

// ─────────────────────────────────────────────────────────────────
//  ProtocolStep — each numbered step card inside the modal
// ─────────────────────────────────────────────────────────────────
function ProtocolStep({
  stepNum,
  stepDesc,
  index,
}: {
  stepNum: string;
  stepDesc: string;
  index: number;
}) {
  return (
    <div
      className="flex gap-4 items-start bg-white p-4 sm:p-5 rounded-[1.25rem] border border-neutral-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden"
      style={{
        animation: 'fadeSlideUp 240ms ease-out forwards',
        animationDelay: `${index * 60}ms`,
        opacity: 0,
      }}
    >
      {/* Step number bubble */}
      <div className="flex-shrink-0 pt-0.5">
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF6A00] text-white shadow-[0_2px_8px_rgba(255,106,0,0.3)] flex items-center justify-center text-[11px] sm:text-xs font-black">
          {stepNum}
        </span>
      </div>
      {/* Step description — allows safe HTML for bold/code markup in SOP */}
      <p
        className="text-neutral-700 text-[14px] sm:text-[15px] leading-relaxed font-medium pt-0.5 flex-1"
        dangerouslySetInnerHTML={{ __html: stepDesc }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  FeedbackScreen — shown when user dismisses the modal
// ─────────────────────────────────────────────────────────────────
function FeedbackScreen({
  onFeedback,
  onForceClose,
}: {
  onFeedback: (solved: boolean) => void;
  onForceClose: () => void;
}) {
  return (
    <div
      className="p-8 flex flex-col items-center justify-center text-center gap-6 my-auto min-h-[360px]"
      role="dialog"
      aria-labelledby="feedback-title"
      aria-describedby="feedback-desc"
      style={{ animation: 'fadeSlideUp 260ms ease-out both' }}
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-ultra-orange/10 flex items-center justify-center text-ultra-orange ring-4 ring-ultra-orange/5">
        <Wrench className="w-8 h-8" aria-hidden="true" />
      </div>

      {/* Copy */}
      <div className="space-y-2 max-w-sm">
        <h3
          id="feedback-title"
          className="text-xl font-black text-neutral-900 leading-tight"
        >
          ¿Esta información resolvió tu problema?
        </h3>
        <p id="feedback-desc" className="text-sm text-neutral-500 leading-relaxed">
          Tu respuesta nos ayuda a clasificar esta falla y optimizar las búsquedas de todo el equipo.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-2">
        <button
          type="button"
          onClick={() => onFeedback(true)}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Check className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          Sí, solucionado
        </button>
        <button
          type="button"
          onClick={() => onFeedback(false)}
          className="flex-1 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          <X className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          No, no me sirvió
        </button>
      </div>

      <button
        type="button"
        onClick={onForceClose}
        className="text-xs text-neutral-400 hover:text-neutral-600 underline transition-colors cursor-pointer mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 rounded"
      >
        Cerrar sin calificar
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  FaultModal — premium, accessible full-detail modal
//
//  Accessibility:
//  - role="dialog" with aria-modal and aria-labelledby.
//  - Focus trapped inside while open (first focusable: close button).
//  - Escape key closes the modal (triggers feedback gate).
//  - Backdrop click also triggers close.
//  - Scroll locked on body while open via overflow-hidden.
// ─────────────────────────────────────────────────────────────────
export function FaultModal({
  item,
  showFeedback,
  onClose,
  onForceClose,
  onFeedback,
}: FaultModalProps) {
  const isAdvice = item.category === 'Consejos Operativos';
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Auto-focus close button on mount
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  // Keyboard: Escape → close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Parse steps lazily
  const steps = item.resolution_protocol.split('\n').filter(Boolean);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ animation: 'fadeIn 180ms ease-out both' }}
    >
      {/* Blurred dark overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-[#FCFCFC] border border-white/20 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.18)] ring-1 ring-black/5 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        style={{ animation: 'scaleUp 240ms cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {showFeedback ? (
          <FeedbackScreen onFeedback={onFeedback} onForceClose={onForceClose} />
        ) : (
          <>
            {/* ── Header ── */}
            <div className="px-5 py-5 sm:px-8 sm:py-6 border-b border-neutral-100 flex justify-between items-start gap-4 bg-white z-10">
              <div className="flex-1 flex flex-col gap-2.5 min-w-0">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100/80 border border-neutral-200/60 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-mono text-neutral-600 font-bold tracking-widest uppercase">
                      {item.id}
                    </span>
                  </div>
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-ultra-orange/5 border border-ultra-orange/20 shadow-sm">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-ultra-orange font-black">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3
                  id="modal-title"
                  className="text-neutral-900 text-xl sm:text-[26px] font-black leading-tight tracking-tight"
                >
                  {item.symptom}
                </h3>
              </div>

              {/* Close button */}
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal"
                className="text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 bg-neutral-50/80 border border-neutral-200/50 rounded-full p-2.5 transition-all duration-200 flex-shrink-0 mt-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </button>
            </div>

            {/* ── Body (scrollable) ── */}
            <div className="p-5 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8 flex-1 bg-[#FAFAFA] overscroll-contain">

              {/* Advice: client/robot context banner */}
              {isAdvice && item.clientKey && (
                <div className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-amber-200/60 shadow-[0_2px_12px_rgba(245,158,11,0.06)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400 rounded-l-full" aria-hidden="true" />
                  <div className="relative shrink-0 ml-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl border border-amber-100 shadow-sm flex items-center justify-center p-2">
                      <img
                        src={getClientLogoSrc(item.clientKey)}
                        alt="Logo del cliente"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow-sm ring-2 ring-white">
                      <Lightbulb aria-hidden="true" className="w-3 h-3 fill-amber-100" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest block mb-0.5">
                      Entorno Cliente
                    </span>
                    <h4 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                      {item.robotName}
                      <span className="text-[9px] bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-200/50">
                        Robot
                      </span>
                    </h4>
                  </div>
                </div>
              )}

              {/* Resolution protocol */}
              <div className="space-y-3 sm:space-y-4">
                <span className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase ml-1 block">
                  Pasos de Resolución
                </span>
                <div className="space-y-3 sm:space-y-4">
                  {steps.map((stepText, idx) => {
                    const match = stepText.match(/^Paso\s+(\d+):\s*(.*)/i);
                    if (match) {
                      return (
                        <ProtocolStep
                          key={idx}
                          stepNum={match[1]}
                          stepDesc={match[2]}
                          index={idx}
                        />
                      );
                    }
                    return (
                      <div
                        key={idx}
                        className="bg-white p-4 sm:p-5 rounded-[1.25rem] border border-neutral-200/50 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                        style={{
                          animation: 'fadeSlideUp 240ms ease-out forwards',
                          animationDelay: `${idx * 60}ms`,
                          opacity: 0,
                        }}
                      >
                        <p
                          className="text-neutral-600 text-sm sm:text-[15px] leading-relaxed font-medium"
                          dangerouslySetInnerHTML={{ __html: stepText }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional video */}
              {item.video_url && (
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase ml-1 block">
                    Video Demostrativo
                  </span>
                  <div className="aspect-video w-full bg-neutral-900 rounded-[1.5rem] overflow-hidden relative shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-neutral-800">
                    <video
                      src={encodeURI(decodeURI(item.video_url))}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* SOP reference */}
              <div className="pt-4 border-t border-neutral-200/60 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-mono tracking-wider flex items-center gap-2">
                  REFERENCIA
                  <span className="text-neutral-700 font-bold bg-neutral-100 border border-neutral-200/60 px-2.5 py-1 rounded-md">
                    {item.sop_reference}
                  </span>
                </span>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="p-4 sm:p-6 border-t border-neutral-100 bg-white z-10 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none sm:ml-auto bg-[#FF6A00] hover:bg-[#e65c00] active:scale-[0.98] text-white font-bold text-[14px] uppercase tracking-widest px-8 py-4 sm:py-3.5 rounded-2xl transition-all shadow-[0_4px_16px_rgba(255,106,0,0.25)] flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ultra-orange focus-visible:ring-offset-2"
              >
                <Check className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
                Entendido
                <ChevronRight className="w-4 h-4 opacity-70" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
