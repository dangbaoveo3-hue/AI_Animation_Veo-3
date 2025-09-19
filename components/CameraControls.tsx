
import React, { useState, useEffect } from 'react';
import { CAMERA_SHOTS, CAMERA_ANGLES, CAMERA_MOTIONS, CAMERA_LENSES } from '../constants';

interface CameraControlsProps {
    onCameraChange: (prompt: string) => void;
    disabled: boolean;
}

const CameraControls: React.FC<CameraControlsProps> = ({ onCameraChange, disabled }) => {
    const [shot, setShot] = useState(CAMERA_SHOTS[0].prompt);
    const [angle, setAngle] = useState(CAMERA_ANGLES[0].prompt);
    const [motion, setMotion] = useState(CAMERA_MOTIONS[0].prompt);
    const [lens, setLens] = useState(CAMERA_LENSES[0].prompt);

    useEffect(() => {
        const promptParts = [shot, angle, motion, lens].filter(Boolean);
        const fullPrompt = promptParts.join(', ');
        onCameraChange(fullPrompt);
    }, [shot, angle, motion, lens, onCameraChange]);

    const selectStyle = "w-full bg-gray-900/70 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 disabled:opacity-50 text-sm";

    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Camera Controls (Điều Khiển Camera)</label>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="shot-type" className="text-xs text-gray-400">Shot Type (Loại Cảnh Quay)</label>
                    <select id="shot-type" value={shot} onChange={e => setShot(e.target.value)} disabled={disabled} className={selectStyle}>
                        {CAMERA_SHOTS.map(s => <option key={s.name} value={s.prompt}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="camera-angle" className="text-xs text-gray-400">Angle (Góc Quay)</label>
                    <select id="camera-angle" value={angle} onChange={e => setAngle(e.target.value)} disabled={disabled} className={selectStyle}>
                        {CAMERA_ANGLES.map(a => <option key={a.name} value={a.prompt}>{a.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="camera-motion" className="text-xs text-gray-400">Motion (Chuyển Động)</label>
                    <select id="camera-motion" value={motion} onChange={e => setMotion(e.target.value)} disabled={disabled} className={selectStyle}>
                        {CAMERA_MOTIONS.map(m => <option key={m.name} value={m.prompt}>{m.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="camera-lens" className="text-xs text-gray-400">Lens (Ống Kính)</label>
                    <select id="camera-lens" value={lens} onChange={e => setLens(e.target.value)} disabled={disabled} className={selectStyle}>
                        {CAMERA_LENSES.map(l => <option key={l.name} value={l.prompt}>{l.name}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default CameraControls;
