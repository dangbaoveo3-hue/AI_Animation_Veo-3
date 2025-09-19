import React, { useState, useCallback, useRef, useEffect } from 'react';

interface SingleImageUploaderProps {
  onImagesChange: (files: File[]) => void;
  disabled: boolean;
}

const SingleImageUploader: React.FC<SingleImageUploaderProps> = ({ onImagesChange, disabled }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    // Clean up object URL on unmount or when file changes
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const processFile = useCallback((selectedFile: File | null) => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      onImagesChange([selectedFile]);
    } else {
      setFile(null);
      setPreview(null);
      onImagesChange([]);
    }
  }, [preview, onImagesChange]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0] || null);
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleRemoveImage = useCallback(() => {
    processFile(null);
  }, [processFile]);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };
  
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    if (disabled) return;
    processFile(event.dataTransfer.files?.[0] || null);
  }, [disabled, processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
        setIsDraggingOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Source Image
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
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`relative aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center text-center p-4 transition-all duration-300
        ${disabled ? 'bg-gray-800/50 border-gray-700 cursor-not-allowed' 
                  : isDraggingOver ? 'border-indigo-500 bg-gray-800/80 ring-2 ring-indigo-500' 
                                   : 'border-gray-600 hover:border-indigo-500 hover:bg-gray-800/60 cursor-pointer'}`}
        role="button"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => { if (e.key === 'Enter' && !disabled) handleClick(); }}
        aria-label="Upload single source image"
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="object-contain h-full w-full rounded-md" />
            <button
              onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
              disabled={disabled}
              className="absolute top-1 right-1 bg-gray-900/70 text-white rounded-full p-1 hover:bg-red-600/80 transition-all duration-200 disabled:opacity-50"
              aria-label="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-gray-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold">Click to upload an image</span>
            <span className="text-xs">or drag and drop</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleImageUploader;