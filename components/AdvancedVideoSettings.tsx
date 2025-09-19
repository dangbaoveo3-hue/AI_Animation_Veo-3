
import React from 'react';
import { MOTION_BLUR_LEVELS } from '../constants';

interface AdvancedVideoSettingsProps {
    duration: number;
    onDurationChange: (duration: number) => void;
    frameRate: number;
    onFrameRateChange: (fps: number) => void;
    motionBlur: string;
    onMotionBlurChange: (blur: string) => void;
    disabled: boolean;
}

const AdvancedVideoSettings: React.FC<AdvancedVideoSettingsProps> = ({
    duration,
    onDurationChange,
    frameRate,
    onFrameRateChange,
    motionBlur,
    onMotionBlurChange,
    disabled
}) => {
    return (
        <details className="group border border-gray-700/50 rounded-lg p-3 transition-all duration-300 open:bg-gray-900/40 open:border-gray-600">
            <summary className="text-sm font-medium text-gray-300 cursor-pointer list-inside group-open:mb-4">
                Advanced Settings (Cài đặt nâng cao)
            </summary>
            <div className="space-y-4">
                {/* Duration */}
                <div>
                    <label htmlFor="duration-input" className="block text-xs font-medium text-gray-400 mb-1">
                        Duration / Thời lượng (giây)
                    </label>
                    <input
                        id="duration-input"
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        value={duration}
                        onChange={(e) => onDurationChange(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                        disabled={disabled}
                        className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 disabled:opacity-50 text-sm"
                    />
                </div>

                {/* Frame Rate */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="fps-slider" className="block text-xs font-medium text-gray-400">
                            Frame Rate / Tốc độ khung hình (FPS)
                        </label>
                        <span className="text-xs font-semibold text-indigo-400 bg-indigo-900/50 px-2 py-0.5 rounded-md">
                          {frameRate} fps
                        </span>
                    </div>
                    <input
                        id="fps-slider"
                        type="range"
                        min="10"
                        max="60"
                        step="1"
                        value={frameRate}
                        onChange={(e) => onFrameRateChange(parseInt(e.target.value, 10))}
                        disabled={disabled}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-indigo-500"
                    />
                </div>
                
                {/* Motion Blur */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        Motion Blur / Cường độ mờ chuyển động
                    </label>
                     <div className="grid grid-cols-4 gap-1 rounded-lg bg-gray-900/70 border border-gray-600 p-1">
                        {MOTION_BLUR_LEVELS.map((level) => (
                            <button
                                key={level.id}
                                onClick={() => onMotionBlurChange(level.id)}
                                disabled={disabled}
                                className={`rounded-md py-1 text-xs font-medium transition-all duration-200 ease-in-out transform hover:scale-110 hover:brightness-110 ${motionBlur === level.id ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:transform-none`}
                            >
                                {level.name}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </details>
    );
};

export default AdvancedVideoSettings;