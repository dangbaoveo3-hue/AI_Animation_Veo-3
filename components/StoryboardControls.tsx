
import React from 'react';

interface StoryboardControlsProps {
    selectedCount: number;
    onCountChange: (num: number) => void;
    disabled: boolean;
}

const StoryboardControls: React.FC<StoryboardControlsProps> = ({ selectedCount, onCountChange, disabled }) => {
    const options = [2, 3, 4, 6, 8];
    
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Panels (Số khung hình)
            </label>
            <div className="grid grid-cols-5 gap-1 rounded-lg bg-gray-900/70 border border-gray-600 p-1">
                {options.map((num) => (
                    <button
                        key={num}
                        onClick={() => onCountChange(num)}
                        disabled={disabled}
                        className={`rounded-md py-2 text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-110 hover:brightness-110 ${selectedCount === num ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:transform-none`}
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StoryboardControls;