import React from 'react';

interface ImageDisplayProps {
  images: string[];
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  onEdit: (base64Content: string, index: number) => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ images, isLoading, loadingMessage, error, onEdit }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <svg className="animate-spin h-10 w-10 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-semibold text-gray-300">Generating Your Images</p>
            <p className="text-gray-400 mt-2 animate-pulse">{loadingMessage}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400 mb-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-semibold text-red-300">An Error Occurred</p>
            <p className="text-red-400 mt-1 max-w-full break-words px-2">{error}</p>
        </div>
      );
    }

    if (images.length > 0) {
      const gridCols = images.length > 1 ? 'grid-cols-2' : 'grid-cols-1';
      return (
        <div className="w-full h-full overflow-y-auto p-2">
            <div className={`grid ${gridCols} gap-2`}>
            {images.map((base64, index) => (
                <div key={index} className="relative group w-full aspect-square">
                <img
                    src={`data:image/jpeg;base64,${base64}`}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg bg-black"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={() => onEdit(base64, index)}
                        className="bg-gray-900/70 text-white rounded-full p-2 hover:bg-sky-600 transition-all duration-200"
                        aria-label="Edit image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <a
                    href={`data:image/jpeg;base64,${base64}`}
                    download={`ai-image-${Date.now()}-${index}.jpeg`}
                    className="bg-gray-900/70 text-white rounded-full p-2 hover:bg-green-600 transition-all duration-200"
                    aria-label="Download image"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    </a>
                </div>
                </div>
            ))}
            </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-semibold">Your generated images will appear here</p>
          <p className="text-sm">Fill out the prompt and click "Generate"</p>
      </div>
    );
  };

  return (
    <div className="w-full aspect-video bg-gray-900/70 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden">
      {renderContent()}
    </div>
  );
};

export default ImageDisplay;