
export interface BoundingBox {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width: number; // Percentage 0-100
  height: number; // Percentage 0-100
}

export interface GenerateResult {
  imageUrl?: string;
  error?: string;
}

export interface EditorState {
  imageSrc: string | null;
  originalFile: File | null;
  selection: BoundingBox | null;
  inputText: string;
  isProcessing: boolean;
  resultSrc: string | null;
}
