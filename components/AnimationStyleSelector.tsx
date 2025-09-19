
import React, { useState, useRef, useEffect } from 'react';
import { ANIMATION_STYLES } from '../constants';

interface AnimationStyleSelectorProps {
    selectedStyles: string[];
    onStyleChange: (styles: string[]) => void;
    disabled: boolean;
}

const AnimationStyleSelector: React.FC<AnimationStyleSelectorProps> = ({ selectedStyles, onStyleChange, disabled }) => {
    const [activePopover, setActivePopover] = useState<string | null>(null);
    const popoverTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (popoverTimeoutRef.current) {
                clearTimeout(popoverTimeoutRef.current);
            }
        };
    }, []);

    const handleStyleClick = (styleName: string) => {
        if (disabled) return;
        
        // Popover logic
        if (popoverTimeoutRef.current) {
            clearTimeout(popoverTimeoutRef.current);
        }
        const style = ANIMATION_STYLES.find(s => s.name === styleName);
        // Only show popover when selecting a new style, not deselecting
        if (style && style.description && !selectedStyles.includes(styleName)) {
             setActivePopover(styleName);
             popoverTimeoutRef.current = window.setTimeout(() => {
                setActivePopover(null);
             }, 3000); // Show for 3 seconds
        } else {
            setActivePopover(null);
        }
        
        // Selection logic
        if (styleName === 'None') {
            onStyleChange(['None']);
            return;
        }

        const currentStyles = selectedStyles.filter(s => s !== 'None');
        const isSelected = currentStyles.includes(styleName);
        let newStyles;

        if (isSelected) {
            newStyles = currentStyles.filter(s => s !== styleName);
        } else {
            newStyles = [...currentStyles, styleName];
        }

        if (newStyles.length === 0) {
            onStyleChange(['None']);
        } else {
            onStyleChange(newStyles);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                Animation Style (Có thể chọn nhiều)
            </label>
            <div className="flex flex-wrap gap-2">
                {ANIMATION_STYLES.map((style) => (
                    <div key={style.name} className="relative">
                        <button
                            key={style.name}
                            onClick={() => handleStyleClick(style.name)}
                            disabled={disabled}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 hover:brightness-110
                            ${selectedStyles.includes(style.name)
                                ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500'
                                : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                        >
                            {style.name}
                        </button>
                        {activePopover === style.name && style.description && (
                            <div 
                                className="absolute bottom-full left-1/2 mb-2 w-max max-w-xs bg-gray-900 text-white text-xs rounded-lg py-1.5 px-3 z-10 shadow-lg animate-fade-in-up"
                                role="tooltip"
                            >
                                {style.description}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnimationStyleSelector;