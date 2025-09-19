import React, { useState, useEffect, useRef } from 'react';

type EditingContent = {
    type: 'image' | 'videoFrame',
    dataUrl: string,
    originalIndex?: number
};

interface EditModalProps {
    content: EditingContent;
    onClose: () => void;
    onGenerateEdits: (editPrompt: string, count: number, maskDataUrl: string | null) => void;
    onConfirmEdit: (selectedBase64: string) => void;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    editedImageResults: string[] | null;
}

const EditModal: React.FC<EditModalProps> = ({ 
    content, 
    onClose, 
    onGenerateEdits, 
    onConfirmEdit,
    isLoading, 
    error, 
    clearError,
    editedImageResults
}) => {
    const [editPrompt, setEditPrompt] = useState('');
    const [variationCount, setVariationCount] = useState(1);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Masking state
    const [brushSize, setBrushSize] = useState(40);
    const [maskMode, setMaskMode] = useState<'draw' | 'erase'>('draw');
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{x: number, y: number} | null>(null);

    useEffect(() => {
        clearError();
        setSelectedImage(null);
    }, [clearError, editedImageResults]);

    useEffect(() => {
        const imageCanvas = imageCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const imageCtx = imageCanvas?.getContext('2d');
        const maskCtx = maskCanvas?.getContext('2d');

        if (!imageCanvas || !maskCanvas || !imageCtx || !maskCtx || editedImageResults) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = content.dataUrl;
        img.onload = () => {
            const container = imageCanvas.parentElement;
            if (!container) return;

            const containerAspect = container.clientWidth / container.clientHeight;
            const imgAspect = img.naturalWidth / img.naturalHeight;
            
            let canvasWidth, canvasHeight;

            if (imgAspect > containerAspect) {
                canvasWidth = container.clientWidth;
                canvasHeight = canvasWidth / imgAspect;
            } else {
                canvasHeight = container.clientHeight;
                canvasWidth = canvasHeight * imgAspect;
            }
            
            [imageCanvas, maskCanvas].forEach(canvas => {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.style.width = `${canvasWidth}px`;
                canvas.style.height = `${canvasHeight}px`;
            });

            imageCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
            maskCtx.clearRect(0, 0, img.naturalWidth, img.naturalHeight);
        };
    }, [content.dataUrl, editedImageResults]);
    
    const getCoords = (e: React.MouseEvent): {x: number, y: number} | null => {
        const canvas = maskCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startDrawing = (e: React.MouseEvent) => {
        isDrawing.current = true;
        lastPos.current = getCoords(e);
    };

    const stopDrawing = () => {
        isDrawing.current = false;
        lastPos.current = null;
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing.current) return;
        const pos = getCoords(e);
        const ctx = maskCanvasRef.current?.getContext('2d');
        if (pos && lastPos.current && ctx) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (maskMode === 'erase') {
                ctx.globalCompositeOperation = 'destination-out';
            } else {
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.beginPath();
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastPos.current = pos;
        }
    };

    const clearMask = () => {
        const canvas = maskCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleGenerate = () => {
        if (!editPrompt.trim() || isLoading) return;
        
        const maskCanvas = maskCanvasRef.current;
        let maskDataUrl: string | null = null;
        if (maskCanvas) {
            const ctx = maskCanvas.getContext('2d');
            if (ctx) {
                const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data.buffer);
                if (pixelBuffer.some(color => (color & 0xff000000) !== 0)) {
                     maskDataUrl = maskCanvas.toDataURL('image/png');
                }
            }
        }
        onGenerateEdits(editPrompt, variationCount, maskDataUrl);
    };
    
    const handleConfirm = () => {
        if (!selectedImage) return;
        onConfirmEdit(selectedImage);
    }

    const renderInitialView = () => (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            <div className="md:w-2/3 flex flex-col items-center justify-center relative h-64 md:h-auto">
                <div className="relative w-full h-full flex items-center justify-center">
                    <canvas ref={imageCanvasRef} className="absolute top-0 left-0" />
                    <canvas 
                        ref={maskCanvasRef} 
                        className="absolute top-0 left-0 opacity-50 cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                </div>
            </div>
            <div className="md:w-1/3 space-y-4 flex flex-col">
                <div>
                    <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300 mb-2">
                        Mô tả chỉnh sửa của bạn
                    </label>
                    <textarea
                        id="edit-prompt"
                        rows={3}
                        className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none placeholder-gray-500"
                        placeholder="e.g., thêm mũ cao bồi, đổi nền thành hoàng hôn..."
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Công cụ chọn vùng (Masking)</label>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setMaskMode('draw')} className={`px-3 py-1 text-xs rounded-md ${maskMode === 'draw' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Vẽ</button>
                        <button onClick={() => setMaskMode('erase')} className={`px-3 py-1 text-xs rounded-md ${maskMode === 'erase' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Tẩy</button>
                        <button onClick={clearMask} className="px-3 py-1 text-xs rounded-md bg-red-800 hover:bg-red-700">Xóa</button>
                    </div>
                    <div>
                        <label htmlFor="brush-size" className="text-xs text-gray-400">Kích thước bút vẽ: {brushSize}px</label>
                        <input id="brush-size" type="range" min="5" max="150" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Số lượng kết quả (Tối đa 5)
                    </label>
                    <div className="grid grid-cols-5 gap-1 rounded-lg bg-gray-900/70 border border-gray-600 p-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button key={num} onClick={() => setVariationCount(num)} disabled={isLoading} className={`rounded-md py-2 text-sm font-medium transition-colors duration-200 ${variationCount === num ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                                {num}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderResultsView = () => (
        <div>
            <p className="text-sm text-gray-300 mb-2 text-center">Chọn kết quả tốt nhất</p>
            <div className={`grid grid-cols-2 ${editedImageResults!.length > 2 ? 'sm:grid-cols-3' : ''} gap-2`}>
                {editedImageResults!.map((base64, index) => (
                    <button 
                        key={index} 
                        onClick={() => setSelectedImage(base64)}
                        className={`relative rounded-lg overflow-hidden transition-all duration-200 ${selectedImage === base64 ? 'ring-4 ring-indigo-500' : 'ring-2 ring-transparent hover:ring-indigo-600'}`}
                    >
                         <img src={`data:image/jpeg;base64,${base64}`} alt={`Edit result ${index+1}`} className="w-full h-full object-cover" />
                         {selectedImage === base64 && (
                            <div className="absolute inset-0 bg-indigo-700/50 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                         )}
                    </button>
                ))}
            </div>
        </div>
    );
    
    return (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 id="edit-modal-title" className="text-lg font-semibold text-gray-200">Chỉnh sửa nâng cao</h2>
                    <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
                </header>

                <div className="p-6 flex-grow overflow-y-auto">
                   {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                             <svg className="animate-spin h-8 w-8 text-indigo-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             <p className="text-gray-300">Đang áp dụng chỉnh sửa...</p>
                        </div>
                   )}
                   {!isLoading && (editedImageResults ? renderResultsView() : renderInitialView())}
                   {error && (
                         <div className="text-sm text-center text-red-400 bg-red-900/30 p-2 rounded-md mt-2">
                             <p><strong>Lỗi:</strong> {error}</p>
                         </div>
                    )}
                </div>
                
                <footer className="p-4 border-t border-gray-700 flex justify-end items-center gap-4 flex-shrink-0 bg-gray-800">
                    <button onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50">
                        Hủy
                    </button>
                    {editedImageResults ? (
                         <button 
                            onClick={handleConfirm}
                            disabled={!selectedImage || isLoading}
                            className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-900/50 disabled:cursor-not-allowed flex items-center"
                        >
                            Xác nhận
                        </button>
                    ) : (
                         <button 
                            onClick={handleGenerate}
                            disabled={isLoading || !editPrompt.trim()}
                            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-900/50 disabled:cursor-not-allowed flex items-center"
                        >
                             {isLoading ? 'Đang tạo...' : 'Tạo chỉnh sửa'}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default EditModal;
