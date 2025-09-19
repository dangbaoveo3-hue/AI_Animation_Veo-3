
import React from 'react';

interface NumberOfImagesSelectorProps {
    selectedNumber: number;
    onNumberChange: (num: number) => void;
    disabled: boolean;
}

const NumberOfImagesSelector: React.FC<NumberOfImagesSelectorProps> = ({ selectedNumber, onNumberChange, disabled }) => {
    const options = [1, 2, 3, 4];
    
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Images
            </label>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-gray-900/70 border border-gray-600 p-1">
                {options.map((num) => (
                    <button
                        key={num}
                        onClick={() => onNumberChange(num)}
                        disabled={disabled}
                        className={`rounded-md py-2 text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-110 hover:brightness-110 ${selectedNumber === num ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:transform-none`}
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default NumberOfImagesSelector;