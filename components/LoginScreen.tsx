import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onAdminLoginSuccess: () => void;
}

interface AccessCode {
  code: string;
  usedByDevices: string[];
}

const MAX_DEVICES = 3;

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onAdminLoginSuccess }) => {
  const [mode, setMode] = useState<'account' | 'code'>('code');
  const [accessCode, setAccessCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'account') {
      // Admin login check
      if (username === 'baosbth' && password === '090599') {
        onAdminLoginSuccess();
      } else {
        setError('Tên người dùng hoặc mật khẩu không đúng.');
      }
      return;
    }

    // Access Code Mode
    if (!accessCode.trim()) {
      setError('Vui lòng nhập mã truy cập.');
      return;
    }

    try {
      const deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        setError('Không thể xác định thiết bị. Vui lòng làm mới trang.');
        return;
      }

      const storedCodes = localStorage.getItem('accessCodes');
      if (!storedCodes) {
        setError('Hệ thống mã truy cập chưa được khởi tạo. Vui lòng làm mới trang.');
        return;
      }

      const codes: AccessCode[] = JSON.parse(storedCodes);
      const codeIndex = codes.findIndex(c => c.code === accessCode.trim());

      if (codeIndex === -1) {
        setError('Mã truy cập không hợp lệ.');
        return;
      }
      
      const targetCode = codes[codeIndex];
      const isDeviceAlreadyRegistered = targetCode.usedByDevices.includes(deviceId);

      if (isDeviceAlreadyRegistered) {
        // Device is already known for this code, allow login
        onLoginSuccess();
        return;
      }
      
      // This is a new device for this code, check limit
      if (targetCode.usedByDevices.length >= MAX_DEVICES) {
        setError('Mã này đã đạt đến giới hạn thiết bị.');
        return;
      }

      // Valid code, new device, and there's room. Register device.
      targetCode.usedByDevices.push(deviceId);
      codes[codeIndex] = targetCode;
      localStorage.setItem('accessCodes', JSON.stringify(codes));

      onLoginSuccess();

    } catch (err) {
      console.error("Login error:", err);
      setError('Đã xảy ra lỗi trong quá trình xác thực.');
    }
  };

  const renderAccountForm = () => (
    <>
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-300">
          Tên người dùng
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
          placeholder="baosbth"
        />
      </div>
      <div>
        <label htmlFor="password" aria-label="Mật khẩu" className="block text-sm font-medium text-gray-300">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
          placeholder="••••••••"
        />
      </div>
    </>
  );

  const renderAccessCodeForm = () => (
    <div>
      <label htmlFor="access-code" className="block text-sm font-medium text-gray-300">
        Mã truy cập
      </label>
      <input
        id="access-code"
        type="text"
        value={accessCode}
        onChange={(e) => setAccessCode(e.target.value)}
        required
        className="mt-1 w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
        placeholder="e.g., K8P4W1R9T6X3Y7Z2"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-700">
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 mb-4">
          Đăng Nhập
        </h1>

        <div className="flex mb-6 border-b border-gray-700">
          <button
            onClick={() => { setMode('code'); setError(null); }}
            className={`w-1/2 py-2 text-sm font-medium transition-colors ${mode === 'code' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
          >
            Mã truy cập
          </button>
          <button
            onClick={() => { setMode('account'); setError(null); }}
            className={`w-1/2 py-2 text-sm font-medium transition-colors ${mode === 'account' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
          >
            Tài khoản
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {mode === 'code' ? renderAccessCodeForm() : renderAccountForm()}

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center items-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-300"
            >
              Vào ứng dụng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;