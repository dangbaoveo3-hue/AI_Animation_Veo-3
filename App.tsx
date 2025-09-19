
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateVideo, generateImagesFromPrompt, generateImagePromptFromScene, editImageMultiple, enhancePromptWithStyle, generateStoryboardImages } from './services/geminiService';
import { LOADING_MESSAGES, ANIMATION_STYLES, ASPECT_RATIOS, QUALITY_LEVELS, IMAGE_ASPECT_RATIOS, MOTION_BLUR_LEVELS } from './constants';
import { fileToDataUrl } from './utils';
import VideoDisplay from './components/VideoDisplay';
import AnimationStyleSelector from './components/AnimationStyleSelector';
import SceneComposer, { CharacterDefinition, SceneComposerActions } from './components/SceneComposer';
import AspectRatioSelector from './components/AspectRatioSelector';
import QualitySelector from './components/QualitySelector';
import SingleImageUploader from './components/SingleImageUploader';
import ImageDisplay from './components/ImageDisplay';
import ReferenceImageUploader from './components/ReferenceImageUploader';
import NumberOfImagesSelector from './components/NumberOfImagesSelector';
import EditModal from './components/EditModal';
import HistoryPanel, { HistoryItem } from './components/HistoryPanel';
import CameraControls from './components/CameraControls';
import AdvancedVideoSettings from './components/AdvancedVideoSettings';
import CharacterLibrary, { SavedCharacter } from './components/CharacterLibrary';
import PostProcessingEffects from './components/PostProcessingEffects';
import StoryboardEditor, { StoryboardPanel } from './components/StoryboardEditor';
import StoryboardControls from './components/StoryboardControls';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';


type GenerationType = 'video' | 'image';
type UploadMode = 'image' | 'composer' | 'storyboard';
type ImageMode = 'prompt' | 'composer' | 'storyboard';
type EditingContent = { type: 'image' | 'videoFrame', dataUrl: string, originalIndex?: number };


const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Common State
  const [generationType, setGenerationType] = useState<GenerationType>('video');
  const [prompt, setPrompt] = useState<string>('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([ANIMATION_STYLES[0].name]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [cameraPrompt, setCameraPrompt] = useState<string>('');
  const [postEffectsPrompt, setPostEffectsPrompt] = useState<string>('');
  const sceneComposerRef = useRef<SceneComposerActions>(null);
  const [characterLibrary, setCharacterLibrary] = useState<SavedCharacter[]>([]);

  // Video-specific State
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('image');
  const [singleVideoSource, setSingleVideoSource] = useState<File | null>(null);
  const [storyboardPanels, setStoryboardPanels] = useState<StoryboardPanel[]>([{ id: Date.now(), imageFile: null, prompt: '', previewUrl: '' }]);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>(ASPECT_RATIOS[0].id);
  const [quality, setQuality] = useState<number>(720);
  const [duration, setDuration] = useState<number>(4);
  const [frameRate, setFrameRate] = useState<number>(24);
  const [motionBlur, setMotionBlur] = useState<string>('none');

  // Image-specific State
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [composedImageFile, setComposedImageFile] = useState<File | null>(null);
  const [characterDefinitions, setCharacterDefinitions] = useState<CharacterDefinition[]>([]);
  const [imageStyleReference, setImageStyleReference] = useState<File | null>(null);
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [imageAspectRatio, setImageAspectRatio] = useState<string>(IMAGE_ASPECT_RATIOS[0].id);
  const [imageMode, setImageMode] = useState<ImageMode>('prompt');
  const [storyboardPanelCount, setStoryboardPanelCount] = useState<number>(4);

  // Editing State
  const [editingContent, setEditingContent] = useState<EditingContent | null>(null);
  const [editedImageResults, setEditedImageResults] = useState<string[] | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Initialize device ID
  useEffect(() => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      // Simple unique ID generator
      deviceId = `device_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('deviceId', deviceId);
    }
  }, []);

  useEffect(() => {
    // Initialize access codes if they don't exist
    const accessCodes = localStorage.getItem('accessCodes');
    if (!accessCodes) {
      const initialCodes = [
        { code: 'K8P4W1R9T6X3Y7Z2', usedByDevices: [] }, { code: 'A5B9C2D6E1F8G3H7', usedByDevices: [] },
        { code: 'M4N0O1P2Q3R4S5T6', usedByDevices: [] }, { code: 'U7V8W9X0Y1Z2A3B4', usedByDevices: [] },
        { code: 'C5D6E7F8G9H0I1J2', usedByDevices: [] }, { code: 'L3K4M5N6O7P8Q9R0', usedByDevices: [] },
        { code: 'S1T2U3V4W5X6Y7Z8', usedByDevices: [] }, { code: 'B9A8C7D6E5F4G3H2', usedByDevices: [] },
        { code: 'I1J0K9L8M7N6O5P4', usedByDevices: [] }, { code: 'Q3R2S1T0U9V8W7X6', usedByDevices: [] },
        { code: 'Y5Z4A3B2C1D0E9F8', usedByDevices: [] }, { code: 'G7H6I5J4K3L2M1N0', usedByDevices: [] },
        { code: 'O9P8Q7R6S5T4U3V2', usedByDevices: [] }, { code: 'W1X0Y9Z8A7B6C5D4', usedByDevices: [] },
        { code: 'E3F2G1H0I9J8K7L6', usedByDevices: [] },
      ];
      localStorage.setItem('accessCodes', JSON.stringify(initialCodes));
    }
  }, []);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isAuthenticated') === 'true';
    const adminLoggedIn = localStorage.getItem('isAdminAuthenticated') === 'true';
    setIsAuthenticated(loggedIn);
    setIsAdminAuthenticated(adminLoggedIn);
  }, []);


  useEffect(() => {
    // Load history and character library from localStorage on initial render
    try {
      const storedHistory = localStorage.getItem('ai-animation-history');
      if (storedHistory) setHistory(JSON.parse(storedHistory));
      
      const storedLibrary = localStorage.getItem('ai-character-library');
      if (storedLibrary) setCharacterLibrary(JSON.parse(storedLibrary));

    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    // Save history to localStorage whenever it changes
    try {
      localStorage.setItem('ai-animation-history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);
  
  useEffect(() => {
    // Save character library to localStorage whenever it changes
    try {
      localStorage.setItem('ai-character-library', JSON.stringify(characterLibrary));
    } catch (e) {
      console.error("Failed to save character library to localStorage", e);
    }
  }, [characterLibrary]);

  useEffect(() => {
    if (!isLoading) return;
    let messageIndex = 0;
    setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    const intervalId = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [isLoading]);
  
  // Auth Handlers
  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };
  
  const handleAdminLogin = () => {
    localStorage.setItem('isAdminAuthenticated', 'true');
    setIsAdminAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isAdminAuthenticated');
    setIsAuthenticated(false);
    setIsAdminAuthenticated(false);
  };

  // Character Library Handlers
  const handleSaveCharacterToLibrary = async (charDef: CharacterDefinition) => {
    try {
      const imageDataUrl = await fileToDataUrl(charDef.file);
      const newSavedChar: SavedCharacter = {
        id: `char_${Date.now()}`,
        name: charDef.name,
        imageDataUrl,
      };
      setCharacterLibrary(prev => {
        // Avoid duplicates if user saves the same char multiple times
        if (prev.some(c => c.name === newSavedChar.name)) return prev;
        return [...prev, newSavedChar]
      });
    } catch (e) {
      setError("Failed to save character to library.");
    }
  };

  const handleAddCharacterFromLibrary = (savedChar: SavedCharacter) => {
    sceneComposerRef.current?.addCharacter(savedChar);
  };

  const handleDeleteCharacterFromLibrary = (id: string) => {
    setCharacterLibrary(prev => prev.filter(c => c.id !== id));
  };


  const handleGenerateVideo = useCallback(async () => {
    let sourceImage: File | null = null;
    if (uploadMode === 'storyboard') {
        sourceImage = storyboardPanels.find(p => p.imageFile)?.imageFile ?? null;
    } else {
        sourceImage = singleVideoSource;
    }

    if (!prompt && uploadMode !== 'storyboard') {
      setError('Please enter a main prompt for the video.');
      return;
    }
    
    if (!sourceImage) {
      setError('Please provide a source image or a starting image in your storyboard.');
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);

    const qualityInfo = QUALITY_LEVELS.find(q => q.value === quality);
    const ratioInfo = ASPECT_RATIOS.find(r => r.id === videoAspectRatio);
    const motionBlurInfo = MOTION_BLUR_LEVELS.find(b => b.id === motionBlur);

    const promptParts = [prompt.trim()];
    if (cameraPrompt) promptParts.unshift(cameraPrompt.trim());
    
    const stylePrompts = selectedStyles
        .map(styleName => ANIMATION_STYLES.find(s => s.name === styleName)?.prompt)
        .filter(Boolean)
        .map(p => p!.replace(/\.$/, '').trim());
    promptParts.push(...stylePrompts);
    
    if (postEffectsPrompt) promptParts.push(postEffectsPrompt);
    if (qualityInfo?.prompt) promptParts.push(qualityInfo.prompt.replace(/^,/, '').trim());
    if (ratioInfo?.prompt) promptParts.push(ratioInfo.prompt.replace(/^,/, '').trim());
    if (duration > 0) promptParts.push(`${duration} second duration`);
    if (frameRate > 0) promptParts.push(`${frameRate}fps`);
    if (motionBlurInfo?.prompt) promptParts.push(motionBlurInfo.prompt.replace(/^,/, '').trim());

    let fullPrompt = promptParts.filter(Boolean).join(', ');

    if (uploadMode === 'storyboard' && storyboardPanels.length > 0) {
        const scenePrompts = storyboardPanels
            .map((panel, index) => panel.prompt.trim() ? `Scene ${index + 1}: ${panel.prompt.trim()}` : null)
            .filter(Boolean);
        
        if (scenePrompts.length > 0) {
            fullPrompt += `. CRITICAL INSTRUCTION: The video must follow this detailed storyboard, maintaining perfect character and artistic style consistency across all scenes. Start with a scene based on the provided image, then transition through the following script: ${scenePrompts.join('. ')}`;
        }
    }

    const generatedUrl = await generateVideo(fullPrompt, [sourceImage], console.log);
    setVideoUrl(generatedUrl);
    
    const newHistoryItem: HistoryItem = {
        id: Date.now(),
        type: 'video',
        url: generatedUrl,
        prompt: fullPrompt,
        timestamp: new Date().toISOString(),
    };
    setHistory(prev => [newHistoryItem, ...prev]);

  }, [prompt, uploadMode, singleVideoSource, storyboardPanels, selectedStyles, videoUrl, videoAspectRatio, quality, cameraPrompt, duration, frameRate, motionBlur, postEffectsPrompt]);

  const handleGenerateImage = useCallback(async () => {
    if (!prompt) {
      setError('Please enter a prompt to generate images.');
      return;
    }
    if (imageMode === 'composer' && !composedImageFile) {
      setError('Please compose a scene before generating an image.');
      return;
    }
    setGeneratedImages([]);
    
    // Combine styles, camera, effects into a single suffix for reuse
    const stylePrompts = selectedStyles
      .map(styleName => ANIMATION_STYLES.find(s => s.name === styleName)?.prompt)
      .filter(Boolean)
      .map(p => p!.replace(/\.$/, '').trim());
    
    const suffixParts = [...stylePrompts];
    if (postEffectsPrompt) suffixParts.push(postEffectsPrompt);
    if (cameraPrompt) suffixParts.unshift(cameraPrompt.trim());
    const promptSuffix = suffixParts.filter(Boolean).join(', ');


    if (imageMode === 'storyboard') {
        setLoadingMessage("AI is writing the script...");
        const images = await generateStoryboardImages(prompt, storyboardPanelCount, imageAspectRatio, promptSuffix);
        setGeneratedImages(images);

        if (images.length > 0) {
            const newHistoryItem: HistoryItem = {
                id: Date.now(),
                type: 'image',
                url: `data:image/jpeg;base64,${images[0]}`, // Thumbnail
                prompt: `Storyboard: ${prompt}`,
                timestamp: new Date().toISOString(),
                imageSet: images,
            };
            setHistory(prev => [newHistoryItem, ...prev]);
        }
        return; // Exit here for storyboard mode
    }

    let detailedPrompt = prompt;

    // Enhance prompt differently based on the mode
    if (imageMode === 'composer') {
        setLoadingMessage("AI is directing the scene...");
        detailedPrompt = await generateImagePromptFromScene(
            prompt,
            composedImageFile,
            characterDefinitions,
            imageStyleReference
        );
    } else if (imageStyleReference) { // In 'prompt' mode with a style reference
        setLoadingMessage("AI is analyzing the style...");
        detailedPrompt = await enhancePromptWithStyle(prompt, imageStyleReference);
    }
    
    const finalImagePrompt = [detailedPrompt, promptSuffix].filter(Boolean).join(', ');

    setLoadingMessage("Generating images from AI's vision...");
    const images = await generateImagesFromPrompt(finalImagePrompt, numberOfImages, imageAspectRatio);
    setGeneratedImages(images);

    if (images.length > 0) {
        const newHistoryItem: HistoryItem = {
            id: Date.now(),
            type: 'image',
            url: `data:image/jpeg;base64,${images[0]}`, // Thumbnail
            prompt: finalImagePrompt,
            timestamp: new Date().toISOString(),
            imageSet: images,
        };
        setHistory(prev => [newHistoryItem, ...prev]);
    }

  }, [prompt, imageMode, composedImageFile, characterDefinitions, imageStyleReference, numberOfImages, imageAspectRatio, selectedStyles, cameraPrompt, postEffectsPrompt, storyboardPanelCount]);


  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (generationType === 'video') {
        await handleGenerateVideo();
      } else {
        await handleGenerateImage();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVideoModeChange = useCallback((mode: UploadMode) => {
    if (mode !== uploadMode) {
      setUploadMode(mode);
      setSingleVideoSource(null);
      setStoryboardPanels([{ id: Date.now(), imageFile: null, prompt: '', previewUrl: '' }]);
      setComposedImageFile(null);
      setCharacterDefinitions([]);
    }
  }, [uploadMode]);

  const handleImageModeChange = useCallback((mode: ImageMode) => {
    if (mode !== imageMode) {
        setImageMode(mode);
        // Reset composer-specific state when switching away from it
        if (mode !== 'composer') {
            setComposedImageFile(null);
            setCharacterDefinitions([]);
        }
    }
  }, [imageMode]);


  const handleCompositionChange = useCallback((data: { composedImage: File | null; characters: CharacterDefinition[] }) => {
    if (generationType === 'video') {
        setSingleVideoSource(data.composedImage);
    } else {
        setComposedImageFile(data.composedImage);
        setCharacterDefinitions(data.characters);
    }
  }, [generationType]);

    const handleEditClick = (type: 'image' | 'videoFrame', content: string, index?: number) => {
        if (type === 'videoFrame') {
            setEditingContent({ type: 'videoFrame', dataUrl: content });
        } else {
            setEditingContent({ type: 'image', dataUrl: `data:image/jpeg;base64,${content}`, originalIndex: index });
        }
    };
    
    const handleCloseEditModal = () => {
        setEditingContent(null);
        setEditedImageResults(null);
        setError(null);
    };

    const handleApplyEdit = async (editPrompt: string, count: number, maskDataUrl: string | null) => {
        if (!editingContent) return;
        setIsEditing(true);
        setError(null);
        setEditedImageResults(null);
        try {
            const { dataUrl } = editingContent;
            const results = await editImageMultiple(dataUrl, editPrompt, count, maskDataUrl);
            setEditedImageResults(results);
        } catch(err) {
            setError(err instanceof Error ? err.message : 'Editing failed.');
        } finally {
            setIsEditing(false);
        }
    };

    const handleConfirmEdit = (selectedBase64: string) => {
        if (!editingContent) return;

        if (editingContent.type === 'image') {
            const newImages = [...generatedImages];
            newImages[editingContent.originalIndex!] = selectedBase64;
            setGeneratedImages(newImages);
        } else { // videoFrame
            // When editing a video frame, the result becomes a new image in the Image Studio
            setGenerationType('image');
            setGeneratedImages([selectedBase64]);
            setVideoUrl(null); // Clear the old video
        }
        handleCloseEditModal();
    };
    
    const handleLoadHistoryItem = (item: HistoryItem) => {
        setError(null);
        if (item.type === 'video') {
            setGenerationType('video');
            setVideoUrl(item.url);
            setPrompt(item.prompt);
            setGeneratedImages([]);
        } else if (item.type === 'image') {
            setGenerationType('image');
            // The first image's data URL is in `item.url`. The full set of base64 strings is in `item.imageSet`.
            const imagesToShow = item.imageSet || [item.url.split(',')[1]];
            setGeneratedImages(imagesToShow);
            setPrompt(item.prompt);
            setVideoUrl(null);
        }
    };

    const handleDeleteHistoryItem = (id: number) => {
        const itemToDelete = history.find(item => item.id === id);
        if (itemToDelete && itemToDelete.type === 'video') {
            URL.revokeObjectURL(itemToDelete.url);
        }
        setHistory(prev => prev.filter(item => item.id !== id));
    };

  const isVideoSourceMissing = generationType === 'video' && (
      (uploadMode === 'storyboard' && (storyboardPanels.length === 0 || !storyboardPanels[0].imageFile)) ||
      ((uploadMode === 'image' || uploadMode === 'composer') && !singleVideoSource)
  );

  const isGenerateDisabled = isLoading || 
    (generationType === 'video' && (!prompt && uploadMode !== 'storyboard')) ||
    (generationType === 'image' && !prompt) ||
    isVideoSourceMissing ||
    (generationType === 'image' && imageMode === 'composer' && !composedImageFile);
    
  const showComposer = (generationType === 'video' && uploadMode === 'composer') || (generationType === 'image' && imageMode === 'composer');

  const getPromptLabel = () => {
    if (generationType === 'video') {
      return uploadMode === 'storyboard' 
        ? "Main Idea / Bối cảnh chung (Tùy chọn)"
        : "Prompt (Viết ý tưởng của bạn)";
    }
    // Image Studio
    switch(imageMode) {
      case 'storyboard':
        return "Story Prompt (Viết câu chuyện của bạn)";
      case 'composer':
        return "Prompt (Mô tả cảnh bạn đã dựng)";
      default:
        return "Prompt (Viết ý tưởng của bạn)";
    }
  };

  if (isAdminAuthenticated) {
    return <AdminPanel onLogout={handleLogout} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLogin} onAdminLoginSuccess={handleAdminLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-screen-2xl">
        <header className="text-center mb-8 relative">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI Animation DEV by BaoDZ
          </h1>
          <p className="text-gray-400 mt-2">Bring your imagination to life. Generate videos and images with AI.</p>
           <button
            onClick={handleLogout}
            className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
           >
            Đăng xuất
          </button>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700 flex flex-col space-y-6">
            
            <div className="flex rounded-lg bg-gray-900/70 border border-gray-600 p-1">
              <button onClick={() => setGenerationType('video')} disabled={isLoading} className={`w-1/2 rounded-md py-2 text-sm font-medium transition-colors duration-200 ${generationType === 'video' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                Video Studio
              </button>
              <button onClick={() => setGenerationType('image')} disabled={isLoading} className={`w-1/2 rounded-md py-2 text-sm font-medium transition-colors duration-200 ${generationType === 'image' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                Image Studio
              </button>
            </div>
            
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                {getPromptLabel()}
              </label>
              <textarea
                id="prompt"
                rows={4}
                className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none placeholder-gray-500"
                placeholder={generationType === 'video' ? "e.g., A majestic dragon flying through a cyberpunk city..." : "e.g., A beautiful princess in a magical forest..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <AnimationStyleSelector selectedStyles={selectedStyles} onStyleChange={setSelectedStyles} disabled={isLoading} />
            
            <PostProcessingEffects onEffectsChange={setPostEffectsPrompt} disabled={isLoading} />

            <CameraControls onCameraChange={setCameraPrompt} disabled={isLoading} />

            {generationType === 'video' ? (
              <>
                <AspectRatioSelector selectedRatio={videoAspectRatio} onRatioChange={setVideoAspectRatio} disabled={isLoading} ratios={ASPECT_RATIOS} />
                <QualitySelector selectedValue={quality} onQualityChange={setQuality} disabled={isLoading} />
                <AdvancedVideoSettings
                  duration={duration}
                  onDurationChange={setDuration}
                  frameRate={frameRate}
                  onFrameRateChange={setFrameRate}
                  motionBlur={motionBlur}
                  onMotionBlurChange={setMotionBlur}
                  disabled={isLoading}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Video Mode (Chế độ Video)</label>
                  <div className="flex rounded-lg bg-gray-900/70 border border-gray-600 p-1">
                    <button onClick={() => handleVideoModeChange('image')} disabled={isLoading} className={`w-1/3 rounded-md py-2 text-xs font-medium transition-colors duration-200 ${uploadMode === 'image' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Image to Video (Ảnh sang Video)</button>
                    <button onClick={() => handleVideoModeChange('composer')} disabled={isLoading} className={`w-1/3 rounded-md py-2 text-xs font-medium transition-colors duration-200 ${uploadMode === 'composer' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Scene Composer (Dựng cảnh)</button>
                    <button onClick={() => handleVideoModeChange('storyboard')} disabled={isLoading} className={`w-1/3 rounded-md py-2 text-xs font-medium transition-colors duration-200 ${uploadMode === 'storyboard' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Storyboard (Bảng phân cảnh)</button>
                  </div>
                </div>
                {uploadMode === 'image' && <SingleImageUploader onImagesChange={(files) => setSingleVideoSource(files[0] || null)} disabled={isLoading} />}
                {uploadMode === 'composer' && (
                    <div className="space-y-4">
                        <CharacterLibrary library={characterLibrary} onAdd={handleAddCharacterFromLibrary} onDelete={handleDeleteCharacterFromLibrary} disabled={isLoading} />
                        <SceneComposer ref={sceneComposerRef} onCompositionChange={handleCompositionChange} onSaveCharacter={handleSaveCharacterToLibrary} disabled={isLoading} />
                    </div>
                )}
                {uploadMode === 'storyboard' && <StoryboardEditor panels={storyboardPanels} onPanelsChange={setStoryboardPanels} disabled={isLoading} />}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Image Mode (Chế độ Ảnh)</label>
                  <div className="flex rounded-lg bg-gray-900/70 border border-gray-600 p-1">
                    <button onClick={() => handleImageModeChange('prompt')} disabled={isLoading} className={`w-1/3 rounded-md py-2 text-xs font-medium transition-colors duration-200 ${imageMode === 'prompt' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Prompt (Gợi ý)</button>
                    <button onClick={() => handleImageModeChange('composer')} disabled={isLoading} className={`w-1/3 rounded-md py-2 text-xs font-medium transition-colors duration-200 ${imageMode === 'composer' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Composer (Dựng cảnh)</button>
                    <button onClick={() => handleImageModeChange('storyboard')} disabled={isLoading} className={`w-1/3 rounded-md py-2 text-xs font-medium transition-colors duration-200 ${imageMode === 'storyboard' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>AI Storyboard (Phân cảnh AI)</button>
                  </div>
                </div>
                {imageMode === 'composer' && (
                    <div className="space-y-4">
                        <CharacterLibrary library={characterLibrary} onAdd={handleAddCharacterFromLibrary} onDelete={handleDeleteCharacterFromLibrary} disabled={isLoading} />
                        <SceneComposer ref={sceneComposerRef} onCompositionChange={handleCompositionChange} onSaveCharacter={handleSaveCharacterToLibrary} disabled={isLoading} />
                    </div>
                )}
                {imageMode === 'storyboard' && (
                    <StoryboardControls selectedCount={storyboardPanelCount} onCountChange={setStoryboardPanelCount} disabled={isLoading} />
                )}
                {imageMode !== 'storyboard' && (
                    <>
                        <ReferenceImageUploader onReferenceImageChange={setImageStyleReference} disabled={isLoading} />
                        <NumberOfImagesSelector selectedNumber={numberOfImages} onNumberChange={setNumberOfImages} disabled={isLoading} />
                    </>
                )}
                <AspectRatioSelector selectedRatio={imageAspectRatio} onRatioChange={setImageAspectRatio} disabled={isLoading} ratios={IMAGE_ASPECT_RATIOS} />
              </>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerateDisabled}
              className="w-full flex justify-center items-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300 transform hover:scale-105 disabled:scale-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 mt-auto"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                `Generate ${generationType === 'video' ? 'Video' : 'Images'}`
              )}
            </button>
          </div>

          <div className="lg:col-span-5 flex flex-col space-y-4">
              {generationType === 'video' ? (
                <VideoDisplay videoUrl={videoUrl} isLoading={isLoading} loadingMessage={loadingMessage} error={error} onEditRequest={(frameDataUrl) => handleEditClick('videoFrame', frameDataUrl)} />
              ) : (
                <ImageDisplay images={generatedImages} isLoading={isLoading} loadingMessage={loadingMessage} error={error} onEdit={(content, index) => handleEditClick('image', content, index)} />
              )}
          </div>

          <div className="lg:col-span-3">
            <HistoryPanel
              history={history}
              onLoad={handleLoadHistoryItem}
              onDelete={handleDeleteHistoryItem}
              onEdit={handleLoadHistoryItem}
             />
          </div>

        </main>
      </div>

       {editingContent && (
            <EditModal
                content={editingContent}
                onClose={handleCloseEditModal}
                onGenerateEdits={handleApplyEdit}
                onConfirmEdit={handleConfirmEdit}
                isLoading={isEditing}
                error={error}
                clearError={() => setError(null)}
                editedImageResults={editedImageResults}
            />
        )}
    </div>
  );
};

export default App;
