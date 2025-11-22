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

// Create a black and white mask image from the selection
const createMaskBase64 = (imageFile: File, selection: BoundingBox): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Use original image dimensions for precision
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not create 2D context for mask generation"));
        return;
      }

      // 1. Fill the entire canvas with BLACK (Protected area)
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Calculate coordinates for the selection
      const x = (selection.x / 100) * canvas.width;
      const y = (selection.y / 100) * canvas.height;
      const w = (selection.width / 100) * canvas.width;
      const h = (selection.height / 100) * canvas.height;

      // 3. Fill the selection with WHITE (Edit area)
      ctx.fillStyle = "white";
      ctx.fillRect(x, y, w, h);

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
    const base64Mask = await createMaskBase64(imageFile, selection);

    // Construct a prompt that relies on the mask
    const prompt = `
      Task: Precise Text Inpainting.
      
      I have provided two images:
      1. The 'Source Image' (to be edited).
      2. A 'Mask Image' (Black and White).
      
      INSTRUCTIONS:
      1. Use the second image (Mask Image) as a strict location guide.
      2. Identify the area in the Source Image that corresponds to the WHITE pixels in the Mask Image.
      3. ONLY inside this specific white area, erase the existing text and inpaint the new text: "${newText}".
      4. STRICTLY preserve all pixels in the Source Image where the Mask Image is BLACK. Do not modify any other text in the image, even if it looks similar.
      5. Maintain the original background texture, font style, size, and color of the replaced text area to blend seamlessly.
      6. Output the final full-color image.
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
              data: base64Mask,
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
    
    const textPart = parts.find(p => p.text);
    if (textPart) {
        throw new Error(`Model returned text instead of image: ${textPart.text}`);
    }

    throw new Error("Could not generate image.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};