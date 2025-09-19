
import { GoogleGenAI, GenerateVideosOperation, Type, Modality } from "@google/genai";
import { fileToBase64 } from '../utils';
import { ANIMATION_STYLES } from "../constants";
import { CharacterDefinition } from "../components/SceneComposer";

export interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
}


export const editImage = async (dataUrl: string, prompt: string, maskDataUrl?: string | null): Promise<string> => {
    // Fix: Use process.env.API_KEY to get the API key.
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    try {
        const parts = dataUrl.split(',');
        const mimeType = parts[0].match(/:(.*?);/)?.[1];
        const base64ImageData = parts[1];

        if (!mimeType || !base64ImageData) {
            throw new Error("Invalid data URL provided for editing.");
        }

        const imagePart = {
            inlineData: {
                data: base64ImageData,
                mimeType: mimeType,
            },
        };
        const textPart = { text: prompt };

        const allParts = [imagePart, textPart];

        if (maskDataUrl) {
            const maskParts = maskDataUrl.split(',');
            const maskMimeType = maskParts[0].match(/:(.*?);/)?.[1];
            const maskBase64Data = maskParts[1];
            if (maskMimeType && maskBase64Data) {
                // The API expects the mask to be between the image and the prompt
                allParts.splice(1, 0, {
                    inlineData: {
                        data: maskBase64Data,
                        mimeType: maskMimeType
                    }
                });
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: allParts,
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("AI did not return an edited image.");

    } catch (e) {
        console.error("Error editing image:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to edit the image.");
    }
};

export const editImageMultiple = async (dataUrl: string, prompt: string, count: number, maskDataUrl?: string | null): Promise<string[]> => {
    try {
        const editPromises = Array.from({ length: count }, () => editImage(dataUrl, prompt, maskDataUrl));
        const results = await Promise.all(editPromises);
        return results;
    } catch(e) {
        console.error("Error generating multiple edits:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to generate multiple image edits.");
    }
}

export const enhancePromptWithStyle = async (
    userPrompt: string,
    styleReference: File
): Promise<string> => {
    // Fix: Use import.meta.env.VITE_API_KEY to get the API key.
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    try {
        const initialPrompt = `You are an artistic prompt enhancer for an AI image generator. Your task is to analyze a user's prompt and a style reference image. Combine them to create a single, detailed, and coherent final prompt.

**RULES:**
1.  **Artistic Style:** The final prompt must describe the artistic style, color palette, lighting, texture, and overall mood of the "STYLE REFERENCE IMAGE".
2.  **User Content:** The core subject and action of the final prompt must come from the "User's Base Prompt". Do not change the user's core idea.
3.  **Integration:** Weave the stylistic descriptions from the reference image into the user's prompt to create a rich, detailed final prompt.
4.  **Output:** The final output must be ONLY the detailed prompt string, nothing else.

**User's Base Prompt:** "${userPrompt}"
`;
        const parts: any[] = [{ text: initialPrompt }];
        
        const style64 = await fileToBase64(styleReference);
        parts.push({ text: "--- STYLE REFERENCE IMAGE ---" });
        parts.push({ inlineData: { mimeType: styleReference.type, data: style64 } });

        parts.push({ text: "Now, based on the user's prompt and the style reference, generate the single, detailed final prompt." });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: parts },
        });

        return response.text.trim();

    } catch (e) {
        console.error("Error enhancing prompt with style:", e);
        throw new Error("Failed to enhance prompt with style reference.");
    }
};

export const generateImagePromptFromScene = async (
    userPrompt: string,
    composedScene: File | null,
    characters: CharacterDefinition[],
    styleReference: File | null
): Promise<string> => {
    // Fix: Use import.meta.env.VITE_API_KEY to get the API key.
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    try {
        const initialPrompt = `You are a world-class prompt engineer for an AI image generator. Your sole purpose is to create a single, perfect, detailed prompt by synthesizing user input and reference images.

**CRITICAL RULES - FOLLOW EXACTLY:**
1.  **ABSOLUTE CHARACTER FIDELITY (DO NOT DEVIATE):** This is the most important rule. You will be given image definitions for named characters. When the user's prompt mentions a character's name (e.g., "${characters[0]?.name || 'Character A'}"), you MUST describe that character in the final prompt with 100% visual accuracy to their provided image.
    *   **DO NOT** change their appearance, clothing, colors, style, species, or any visual attribute.
    *   **DO NOT** add or invent details not present in the character's image.
    *   Your task is to translate the character's image into a precise textual description for the image generator to replicate. Any deviation from the source image is a failure.

2.  **PRECISE SCENE COMPOSITION:** If a "PRE-COMPOSED SCENE IMAGE" is provided, it dictates the exact layout, positioning, and scale of characters and objects. Your prompt must describe this exact visual arrangement.

3.  **STRICT STYLE ADHERENCE:** If a "STYLE REFERENCE IMAGE" is provided, the final image's artistic style, color palette, lighting, and texture MUST strictly match it. Your prompt must contain descriptive terms that enforce this style.

4.  **SEAMLESS INTEGRATION:** Weave the user's core idea (from the "User's Base Prompt") with the strict rules above into a single, cohesive, highly-detailed prompt.

5.  **OUTPUT FORMAT:** Your response MUST BE ONLY the final detailed prompt string. Do not include any other text, labels, or explanations.

**User's Base Prompt:** "${userPrompt}"
`;
        const parts: any[] = [{ text: initialPrompt }];
        
        // Add character definitions
        for (const char of characters) {
            const charBase64 = await fileToBase64(char.file);
            parts.push({ text: `--- CHARACTER DEFINITION: "${char.name}" ---` });
            parts.push({ inlineData: { mimeType: char.file.type, data: charBase64 } });
        }
        
        if (composedScene) {
            const scene64 = await fileToBase64(composedScene);
            parts.push({ text: "--- PRE-COMPOSED SCENE IMAGE (with layout) ---" });
            parts.push({ inlineData: { mimeType: composedScene.type, data: scene64 } });
        }
        
        if (styleReference) {
            const style64 = await fileToBase64(styleReference);
            parts.push({ text: "--- STYLE REFERENCE IMAGE ---" });
            parts.push({ inlineData: { mimeType: styleReference.type, data: style64 } });
        }

        parts.push({ text: "Now, based on all the provided assets and rules, generate the single, detailed final prompt." });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: parts },
        });

        return response.text.trim();

    } catch (e) {
        console.error("Error generating detailed image prompt:", e);
        throw new Error("Failed to create a scene prompt from the provided assets.");
    }
};

export const generateImagesFromPrompt = async (
    prompt: string,
    numberOfImages: number,
    aspectRatio: string,
): Promise<string[]> => {
    // Fix: Use import.meta.env.VITE_API_KEY to get the API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("The API did not return any images.");
        }

        return response.generatedImages.map(img => img.image.imageBytes);
    } catch (e) {
        console.error("Error generating images:", e);
        throw new Error(e instanceof Error ? e.message : "Failed to generate images due to an unknown error.");
    }
};


export const generateStoryboardImages = async (
    storyPrompt: string,
    panelCount: number,
    aspectRatio: string,
    styleSuffix: string // This contains styles, camera, effects all combined
): Promise<string[]> => {
    // Fix: Use process.env.API_KEY to get the API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Step 1: Generate individual scene prompts from the main story
    const promptGenerationResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a creative storyboard director. Analyze the following story idea and break it down into exactly ${panelCount} distinct, visually compelling scenes. For each scene, write a short, powerful, and detailed prompt suitable for an AI image generator. The prompts should flow logically to tell the story.
        
        Story Idea: "${storyPrompt}"

        Your response must be a JSON array containing exactly ${panelCount} string prompts. Do not include any other text or explanations.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                    description: 'A detailed image prompt for a single storyboard panel.'
                }
            }
        }
    });

    const scenePrompts: string[] = JSON.parse(promptGenerationResponse.text.trim());
    
    if (!Array.isArray(scenePrompts) || scenePrompts.length === 0) {
        throw new Error("AI failed to generate storyboard prompts.");
    }

    // Step 2: Generate an image for each scene prompt
    const imageGenerationPromises = scenePrompts.map(scenePrompt => {
        const fullPrompt = styleSuffix ? `${scenePrompt}, ${styleSuffix}` : scenePrompt;
        
        return ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
            },
        });
    });

    const responses = await Promise.all(imageGenerationPromises);

    const images: string[] = responses.map(res => {
        if (!res.generatedImages || res.generatedImages.length === 0) {
            throw new Error("One or more storyboard images could not be generated.");
        }
        return res.generatedImages[0].image.imageBytes;
    });

    return images;
};


export const getMultiCharacterPlacement = async (backgroundFile: File, characterFiles: File[]): Promise<Placement[]> => {
    // Fix: Use process.env.API_KEY to get the API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const bgBase64 = await fileToBase64(backgroundFile);
        const charBase64s = await Promise.all(characterFiles.map(file => fileToBase64(file)));

        const bgPart = { inlineData: { mimeType: backgroundFile.type, data: bgBase64 } };
        const charParts = charBase64s.map((data, i) => ({
            inlineData: { mimeType: characterFiles[i].type, data }
        }));

        const textPart = { 
            text: "Analyze the background and the sequence of character images. For each character image, determine the most logical placement and scale within the background scene, considering potential interactions and overall composition. Provide the result as a JSON array of objects, with one object per character in the same order they were provided. Each object must have normalized coordinates (x, y) for the top-left corner and dimensions (width, height), where the background is the frame of reference (0,0 to 1,1)." 
        };
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [textPart, bgPart, ...charParts] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            x: { type: Type.NUMBER },
                            y: { type: Type.NUMBER },
                            width: { type: Type.NUMBER },
                            height: { type: Type.NUMBER },
                        },
                        required: ["x", "y", "width", "height"],
                    }
                },
            },
        });

        const jsonString = response.text.trim();
        const placements = JSON.parse(jsonString) as Placement[];
        
        if (!Array.isArray(placements) || placements.length !== characterFiles.length) {
            throw new Error("AI did not return a valid placement array for all characters.");
        }

        return placements;

    } catch (e) {
        console.error("Error getting smart placement:", e);
        throw new Error("Failed to get smart placement from AI. The model may have been unable to determine valid positions.");
    }
};

export const generateSceneFromImages = async (imageFiles: File[]): Promise<string> => {
    if (imageFiles.length === 0) {
        throw new Error("At least one image is required to generate a scene.");
    }
    // Fix: Use process.env.API_KEY to get the API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const textPart = { text: "Analyze the following sequence of images and describe a coherent, single scene or a short story that connects them. The description should be suitable as a prompt for a text-to-video AI model." };

        const imageParts = await Promise.all(
            imageFiles.map(async (file) => {
                const base64Data = await fileToBase64(file);
                return {
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data,
                    },
                };
            })
        );
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [textPart, ...imageParts] },
        });

        return response.text.trim();

    } catch (e) {
        console.error("Error generating scene from images:", e);
        throw new Error("Failed to generate a scene from the provided images.");
    }
};

export const generateVideo = async (
  prompt: string,
  imageFiles: File[],
  onProgress: (message: string) => void
): Promise<string> => {
  // Fix: Use process.env.API_KEY to get the API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (imageFiles.length === 0) {
    throw new Error("An image is required to generate a video.");
  }
  
  let operation: GenerateVideosOperation;
  const sourceImage = imageFiles[0];

  try {
    onProgress("Preparing your image...");
    const base64Image = await fileToBase64(sourceImage);
    operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt,
      image: {
        imageBytes: base64Image,
        mimeType: sourceImage.type,
      },
      config: {
        numberOfVideos: 1,
      },
    });
  } catch(e) {
      console.error("Error starting video generation:", e);
      throw new Error("Failed to start video generation. Check your prompt or API key.");
  }
  
  onProgress("Video generation started. Polling for results...");

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    try {
        operation = await ai.operations.getVideosOperation({ operation });
    } catch(e) {
        console.error("Polling failed, retrying...", e);
    }
  }

  if (operation.error) {
    console.error("Video generation failed:", operation.error);
    throw new Error(`Video generation failed: ${operation.error.message || 'Unknown API error'}`);
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!downloadLink) {
    throw new Error("Could not retrieve video download link from the API response.");
  }

  onProgress("Fetching generated video...");
  // Fix: Use process.env.API_KEY to get the API key.
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!videoResponse.ok) {
     const errorText = await videoResponse.text();
    throw new Error(`Failed to download the generated video. Status: ${videoResponse.status}. ${errorText}`);
  }

  const videoBlob = await videoResponse.blob();
  const videoUrl = URL.createObjectURL(videoBlob);
  
  onProgress("Done.");

  return videoUrl;
};
