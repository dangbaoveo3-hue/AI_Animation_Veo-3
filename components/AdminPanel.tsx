
import React, { useState, useEffect } from 'react';
import { generateAccessCode } from '../utils';

interface AdminPanelProps {
  onLogout: () => void;
}

interface AccessCode {
  code: string;
  usedByDevices: string[];
}

const MAX_DEVICES = 3;

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [generateCount, setGenerateCount] = useState<number>(5);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedCodes = localStorage.getItem('accessCodes');
      if (storedCodes) {
        setCodes(JSON.parse(storedCodes));
      }
    } catch (error) {
      console.error("Failed to load access codes:", error);
      showNotification("Lỗi: Không thể tải mã truy cập.", true);
    }
  }, []);

  const showNotification = (message: string, isError = false) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };
  
  const updateCodes = (newCodes: AccessCode[]) => {
    setCodes(newCodes);
    localStorage.setItem('accessCodes', JSON.stringify(newCodes));
  };

  const handleGenerateCodes = () => {
    if (generateCount <= 0 || generateCount > 100) {
      showNotification("Vui lòng nhập số lượng từ 1 đến 100.", true);
      return;
    }
    const newCodes: AccessCode[] = Array.from({ length: generateCount }, () => ({
      code: generateAccessCode(16),
      usedByDevices: [],
    }));
    updateCodes([...codes, ...newCodes]);
    showNotification(`Đã tạo thành công ${generateCount} mã mới.`);
  };

  const handleDeleteCode = (codeToDelete: string) => {
    const newCodes = codes.filter(c => c.code !== codeToDelete);
    updateCodes(newCodes);
    showNotification(`Đã xóa mã: ${codeToDelete}`);
  };

  const handleDeleteExpired = () => {
    const activeCodes = codes.filter(c => c.usedByDevices.length < MAX_DEVICES);
    const deletedCount = codes.length - activeCodes.length;
    updateCodes(activeCodes);
    showNotification(`Đã xóa ${deletedCount} mã đã hết hạn.`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-8 relative">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-600">
            Bảng Điều Khiển Quản Trị
          </h1>
          <p className="text-gray-400 mt-2">Quản lý mã truy cập cho ứng dụng</p>
          <button
            onClick={onLogout}
            className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Đăng xuất
          </button>
        </header>

        <main className="space-y-8">
          {/* Generate Codes Section */}
          <section className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Tạo mã mới</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="number"
                value={generateCount}
                onChange={(e) => setGenerateCount(parseInt(e.target.value, 10))}
                min="1"
                max="100"
                className="w-full sm:w-32 bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500"
                placeholder="Số lượng"
              />
              <button
                onClick={handleGenerateCodes}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Tạo mã
              </button>
            </div>
          </section>

          {/* Code List Section */}
          <section className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Danh sách mã ({codes.length})</h2>
              <button
                onClick={handleDeleteExpired}
                className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
              >
                Xóa các mã đã hết hạn
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto pr-2 -mr-2">
              {codes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Không có mã nào. Hãy tạo một vài mã!</p>
              ) : (
                <ul className="space-y-3">
                  {codes.map((c) => (
                    <li key={c.code} className="flex items-center justify-between bg-gray-900/70 p-3 rounded-lg border border-gray-700/50">
                      <div className="flex items-center gap-4">
                        <span className={`font-mono text-sm ${c.usedByDevices.length >= MAX_DEVICES ? 'text-gray-500 line-through' : 'text-cyan-300'}`}>
                          {c.code}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.usedByDevices.length >= MAX_DEVICES ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                          {c.usedByDevices.length} / {MAX_DEVICES}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteCode(c.code)}
                        className="text-gray-500 hover:text-red-500 transition-colors text-2xl leading-none"
                        aria-label={`Delete code ${c.code}`}
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      </div>

       {notification && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm rounded-lg py-2 px-4 z-50 shadow-lg border border-cyan-500">
          {notification}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
