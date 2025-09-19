
import React from 'react';

export interface SavedCharacter {
  id: string;
  name: string;
  imageDataUrl: string;
}

interface CharacterLibraryProps {
    library: SavedCharacter[];
    onAdd: (character: SavedCharacter) => void;
    onDelete: (id: string) => void;
    disabled: boolean;
}

const CharacterLibrary: React.FC<CharacterLibraryProps> = ({ library, onAdd, onDelete, disabled }) => {
    return (
        <details className="group border border-gray-700/50 rounded-lg p-3 transition-all duration-300 open:bg-gray-900/40 open:border-gray-600">
            <summary className="text-sm font-medium text-gray-300 cursor-pointer list-inside group-open:mb-4">
                Thư viện nhân vật ({library.length})
            </summary>
            {library.length === 0 ? (
                 <p className="text-xs text-center text-gray-500 py-4">Lưu nhân vật từ Trình Dựng Cảnh để tái sử dụng sau.</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-2">
                    {library.map(char => (
                        <div key={char.id} className="relative group/char border border-gray-700 rounded-md p-1 bg-gray-900/50">
                            <img src={char.imageDataUrl} alt={char.name} className="w-full aspect-square object-cover rounded-sm" />
                            <p className="text-xs text-center truncate mt-1 text-gray-300" title={char.name}>{char.name}</p>
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 opacity-0 group-hover/char:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onAdd(char)}
                                    disabled={disabled}
                                    className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:bg-gray-500"
                                    aria-label={`Thêm ${char.name} vào cảnh`}
                                >
                                    Thêm vào cảnh
                                </button>
                                <button
                                    onClick={() => onDelete(char.id)}
                                    disabled={disabled}
                                    className="text-xs bg-red-700 text-white px-2 py-1 rounded hover:bg-red-800 disabled:bg-gray-500"
                                    aria-label={`Xóa ${char.name}`}
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </details>
    );
};

export default CharacterLibrary;
