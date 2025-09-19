
import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { getMultiCharacterPlacement, Placement } from '../services/geminiService';
import type { SavedCharacter } from './CharacterLibrary';
import { dataUrlToFile } from '../utils';


export interface CharacterDefinition {
    file: File;
    name: string;
}
interface SceneComposerProps {
  onCompositionChange: (data: { composedImage: File | null, characters: CharacterDefinition[] }) => void;
  disabled: boolean;
  onSaveCharacter: (characterDef: CharacterDefinition) => void;
}

export interface SceneComposerActions {
    addCharacter: (char: SavedCharacter) => void;
}

interface Character extends CharacterDefinition {
  id: number;
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  isSavedToLibrary?: boolean;
}

type HandleType = 'tl' | 'tr' | 'bl' | 'br';

type InteractionMode = {
  type: 'move' | 'resize' | 'rotate' | 'pan_bg';
  startX: number;
  startY: number;
  // For characters
  characterId?: number;
  initialCharacter?: Character;
  initialAngleToCenter?: number;
  handle?: HandleType;
  aspectRatio?: number;
  oppositeCorner?: { x: number; y: number; };
  // For background
  initialBackgroundTransform?: { x: number, y: number, scale: number };
};


const MAX_CHARACTERS = 10;
const HANDLE_SIZE = 10;
const ROTATION_HANDLE_OFFSET = 25;

// Helper functions for geometry
const rotatePoint = (point: {x: number, y: number}, center: {x: number, y: number}, angleDeg: number) => {
    const angleRad = angleDeg * Math.PI / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos
    };
};


const SceneComposer = forwardRef<SceneComposerActions, SceneComposerProps>(({ onCompositionChange, disabled, onSaveCharacter }, ref) => {
  const [background, setBackground] = useState<{ file: File; img: HTMLImageElement } | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [backgroundTransform, setBackgroundTransform] = useState({ x: 0, y: 0, scale: 1 });
  
  const [isPlacing, setIsPlacing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<InteractionMode | null>(null);
  const [isBgDraggingOver, setIsBgDraggingOver] = useState(false);
  const [isCharDraggingOver, setIsCharDraggingOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const charInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const addCharacterFromFile = (file: File, isFromLibrary: boolean = false) => {
     if (characters.length >= MAX_CHARACTERS) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = canvasRef.current;
      const charHeight = canvas ? canvas.offsetHeight / 4 : 100;
      const charWidth = charHeight * (img.naturalWidth / img.naturalHeight);
      const newChar: Character = {
        id: Date.now(),
        file,
        name: file.name.split('.')[0] || `Nhân vật ${characters.length + 1}`,
        img,
        x: canvas ? (canvas.offsetWidth - charWidth) / 2 : 50,
        y: canvas ? (canvas.offsetHeight - charHeight) / 2 : 50,
        width: charWidth,
        height: charHeight,
        rotation: 0,
        isSavedToLibrary: isFromLibrary,
      };
      setCharacters(prev => [...prev, newChar]);
      setSelectedCharacterId(newChar.id);
    };
     img.onerror = () => {
      setError(`Failed to load character image: ${file.name}`);
    };
  }

  useImperativeHandle(ref, () => ({
    addCharacter: (savedChar: SavedCharacter) => {
      if (characters.length >= MAX_CHARACTERS) {
        setError(`Không thể thêm nhiều hơn ${MAX_CHARACTERS} nhân vật.`);
        return;
      }
      const file = dataUrlToFile(savedChar.imageDataUrl, savedChar.name);
      addCharacterFromFile(file, true);
    }
  }));

  const getCharacterHandles = useCallback((char: Character) => {
    const center = { x: char.x + char.width / 2, y: char.y + char.height / 2 };
    const halfW = char.width / 2;
    const halfH = char.height / 2;
    
    const unrotatedCorners = {
        tl: { x: center.x - halfW, y: center.y - halfH },
        tr: { x: center.x + halfW, y: center.y - halfH },
        bl: { x: center.x - halfW, y: center.y + halfH },
        br: { x: center.x + halfW, y: center.y + halfH },
    };
    
    const unrotatedRotationHandle = { x: center.x, y: center.y - halfH - ROTATION_HANDLE_OFFSET };

    return {
        tl: rotatePoint(unrotatedCorners.tl, center, char.rotation),
        tr: rotatePoint(unrotatedCorners.tr, center, char.rotation),
        bl: rotatePoint(unrotatedCorners.bl, center, char.rotation),
        br: rotatePoint(unrotatedCorners.br, center, char.rotation),
        rotate: rotatePoint(unrotatedRotationHandle, center, char.rotation),
    };
  }, []);
  
  // Redraws the canvas with background, characters, and selection handles
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (background) {
      ctx.save();
      ctx.translate(backgroundTransform.x, backgroundTransform.y);
      ctx.scale(backgroundTransform.scale, backgroundTransform.scale);
      ctx.drawImage(background.img, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.fillStyle = '#111827'; // bg-gray-900
      ctx.fillRect(0,0, canvas.width, canvas.height);
    }

    characters.forEach(char => {
      ctx.save();
      const centerX = char.x + char.width / 2;
      const centerY = char.y + char.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(char.rotation * Math.PI / 180);
      ctx.drawImage(char.img, -char.width / 2, -char.height / 2, char.width, char.height);
      ctx.restore();
    });

    const selected = characters.find(c => c.id === selectedCharacterId);
    if (selected) {
        const center = { x: selected.x + selected.width / 2, y: selected.y + selected.height / 2 };
        const handles = getCharacterHandles(selected);

        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.rotate(selected.rotation * Math.PI / 180);
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2;
        ctx.strokeRect(-selected.width / 2, -selected.height / 2, selected.width, selected.height);
        ctx.restore();
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 1;

        Object.values(handles).forEach(pos => {
            if (pos === handles.rotate) { // rotation handle
                ctx.beginPath();
                const lineToPos = rotatePoint({x: center.x, y: center.y - selected.height/2}, center, selected.rotation);
                ctx.moveTo(lineToPos.x, lineToPos.y);
                ctx.lineTo(handles.rotate.x, handles.rotate.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(handles.rotate.x, handles.rotate.y, HANDLE_SIZE / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            } else { // resize handles
                ctx.fillRect(pos.x - HANDLE_SIZE/2, pos.y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
                ctx.strokeRect(pos.x - HANDLE_SIZE/2, pos.y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
            }
        });
    }
  }, [background, characters, selectedCharacterId, getCharacterHandles, backgroundTransform]);
  
  useEffect(redrawCanvas, [redrawCanvas]);
  
  const updateParentWithComposition = useCallback(() => {
     const canvas = hiddenCanvasRef.current;
     const ctx = canvas?.getContext('2d');
     const characterData = characters.map(({ file, name }) => ({ file, name }));

     if (!ctx || !canvas || !background) {
         onCompositionChange({ composedImage: null, characters: characterData });
         return;
     };

     const displayCanvas = canvasRef.current;
     if (!displayCanvas) return;
     
     canvas.width = background.img.naturalWidth;
     canvas.height = background.img.naturalHeight;
     
     const scaleX = canvas.width / displayCanvas.offsetWidth;
     const scaleY = canvas.height / displayCanvas.offsetHeight;
     
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     ctx.save();
     ctx.translate(backgroundTransform.x * scaleX, backgroundTransform.y * scaleY);
     ctx.scale(backgroundTransform.scale, backgroundTransform.scale);
     ctx.drawImage(background.img, 0, 0, canvas.width, canvas.height);
     ctx.restore();

     characters.forEach(char => {
        ctx.save();
        const finalX = char.x * scaleX;
        const finalY = char.y * scaleY;
        const finalW = char.width * scaleX;
        const finalH = char.height * scaleY;
        const centerX = finalX + finalW / 2;
        const centerY = finalY + finalH / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(char.rotation * Math.PI / 180);
        ctx.drawImage(char.img, -finalW / 2, -finalH / 2, finalW, finalH);
        ctx.restore();
     });

     canvas.toBlob(blob => {
         if (blob) {
             const file = new File([blob], 'composed-scene.webp', { type: 'image/webp' });
             onCompositionChange({ composedImage: file, characters: characterData });
         } else {
             onCompositionChange({ composedImage: null, characters: characterData });
         }
     }, 'image/webp', 0.95);
  }, [background, characters, onCompositionChange, backgroundTransform]);


  const handleBackgroundSelect = (file: File) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        canvas.style.aspectRatio = `${aspectRatio}`;
        // Important: set canvas drawing dimensions
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
      setBackground({ file, img });
      setBackgroundTransform({ x: 0, y: 0, scale: 1 });
      // Update composition whenever background changes
      setTimeout(updateParentWithComposition, 100);
    };
    img.onerror = () => {
      setError("Failed to load background image.");
    };
  };

  const handleCharFileAdd = (file: File) => {
    addCharacterFromFile(file, false);
  };
  
  const handleCharacterNameChange = (id: number, newName: string) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
    // No need to redraw, but we should update parent in case the name is the only thing changed
    setTimeout(updateParentWithComposition, 100);
  };

  const handleSaveCharacter = (charToSave: Character) => {
    onSaveCharacter({ file: charToSave.file, name: charToSave.name });
    setCharacters(prev => prev.map(c => c.id === charToSave.id ? {...c, isSavedToLibrary: true} : c));
  }


  const handleCharRemove = (idToRemove: number) => {
    setCharacters(prev => {
        const newChars = prev.filter(c => c.id !== idToRemove);
        if (selectedCharacterId === idToRemove) setSelectedCharacterId(null);
        return newChars;
    });
  };
  
  const getCanvasCoords = (e: React.MouseEvent | MouseEvent | WheelEvent): {x: number, y: number} => {
      const canvas = canvasRef.current;
      if (!canvas) return {x: 0, y: 0};
      const rect = canvas.getBoundingClientRect();
      return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
      };
  };
  
  const getInteractionForPoint = (x: number, y: number): InteractionMode | null => {
      for(let i = characters.length - 1; i >= 0; i--) {
          const char = characters[i];
          const center = { x: char.x + char.width / 2, y: char.y + char.height / 2 };
          const handles = getCharacterHandles(char);

          // Check handles first
          for (const key of ['tl', 'tr', 'bl', 'br', 'rotate']) {
              const pos = handles[key as keyof typeof handles];
              if (Math.hypot(pos.x - x, pos.y - y) < HANDLE_SIZE) {
                  if (key === 'rotate') {
                      return {
                          type: 'rotate', characterId: char.id, startX: x, startY: y, initialCharacter: char,
                          initialAngleToCenter: Math.atan2(y - center.y, x - center.x) * 180 / Math.PI
                      };
                  }
                  const handleType = key as HandleType;
                  const oppositeHandleKey = {tl:'br', tr:'bl', bl:'tr', br:'tl'}[handleType];
                  return {
                      type: 'resize', characterId: char.id, startX: x, startY: y, initialCharacter: char,
                      handle: handleType,
                      aspectRatio: char.width / char.height,
                      oppositeCorner: handles[oppositeHandleKey]
                  };
              }
          }
          
          // Check body (rotation aware)
          const rotatedPoint = rotatePoint({x,y}, center, -char.rotation);
          if (rotatedPoint.x >= char.x && rotatedPoint.x <= char.x + char.width &&
              rotatedPoint.y >= char.y && rotatedPoint.y <= char.y + char.height) {
              return { type: 'move', characterId: char.id, startX: x, startY: y, initialCharacter: char };
          }
      }
      return null;
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
      if (disabled || isPlacing) return;
      const { x, y } = getCanvasCoords(e);
      const newInteraction = getInteractionForPoint(x, y);

      if (newInteraction) {
          setInteraction(newInteraction);
          if (newInteraction.characterId) {
            setSelectedCharacterId(newInteraction.characterId);
          }
      } else if (background) {
          setInteraction({
              type: 'pan_bg',
              startX: x,
              startY: y,
              initialBackgroundTransform: backgroundTransform
          });
          setSelectedCharacterId(null);
      } else {
          setSelectedCharacterId(null);
      }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (!interaction) { // Handle cursor change
          const { x, y } = getCanvasCoords(e);
          const hoverInteraction = getInteractionForPoint(x, y);
          if (hoverInteraction) {
              if (hoverInteraction.type === 'move') canvas.style.cursor = 'move';
              else if (hoverInteraction.type === 'rotate') canvas.style.cursor = 'crosshair'; // Or a custom rotation cursor
              else canvas.style.cursor = 'nesw-resize'; // Just an example, could be more specific
          } else if (background) {
              canvas.style.cursor = 'grab';
          } else {
              canvas.style.cursor = 'default';
          }
          return;
      }

      const { x, y } = getCanvasCoords(e);
      const dx = x - interaction.startX;
      const dy = y - interaction.startY;
      
      if (interaction.type === 'pan_bg' && interaction.initialBackgroundTransform) {
          canvas.style.cursor = 'grabbing';
          setBackgroundTransform({
              ...interaction.initialBackgroundTransform,
              x: interaction.initialBackgroundTransform.x + dx,
              y: interaction.initialBackgroundTransform.y + dy,
          });
          return;
      }

      setCharacters(prev => prev.map(char => {
          if (!interaction.characterId || char.id !== interaction.characterId) return char;

          const { initialCharacter } = interaction;
          if (!initialCharacter) return char;
          let newChar = {...char};

          switch (interaction.type) {
              case 'move':
                  newChar.x = initialCharacter.x + dx;
                  newChar.y = initialCharacter.y + dy;
                  break;
              case 'rotate': {
                  const center = { x: initialCharacter.x + initialCharacter.width/2, y: initialCharacter.y + initialCharacter.height/2 };
                  const currentAngle = Math.atan2(y - center.y, x - center.x) * 180 / Math.PI;
                  newChar.rotation = initialCharacter.rotation + (currentAngle - (interaction.initialAngleToCenter || 0));
                  break;
              }
              case 'resize': {
                  const center = { x: initialCharacter.x + initialCharacter.width/2, y: initialCharacter.y + initialCharacter.height/2 };
                  const rotatedMouse = rotatePoint({x,y}, center, -initialCharacter.rotation);
                  const rotatedOpposite = rotatePoint(interaction.oppositeCorner!, center, -initialCharacter.rotation);

                  let newWidth = Math.abs(rotatedMouse.x - rotatedOpposite.x);
                  let newHeight = newWidth / interaction.aspectRatio!;
                  
                  newChar.width = newWidth;
                  newChar.height = newHeight;
                  newChar.x = Math.min(rotatedMouse.x, rotatedOpposite.x);
                  newChar.y = Math.min(rotatedMouse.y, rotatedOpposite.y);

                  const newCenter = { x: newChar.x + newChar.width/2, y: newChar.y + newChar.height/2 };
                  const finalCenter = rotatePoint(newCenter, center, initialCharacter.rotation);

                  newChar.x = finalCenter.x - newChar.width/2;
                  newChar.y = finalCenter.y - newChar.height/2;

                  break;
              }
          }
          return newChar;
      }));
  }, [interaction, getInteractionForPoint, background]);

  const handleMouseUp = useCallback(() => {
      if(interaction) {
          if (canvasRef.current) {
              canvasRef.current.style.cursor = background ? 'grab' : 'default';
          }
          updateParentWithComposition();
      }
      setInteraction(null);
  }, [interaction, updateParentWithComposition, background]);
  
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!background || !canvasRef.current) return;
    
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    
    const scaleDelta = 0.0015;
    const minScale = 0.1;
    const maxScale = 10.0;

    setBackgroundTransform(prev => {
        const newScale = Math.max(minScale, Math.min(maxScale, prev.scale - e.deltaY * scaleDelta * prev.scale));
        
        const worldX = (x - prev.x) / prev.scale;
        const worldY = (y - prev.y) / prev.scale;

        const newX = x - worldX * newScale;
        const newY = y - worldY * newScale;
        
        const finalTransform = { x: newX, y: newY, scale: newScale };
        
        setTimeout(() => updateParentWithComposition(), 0); 
        
        return finalTransform;
    });
  }, [background, updateParentWithComposition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        if (canvas) {
            canvas.removeEventListener('wheel', handleWheel);
        }
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [handleMouseMove, handleMouseUp, handleWheel]);
  
  // Drag and drop handlers
    const handleBgDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsBgDraggingOver(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleBackgroundSelect(file);
        }
    };
    const handleBgDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleBgDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsBgDraggingOver(true);
    };
    const handleBgDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsBgDraggingOver(false);
    };

    const handleCharDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsCharDraggingOver(false);
        if (disabled || characters.length >= MAX_CHARACTERS) return;
        const files = Array.from(e.dataTransfer.files);
        let charsToAdd = MAX_CHARACTERS - characters.length;
        for (const file of files) {
            if (charsToAdd <= 0) break;
            if (file.type.startsWith('image/png') || file.type.startsWith('image/webp')) {
                handleCharFileAdd(file);
                charsToAdd--;
            }
        }
    };
    const handleCharDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleCharDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsCharDraggingOver(true);
    };
    const handleCharDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsCharDraggingOver(false);
    };

  const handleAutoPlace = async () => {
    const activeCharFiles = characters.map(c => c.file);
    if (!background || activeCharFiles.length === 0 || !canvasRef.current) {
        setError("Please upload a background and at least one character.");
        return;
    }
    setIsPlacing(true);
    setError(null);
    try {
        const placements = await getMultiCharacterPlacement(background.file, activeCharFiles);
        const canvas = canvasRef.current;
        setCharacters(prev => prev.map((char, index) => {
            const p = placements[index];
            if (!p) return char;
            return {
                ...char,
                x: p.x * canvas.offsetWidth,
                y: p.y * canvas.offsetHeight,
                width: p.width * canvas.offsetWidth,
                height: p.height * canvas.offsetHeight,
                rotation: 0,
            }
        }));
        setTimeout(updateParentWithComposition, 100);
    } catch (e) {
        setError(e instanceof Error ? e.message : "AI placement failed.");
    } finally {
        setIsPlacing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Background Uploader */}
        <div className="w-full sm:w-1/2">
           <label className="block text-sm font-medium text-gray-300 mb-2">Background (Nền)</label>
           <input type="file" ref={bgInputRef} onChange={(e) => e.target.files?.[0] && handleBackgroundSelect(e.target.files[0])} accept="image/*" className="hidden" disabled={disabled}/>
           <div 
             onClick={() => !disabled && bgInputRef.current?.click()}
             onDrop={handleBgDrop}
             onDragOver={handleBgDragOver}
             onDragEnter={handleBgDragEnter}
             onDragLeave={handleBgDragLeave}
             className={`aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center p-2 transition-all duration-300 ${disabled ? 'cursor-not-allowed bg-gray-900/50' : 'cursor-pointer'} ${isBgDraggingOver ? 'border-indigo-500 bg-gray-800/80 ring-2 ring-indigo-500' : 'border-gray-600 hover:border-indigo-500 bg-gray-900/50'}`}
           >
             {background ? <img src={background.img.src} className="object-contain h-full w-full"/> : <span className="text-xs text-gray-400 text-center">Click hoặc kéo để tải lên</span>}
           </div>
        </div>
        {/* Character List */}
        <div className="w-full sm:w-1/2">
           <label className="block text-sm font-medium text-gray-300 mb-2">Characters (Nhân vật) ({characters.length}/{MAX_CHARACTERS})</label>
           <input type="file" ref={charInputRef} onChange={(e) => e.target.files?.[0] && handleCharFileAdd(e.target.files[0])} accept="image/png, image/webp" className="hidden" disabled={disabled}/>
           <div 
             onDrop={handleCharDrop}
             onDragOver={handleCharDragOver}
             onDragEnter={handleCharDragEnter}
             onDragLeave={handleCharDragLeave}
             className={`space-y-1 max-h-[150px] overflow-y-auto pr-2 bg-gray-900/50 p-2 rounded-lg border border-gray-700 transition-all ${isCharDraggingOver ? 'border-indigo-500 ring-2 ring-indigo-500' : ''}`}
            >
             {characters.map(char => (
                <div key={char.id} className={`flex items-center gap-2 p-1 rounded transition-colors ${selectedCharacterId === char.id ? 'bg-indigo-900/50' : 'hover:bg-gray-800/70'}`}>
                    <img src={char.img.src} className="w-8 h-8 object-cover rounded flex-shrink-0"/>
                    <input 
                        type="text" 
                        value={char.name}
                        onChange={(e) => handleCharacterNameChange(char.id, e.target.value)}
                        placeholder="Tên nhân vật"
                        className="text-xs truncate flex-1 bg-transparent border-b border-gray-600 focus:border-indigo-500 focus:outline-none p-1"
                        onClick={(e) => e.stopPropagation()}
                        disabled={disabled}
                    />
                    {!char.isSavedToLibrary && (
                      <button onClick={() => handleSaveCharacter(char)} disabled={disabled} className="text-gray-400 hover:text-indigo-400 disabled:opacity-50 flex-shrink-0" title="Lưu vào thư viện">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12l-5-3-5 3V4z" /></svg>
                      </button>
                    )}
                    <button onClick={() => handleCharRemove(char.id)} disabled={disabled} className="text-gray-400 hover:text-red-500 text-xl leading-none px-1 disabled:opacity-50 flex-shrink-0">&times;</button>
                </div>
             ))}
             {characters.length < MAX_CHARACTERS && (
                <button onClick={() => !disabled && charInputRef.current?.click()} disabled={disabled} className="w-full text-xs border border-dashed border-gray-600 rounded p-2 hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">Thêm nhân vật hoặc kéo vào đây</button>
             )}
           </div>
           {characters.length > 0 && (
                <p className="text-xs text-gray-400 mt-2 text-center px-2">
                    Gợi ý: Dùng tên nhân vật trong prompt của bạn (ví dụ: "{characters[0].name} đang chạy") để AI giữ đúng ngoại hình.
                </p>
            )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Xem trước & Chỉnh sửa cảnh</label>
        <div className="relative w-full border-2 border-gray-700 rounded-lg bg-gray-900/70 overflow-hidden">
            <canvas ref={canvasRef} className="w-full block" onMouseDown={handleMouseDown}></canvas>
        </div>
      </div>
       
      <button onClick={handleAutoPlace} disabled={!background || characters.length === 0 || disabled || isPlacing} className="w-full flex justify-center items-center bg-teal-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-teal-700 disabled:bg-teal-900/50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all">
          {isPlacing ? 'Đang sắp xếp bằng AI...' : 'Tự động sắp xếp bằng AI'}
      </button>

      {error && <p className="text-xs text-center text-red-400 bg-red-900/30 p-2 rounded-md">{error}</p>}
      
      <canvas ref={hiddenCanvasRef} className="hidden"></canvas>
    </div>
  );
});

export default SceneComposer;
