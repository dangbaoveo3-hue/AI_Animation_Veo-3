import React, { useState, useRef, useEffect } from 'react';

interface VideoDisplayProps {
  videoUrl: string | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  onEditRequest: (frameDataUrl: string) => void;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({ videoUrl, isLoading, loadingMessage, error, onEditRequest }) => {
  const [isSelectingFrame, setIsSelectingFrame] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Reset frame selection mode when video changes
  useEffect(() => {
    setIsSelectingFrame(false);
  }, [videoUrl]);

  const extractFrame = (videoEl: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context.'));
        return;
      }
      ctx.drawImage(videoEl, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    });
  };

  const handleEditClick = () => {
    if (videoRef.current) {
        videoRef.current.pause();
        setIsSelectingFrame(true);
    }
  };
  
  const handleConfirmFrame = async () => {
    if (videoRef.current) {
        try {
            const frameDataUrl = await extractFrame(videoRef.current);
            onEditRequest(frameDataUrl);
            setIsSelectingFrame(false);
        } catch (err) {
            console.error("Failed to extract frame:", err);
            // Optionally, display an error to the user
        }
    }
  };
  
  const handleCancelSelect = () => {
    setIsSelectingFrame(false);
    if (videoRef.current) {
        videoRef.current.play();
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <svg className="animate-spin h-10 w-10 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-semibold text-gray-300">Generating Your Animation</p>
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
    
    if (videoUrl) {
      return (
        <>
          <video 
            ref={videoRef}
            key={videoUrl}
            src={videoUrl} 
            controls 
            autoPlay 
            loop={!isSelectingFrame} // Disable loop when selecting frame
            muted // Autoplay is more reliable when muted
            className="w-full h-full object-contain rounded-lg bg-black"
            aria-label="Generated animation"
          />
           {!isSelectingFrame && (
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <a href={videoUrl} download={`ai-animation-${Date.now()}.mp4`} className="bg-gray-900/70 text-white rounded-full p-2 hover:bg-green-600 transition-all duration-200" aria-label="Download video">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </a>
                <button onClick={handleEditClick} className="bg-gray-900/70 text-white rounded-full p-2 hover:bg-sky-600 transition-all duration-200" aria-label="Edit a specific frame">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                </button>
            </div>
           )}
           {isSelectingFrame && (
             <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                <p className="text-lg font-semibold text-gray-200 mb-2">Chọn Khung Hình Để Chỉnh Sửa</p>
                <p className="text-sm text-gray-400 mb-4">Sử dụng thanh điều khiển của video để tìm khoảnh khắc bạn muốn, sau đó nhấn xác nhận.</p>
                <div className="flex gap-4">
                    <button onClick={handleCancelSelect} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        Hủy
                    </button>
                    <button onClick={handleConfirmFrame} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Xác Nhận Khung Hình
                    </button>
                </div>
             </div>
           )}
        </>
      );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-semibold">Your animation will appear here</p>
            <p className="text-sm">Fill out the prompt and click "Generate"</p>
        </div>
    );
  };

  return (
    <div className="w-full aspect-video bg-gray-900/70 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden relative group">
      {renderContent()}
    </div>
  );
};

export default VideoDisplay;
