
import { GoogleGenAI } from "@google/genai";
import { BoundingBox } from "../types";

// Helper to convert Blob/File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Helper to convert Base64 Data URL to File object
export const base64ToFile = async (base64Url: string, fileName: string): Promise<File> => {
  const res = await fetch(base64Url);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type });
};

/**
 * IMPROVED MASK STRATEGY: Visual Reference
 * Instead of a binary B&W mask which loses context, we create a "Visual Guide".
 * We take the original image, DIM the non-selected areas significantly,
 * and draw a bright highlight frame around the selected area.
 * This helps the VLM align pixels perfectly because it can still "see" the background content.
 */
const createVisualGuideBase64 = (imageFile: File, selection: BoundingBox): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not create 2D context for mask generation"));
        return;
      }

      // 1. Draw the original image first
      ctx.drawImage(img, 0, 0);

      // 2. Create the "Dimmed" overlay for the whole image
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)"; // Dark overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Calculate selection coordinates
      const x = (selection.x / 100) * canvas.width;
      const y = (selection.y / 100) * canvas.height;
      const w = (selection.width / 100) * canvas.width;
      const h = (selection.height / 100) * canvas.height;

      // 4. "Cut out" the selection to reveal the original image (The focus area)
      // We do this by drawing the image again, but clipped to the selection rect
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.drawImage(img, 0, 0); // Redraw original at full brightness here
      ctx.restore();

      // 5. Draw a bright Green border around the selection to explicitly tell the model "HERE"
      ctx.strokeStyle = "#00FF00"; // Bright Green
      ctx.lineWidth = Math.max(2, canvas.width * 0.005); // Dynamic stroke width
      ctx.strokeRect(x, y, w, h);

      // Return base64 without prefix
      resolve(canvas.toDataURL("image/png").split(",")[1]);
    };
    img.onerror = (err) => reject(err);
    img.src = URL.createObjectURL(imageFile);
  });
};

export const inpaintText = async (
  imageFile: File,
  selection: BoundingBox,
  newText: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const base64Image = await fileToBase64(imageFile);
    // Use the new Visual Guide strategy instead of simple binary mask
    const base64VisualGuide = await createVisualGuideBase64(imageFile, selection);

    const prompt = `
      Task: Professional Image Text Replacement.
      
      Input Data:
      1. [Source Image]: The original image to be edited.
      2. [Location Guide]: A reference version of the image where the area to edit is BRIGHT and framed in GREEN, while the rest is darkened.

      INSTRUCTIONS:
      1. Look at the [Location Guide]. Focus ONLY on the bright area inside the GREEN frame.
      2. Find the exact corresponding pixels in the [Source Image].
      3. In that specific area of the [Source Image], replace the existing text with: "${newText}".
      4. PRESERVE the background texture, lighting, and style of the original image perfectly.
      5. DO NOT touch any part of the image that is darkened in the [Location Guide].
      6. Return the final clean image (without the green frame or darkening).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Image,
            },
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64VisualGuide,
            },
          },
        ],
      },
      config: {
        imageConfig: {
            imageSize: "2K" 
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error("No content returned from API");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    // Fallback: Check if model returned text error
    const textPart = parts.find(p => p.text);
    if (textPart) {
       // Sometimes the model talks back. Treat it as an error or log it.
       throw new Error(`Model returned text: ${textPart.text}`);
    }

    throw new Error("Could not generate image.");

  } catch (error) {
    console.error("Gemini Inpaint Error:", error);
    throw error;
  }
};
