import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateSceneFromImages } from '../services/geminiService';

interface ImageUploaderProps {
  onImagesChange: (files: File[]) => void;
  disabled: boolean;
  onSceneGenerated: (scene: string) => void;
  showSceneGeneratorButton: boolean;
  label: string;
}

const MAX_SLOTS = 10;

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, disabled, onSceneGenerated, showSceneGeneratorButton, label }) => {
  const [files, setFiles] = useState<(File | null)[]>(Array(MAX_SLOTS).fill(null));
  const [previews, setPreviews] = useState<(string | null)[]>(Array(MAX_SLOTS).fill(null));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<number | null>(null);
  const [isGeneratingScene, setIsGeneratingScene] = useState<boolean>(false);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    // Clean up object URLs on unmount
    return () => {
      previews.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const processDroppedFiles = useCallback((droppedFiles: File[]) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    let filesAdded = 0;

    for (const file of droppedFiles) {
        if (!file.type.startsWith('image/')) continue;
        
        const emptySlotIndex = newFiles.findIndex(f => f === null);
        if (emptySlotIndex === -1) break; // No more slots

        newFiles[emptySlotIndex] = file;
        newPreviews[emptySlotIndex] = URL.createObjectURL(file);
        filesAdded++;
    }

    if (filesAdded > 0) {
        setFiles(newFiles);
        setPreviews(newPreviews);
        onImagesChange(newFiles.filter((f): f is File => f !== null));
    }
  }, [files, previews, onImagesChange]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    const slotIndex = activeSlotRef.current;

    if (selectedFile && slotIndex !== null && selectedFile.type.startsWith('image/')) {
      const newFiles = [...files];
      const newPreviews = [...previews];
      
      if (newPreviews[slotIndex]) {
          URL.revokeObjectURL(newPreviews[slotIndex] as string);
      }

      newFiles[slotIndex] = selectedFile;
      newPreviews[slotIndex] = URL.createObjectURL(selectedFile);

      setFiles(newFiles);
      setPreviews(newPreviews);
      onImagesChange(newFiles.filter((f): f is File => f !== null));
    }

    if(event.target) {
        event.target.value = '';
    }
  };

  const handleRemoveImage = useCallback((indexToRemove: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    const urlToRevoke = newPreviews[indexToRemove];
    
    if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
    }
    
    newFiles[indexToRemove] = null;
    newPreviews[indexToRemove] = null;

    setFiles(newFiles);
    setPreviews(newPreviews);
    onImagesChange(newFiles.filter((f): f is File => f !== null));
  }, [files, previews, onImagesChange]);
  
  const handleSlotClick = (index: number) => {
      if (disabled) return;
      activeSlotRef.current = index;
      fileInputRef.current?.click();
  }

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    if (disabled) return;
    processDroppedFiles(Array.from(event.dataTransfer.files));
  }, [disabled, processDroppedFiles]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDraggingOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const nonEmptyFiles = files.filter((f): f is File => f !== null);

  const handleGenerateScene = async () => {
      if (nonEmptyFiles.length < 2) {
          setSceneError("Please upload at least two images to generate a scene.");
          return;
      }
      setIsGeneratingScene(true);
      setSceneError(null);
      try {
          const scene = await generateSceneFromImages(nonEmptyFiles);
          onSceneGenerated(scene);
      } catch (e) {
          setSceneError(e instanceof Error ? e.message : "An unknown error occurred.");
      } finally {
          setIsGeneratingScene(false);
      }
  };


  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label} ({nonEmptyFiles.length}/{MAX_SLOTS})
        </label>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={disabled}
        />
        <div 
          className={`p-2 rounded-lg border-2 border-dashed transition-colors duration-300 ${isDraggingOver ? 'border-indigo-500 bg-gray-800/80 ring-2 ring-indigo-500' : 'border-transparent'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: MAX_SLOTS }).map((_, index) => {
              const preview = previews[index];
              return (
                <div
                  key={index}
                  onClick={() => handleSlotClick(index)}
                  className={`relative aspect-square w-full border-2 border-dashed rounded-lg flex items-center justify-center text-center p-1 transition-colors duration-300
                  ${disabled ? 'bg-gray-800/50 border-gray-700 cursor-not-allowed' : `border-gray-600 ${!preview ? 'hover:border-indigo-500 hover:bg-gray-800/60' : ''} cursor-pointer`}`}
                  role="button"
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : 0}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !disabled) handleSlotClick(index); }}
                  aria-label={`Upload image for slot ${index + 1}`}
                >
                  {preview ? (
                    <>
                      <img src={preview} alt={`Preview ${index + 1}`} className="object-cover h-full w-full rounded-md" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                        disabled={disabled}
                        className="absolute top-0.5 right-0.5 bg-gray-900/70 text-white rounded-full p-0.5 hover:bg-red-600/80 transition-all duration-200 disabled:opacity-50"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 pointer-events-none text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Ảnh {index + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {showSceneGeneratorButton && (
        <div>
          <button
              onClick={handleGenerateScene}
              disabled={disabled || isGeneratingScene || nonEmptyFiles.length < 2}
              className="w-full flex justify-center items-center bg-sky-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-sky-700 disabled:bg-sky-900/50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300 transform hover:scale-105 disabled:scale-100 focus:outline-none focus:ring-4 focus:ring-sky-500/50"
          >
              {isGeneratingScene ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating Scene...</span>
                  </>
                ) : (
                  'Generate Scene with AI'
                )}
          </button>
          {sceneError && <p className="text-xs text-center text-red-400 bg-red-900/30 p-2 rounded-md mt-2">{sceneError}</p>}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;