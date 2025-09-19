import React from 'react';

export interface HistoryItem {
    id: number;
    type: 'video' | 'image';
    url: string; // For video, a blob URL. For image, a data URL for the thumbnail.
    prompt: string;
    timestamp: string;
    imageSet?: string[]; // For image type, stores all generated base64 strings
}

interface HistoryPanelProps {
    history: HistoryItem[];
    onLoad: (item: HistoryItem) => void;
    onDelete: (id: number) => void;
    onEdit: (item: HistoryItem) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoad, onDelete, onEdit }) => {
    
    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return "vừa xong";
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-700 h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-200 mb-4">Lịch sử</h2>
            {history.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                    <p>Các video và hình ảnh bạn tạo sẽ xuất hiện ở đây.</p>
                </div>
            ) : (
                <div className="space-y-4 overflow-y-auto flex-grow -mr-2 pr-2">
                    {history.map(item => (
                        <div key={item.id} className="bg-gray-900/70 p-3 rounded-lg border border-gray-700/50 group">
                            <div className="flex gap-4">
                                <div className="w-24 h-16 flex-shrink-0 bg-black rounded-md overflow-hidden">
                                    {item.type === 'video' ? (
                                        <video
                                            src={item.url}
                                            muted
                                            className="w-full h-full object-cover"
                                            preload="metadata"
                                        />
                                    ) : (
                                        <img 
                                            src={item.url} // data URL for image thumbnail
                                            alt="Image thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-xs text-gray-400 truncate group-hover:whitespace-normal" title={item.prompt}>
                                        {item.prompt}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{timeAgo(item.timestamp)}</p>
                                </div>
                            </div>
                             <div className="mt-3 flex items-center justify-end gap-2">
                                <button onClick={() => onLoad(item)} className="px-2 py-1 text-xs font-medium text-gray-200 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">Tải lại</button>
                                {item.type === 'video' && <button onClick={() => onEdit(item)} className="px-2 py-1 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors">Chỉnh sửa</button>}
                                <button onClick={() => onDelete(item.id)} className="px-2 py-1 text-xs font-medium text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors">Xóa</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPanel;
