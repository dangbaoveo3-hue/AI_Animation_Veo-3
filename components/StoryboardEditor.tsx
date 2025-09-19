
import React, { useRef, useEffect } from 'react';

export interface StoryboardPanel {
  id: number;
  imageFile: File | null;
  prompt: string;
  previewUrl?: string;
}

interface StoryboardEditorProps {
  panels: StoryboardPanel[];
  onPanelsChange: (panels: StoryboardPanel[]) => void;
  disabled: boolean;
}

const StoryboardEditor: React.FC<StoryboardEditorProps> = ({ panels, onPanelsChange, disabled }) => {

  useEffect(() => {
    // Cleanup object URLs on unmount
    return () => {
      panels.forEach(panel => {
        if (panel.previewUrl) {
          URL.revokeObjectURL(panel.previewUrl);
        }
      });
    };
  }, [panels]);

  const handleAddPanel = () => {
    if (disabled || panels.length >= 10) return; // Max 10 panels
    const newPanel: StoryboardPanel = {
      id: Date.now(),
      imageFile: null,
      prompt: '',
    };
    onPanelsChange([...panels, newPanel]);
  };
  
  const handleRemovePanel = (id: number) => {
    if (disabled) return;
    const panelToRemove = panels.find(p => p.id === id);
    if (panelToRemove?.previewUrl) {
      URL.revokeObjectURL(panelToRemove.previewUrl);
    }
    const newPanels = panels.filter(p => p.id !== id);
    onPanelsChange(newPanels);
  };
  
  const handlePanelChange = (id: number, updates: Partial<StoryboardPanel>) => {
    const newPanels = panels.map(p => (p.id === id ? { ...p, ...updates } : p));
    onPanelsChange(newPanels);
  };
  
  const handleImageChange = (id: number, file: File | null) => {
    const panelToUpdate = panels.find(p => p.id === id);
    if (panelToUpdate?.previewUrl) {
        URL.revokeObjectURL(panelToUpdate.previewUrl);
    }

    if (file) {
        handlePanelChange(id, { imageFile: file, previewUrl: URL.createObjectURL(file) });
    } else {
        handlePanelChange(id, { imageFile: null, previewUrl: undefined });
    }
  };

  return (
    <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Storyboard Editor (Trình chỉnh sửa)
        </label>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 -mr-2">
            {panels.map((panel, index) => (
                <Panel
                    key={panel.id}
                    panel={panel}
                    index={index}
                    onImageChange={(file) => handleImageChange(panel.id, file)}
                    onPromptChange={(prompt) => handlePanelChange(panel.id, { prompt })}
                    onRemove={() => handleRemovePanel(panel.id)}
                    disabled={disabled}
                />
            ))}
        </div>
        <button
            onClick={handleAddPanel}
            disabled={disabled || panels.length >= 10}
            className="w-full text-sm border border-dashed border-gray-600 rounded p-2 hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            + Add Scene (Thêm cảnh)
        </button>
    </div>
  );
};

// Sub-component for a single panel
interface PanelProps {
  panel: StoryboardPanel;
  index: number;
  onImageChange: (file: File | null) => void;
  onPromptChange: (prompt: string) => void;
  onRemove: () => void;
  disabled: boolean;
}

const Panel: React.FC<PanelProps> = ({ panel, index, onImageChange, onPromptChange, onRemove, disabled }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageChange(file);
        }
        if(e.target) e.target.value = ''; // Reset input
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if(disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageChange(file);
        }
    };
    
    return (
        <div className="flex gap-3 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
            <input type="file" ref={inputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={disabled} />
            <div className="flex-shrink-0 w-24 flex flex-col items-center">
                <div
                    onClick={() => !disabled && inputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => {e.preventDefault(); e.stopPropagation()}}
                    className={`relative w-24 h-16 border-2 border-dashed rounded-md flex items-center justify-center text-center transition-colors
                    ${disabled ? 'bg-gray-800/50 border-gray-700 cursor-not-allowed' : 'border-gray-600 hover:border-indigo-500 cursor-pointer'}`}
                >
                    {panel.previewUrl ? (
                        <>
                            <img src={panel.previewUrl} alt={`Scene ${index + 1}`} className="object-cover h-full w-full rounded" />
                            <button
                                onClick={(e) => { e.stopPropagation(); onImageChange(null); }}
                                disabled={disabled}
                                className="absolute top-0.5 right-0.5 bg-gray-900/70 text-white rounded-full p-0.5 hover:bg-red-600/80 disabled:opacity-50"
                                aria-label="Remove image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </>
                    ) : (
                        <span className="text-xs text-gray-500 p-1">Tải ảnh lên</span>
                    )}
                </div>
                <span className="text-xs font-semibold text-gray-400 mt-1">Cảnh {index + 1}</span>
            </div>

            <div className="flex-grow flex flex-col">
                <textarea
                    rows={3}
                    className="w-full flex-grow bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none placeholder-gray-500"
                    placeholder={`Mô tả cho cảnh ${index + 1}...`}
                    value={panel.prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    disabled={disabled}
                />
            </div>
             <button
                onClick={onRemove}
                disabled={disabled}
                className="self-start text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                aria-label={`Remove scene ${index + 1}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};

export default StoryboardEditor;
