'use client';

import React, { useState, useEffect } from 'react';

export type TabType = 'faults' | 'workflow' | 'videos' | 'tips';

interface WorkflowTabsProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    showWorkflowTabs: boolean;
    showVideoTab: boolean;
    showTipsTab?: boolean;
}

export default function WorkflowTabs({
    activeTab,
    setActiveTab,
    showWorkflowTabs,
    showVideoTab,
    showTipsTab = false
}: WorkflowTabsProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Prevent hydration mismatches by only rendering on client side
    if (!isMounted || !showWorkflowTabs) {
        return null;
    }

    return (
        <div className="flex flex-wrap p-1 bg-neutral-100 rounded-xl border border-neutral-200 gap-1 sm:gap-0">
            <button
                onClick={() => setActiveTab('workflow')}
                className={`px-4 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
                    activeTab === 'workflow'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                🔄 Estructura Workflow
            </button>
            {showVideoTab && (
                <button
                    onClick={() => setActiveTab('videos')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
                        activeTab === 'videos'
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                    🎬 Videos
                </button>
            )}
            {showTipsTab && (
                <button
                    onClick={() => setActiveTab('tips')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
                        activeTab === 'tips'
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                    💡 Consejos
                </button>
            )}
        </div>
    );
}
