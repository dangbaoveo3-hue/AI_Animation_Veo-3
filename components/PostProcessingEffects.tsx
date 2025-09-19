
import React, { useState, useEffect, useRef } from 'react';
import { POST_PROCESSING_EFFECTS } from '../constants';

interface PostProcessingEffectsProps {
    onEffectsChange: (prompt: string) => void;
    disabled: boolean;
}

const PostProcessingEffects: React.FC<PostProcessingEffectsProps> = ({ onEffectsChange, disabled }) => {
    const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
    const [activePopover, setActivePopover] = useState<string | null>(null);
    const popoverTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const prompt = selectedEffects
            .map(id => POST_PROCESSING_EFFECTS.find(effect => effect.id === id)?.prompt)
            .filter(Boolean)
            .join(', ');
        onEffectsChange(prompt);
    }, [selectedEffects, onEffectsChange]);

    useEffect(() => {
        return () => {
            if (popoverTimeoutRef.current) {
                clearTimeout(popoverTimeoutRef.current);
            }
        };
    }, []);

    const toggleEffect = (id: string) => {
        if (disabled) return;

        // Popover logic
        if (popoverTimeoutRef.current) {
            clearTimeout(popoverTimeoutRef.current);
        }
        const effect = POST_PROCESSING_EFFECTS.find(e => e.id === id);
        // Only show popover when selecting a new effect, not deselecting
        if (effect && effect.description && !selectedEffects.includes(id)) {
            setActivePopover(id);
            popoverTimeoutRef.current = window.setTimeout(() => {
                setActivePopover(null);
            }, 3000);
        } else {
            setActivePopover(null);
        }

        // Selection logic
        setSelectedEffects(prev =>
            prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
        );
    };

    return (
        <details className="group border border-gray-700/50 rounded-lg p-3 transition-all duration-300 open:bg-gray-900/40 open:border-gray-600">
            <summary className="text-sm font-medium text-gray-300 cursor-pointer list-inside group-open:mb-4">
                Hiệu ứng hậu kỳ (Post-Processing Effects)
            </summary>
            <div className="flex flex-wrap gap-2">
                {POST_PROCESSING_EFFECTS.map((effect) => (
                    <div key={effect.id} className="relative">
                        <button
                            onClick={() => toggleEffect(effect.id)}
                            disabled={disabled}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 hover:brightness-110
                            ${selectedEffects.includes(effect.id)
                                ? 'bg-teal-600 text-white ring-2 ring-offset-2 ring-offset-gray-800 ring-teal-500'
                                : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                        >
                            {effect.name}
                        </button>
                         {activePopover === effect.id && effect.description && (
                             <div 
                                className="absolute bottom-full left-1/2 mb-2 w-max max-w-xs bg-gray-900 text-white text-xs rounded-lg py-1.5 px-3 z-10 shadow-lg animate-fade-in-up"
                                role="tooltip"
                            >
                                {effect.description}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </details>
    );
};

export default PostProcessingEffects;