
import React from 'react';
import { QUALITY_LEVELS } from '../constants';

interface QualitySelectorProps {
  selectedValue: number;
  onQualityChange: (value: number) => void;
  disabled: boolean;
}

const QualitySelector: React.FC<QualitySelectorProps> = ({ selectedValue, onQualityChange, disabled }) => {
  const selectedIndex = QUALITY_LEVELS.findIndex(q => q.value === selectedValue);
  const selectedLabel = QUALITY_LEVELS[selectedIndex]?.label || `${selectedValue}p`;

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(event.target.value, 10);
    const newQualityValue = QUALITY_LEVELS[newIndex].value;
    onQualityChange(newQualityValue);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="quality-slider" className="block text-sm font-medium text-gray-300">
          Video Quality (Chất lượng Video)
        </label>
        <span className="text-sm font-semibold text-indigo-400 bg-indigo-900/50 px-2 py-0.5 rounded-md">
          {selectedLabel}
        </span>
      </div>
      <input
        id="quality-slider"
        type="range"
        min="0"
        max={QUALITY_LEVELS.length - 1}
        step="1"
        value={selectedIndex > -1 ? selectedIndex : 0}
        onChange={handleSliderChange}
        disabled={disabled}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-indigo-500"
      />
    </div>
  );
};

export default QualitySelector;