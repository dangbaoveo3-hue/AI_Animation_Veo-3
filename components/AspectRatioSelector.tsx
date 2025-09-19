
import React from 'react';

type Ratio = {
  id: string;
  name: string;
};

interface AspectRatioSelectorProps {
  selectedRatio: string;
  onRatioChange: (ratio: any) => void;
  disabled: boolean;
  ratios: Ratio[];
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, onRatioChange, disabled, ratios }) => {
  const getIcon = (id: string) => {
    switch(id) {
        case '16:9':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="7" width="18" height="10" rx="2" /></svg>;
        case '9:16':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="7" y="3" width="10" height="18" rx="2" /></svg>;
        case '1:1':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="5" y="5" width="14" height="14" rx="2" /></svg>;
        case '4:3':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="4" y="6" width="16" height="12" rx="2" /></svg>;
        case '3:4':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="6" y="4" width="12" height="16" rx="2" /></svg>;
        case '21:9':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="8" width="20" height="8.5" rx="2" /></svg>;
        default:
            return null;
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Aspect Ratio (Khung hình)
      </label>
      <div className={`grid grid-cols-${ratios.length > 3 ? '3' : '2'} sm:grid-cols-${ratios.length} gap-1 rounded-lg bg-gray-900/70 border border-gray-600 p-1`}>
        {ratios.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => onRatioChange(ratio.id)}
              disabled={disabled}
              className={`rounded-md py-2 text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-110 hover:brightness-110 flex items-center justify-center gap-2 ${selectedRatio === ratio.id ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:transform-none`}
            >
                {getIcon(ratio.id)}
                {ratio.name}
            </button>
        ))}
      </div>
    </div>
  );
};

export default AspectRatioSelector;