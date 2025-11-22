import React, { useRef, useState, useEffect, MouseEvent } from 'react';
import { BoundingBox } from '../types';

interface CanvasEditorProps {
  imageSrc: string;
  onSelectionChange: (box: BoundingBox | null) => void;
  resetSelectionTrigger: number; // Increment to force reset
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ imageSrc, onSelectionChange, resetSelectionTrigger }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);

  // Reset selection when trigger changes or image changes
  useEffect(() => {
    setCurrentBox(null);
    // Call onSelectionChange to reset parent state, but do not include it in dependency array
    // to avoid infinite loops if parent passes a new function reference on every render.
    onSelectionChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, resetSelectionTrigger]);

  const getRelativeCoords = (e: MouseEvent) => {
    if (!imgRef.current) return { x: 0, y: 0 };
    
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    // Convert to percentages (0-100)
    return {
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    };
  };

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getRelativeCoords(e);
    setStartPos(coords);
    setCurrentBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing || !startPos) return;
    e.preventDefault();

    const coords = getRelativeCoords(e);
    
    const x = Math.min(coords.x, startPos.x);
    const y = Math.min(coords.y, startPos.y);
    const width = Math.abs(coords.x - startPos.x);
    const height = Math.abs(coords.y - startPos.y);

    const newBox = { x, y, width, height };
    setCurrentBox(newBox);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox) {
        onSelectionChange(currentBox);
    }
    setIsDrawing(false);
    setStartPos(null);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-lg shadow-2xl border border-gray-700 bg-gray-900 select-none"
    >
      {/* Image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Workspace"
        className="w-full h-auto block pointer-events-none select-none"
        draggable={false}
      />

      {/* Overlay Layer for events */}
      <div
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Helper Text if no box */}
        {!currentBox && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30 transition-opacity duration-500 hover:opacity-0">
                <p className="text-white/80 text-sm font-medium px-3 py-1 bg-black/50 rounded backdrop-blur-sm">
                  Drag to select text area
                </p>
             </div>
        )}

        {/* The Selection Box */}
        {currentBox && (
          <div
            className="absolute border-2 border-yellow-400 bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
            style={{
              left: `${currentBox.x}%`,
              top: `${currentBox.y}%`,
              width: `${currentBox.width}%`,
              height: `${currentBox.height}%`,
            }}
          >
            {/* Handles/Corners for visual flair */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasEditor;