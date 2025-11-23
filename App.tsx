
import React, { useState, useRef, useCallback } from 'react';
import CanvasEditor from './components/CanvasEditor';
import ApiKeySelector from './components/ApiKeySelector';
import { BoundingBox, EditorState } from './types';
import { inpaintText, fileToBase64, base64ToFile } from './services/geminiService';

const App: React.FC = () => {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [state, setState] = useState<EditorState>({
    imageSrc: null,
    originalFile: null,
    selection: null,
    inputText: '',
    isProcessing: false,
    resultSrc: null,
  });
  
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // Used to force reset the box in canvas
  const [resetTrigger, setResetTrigger] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        setState(prev => ({
          ...prev,
          imageSrc: `data:${file.type};base64,${base64}`,
          originalFile: file,
          selection: null,
          resultSrc: null,
          inputText: '', // clear prev text
        }));
        setResetTrigger(prev => prev + 1);
      } catch (err) {
        console.error("Error reading file", err);
        alert("Failed to load image.");
      }
    }
  };

  // Wrapped in useCallback to prevent infinite loop in CanvasEditor useEffect
  const handleSelectionChange = useCallback((box: BoundingBox | null) => {
    setState(prev => ({...prev, selection: box}));
  }, []);

  const handleProcess = async () => {
    if (!state.originalFile || !state.inputText || !state.selection) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const resultBase64 = await inpaintText(
        state.originalFile,
        state.selection,
        state.inputText
      );
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        resultSrc: resultBase64
      }));
    } catch (error: any) {
      console.error("Processing failed", error);
      
      // Handle specific error for API Key not found/invalid
      if (error.message && error.message.includes("Requested entity was not found")) {
         alert("API Key session expired or invalid. Please reconnect.");
         const win = window as any;
         if (win.aistudio && win.aistudio.openSelectKey) {
             win.aistudio.openSelectKey();
         }
      } else {
         alert(`Error: ${error.message || "Unknown error occurred"}`);
      }
      
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleDownload = () => {
    if (!state.resultSrc) return;
    const link = document.createElement('a');
    link.href = state.resultSrc;
    link.download = `inpaint-result-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleContinue = async () => {
    if (!state.resultSrc) return;
    
    try {
        // Convert result base64 back to a File for the next API call
        const newFile = await base64ToFile(state.resultSrc, `edited_${Date.now()}.png`);
        
        setState(prev => ({
            ...prev,
            imageSrc: prev.resultSrc, // Becomes the new workspace image
            originalFile: newFile,    // The new file object for the next service call
            resultSrc: null,          // Hide result overlay
            selection: null,          // Reset selection
            inputText: '',            // Reset text input
        }));
        setResetTrigger(prev => prev + 1); // Reset canvas editor
    } catch (error) {
        console.error("Failed to continue editing:", error);
        alert("Could not load the edited image for next round.");
    }
  };

  const handleDiscard = () => {
    setState(prev => ({...prev, resultSrc: null}));
  };

  const confirmReset = () => {
    setState(prev => ({
        ...prev,
        imageSrc: null,
        originalFile: null,
        selection: null,
        inputText: '',
        isProcessing: false,
        resultSrc: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowResetConfirmation(false);
  };

  // Validation
  const isReadyToSubmit = 
      !state.isProcessing && 
      state.inputText.trim().length > 0 && 
      state.selection !== null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans selection:bg-purple-500 selection:text-white">
      <ApiKeySelector onKeySelected={() => setApiKeyReady(true)} />
      
      <nav className="bg-black/50 border-b border-gray-800 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-lg shadow-lg flex items-center justify-center">
                 <span className="font-bold text-black text-xs">AI</span>
              </div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                TextInpaint Pro
              </h1>
           </div>
           
           <div className="flex items-center gap-4">
             {state.imageSrc && (
                <button 
                  onClick={() => setShowResetConfirmation(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors"
                >
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                   </svg>
                   Start Over
                </button>
             )}
           </div>
        </div>
      </nav>

      <main className={`max-w-7xl mx-auto px-4 py-8 transition-opacity duration-500 ${apiKeyReady ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        
        {/* Initial Landing State */}
        {!state.imageSrc && (
          <div className="max-w-4xl mx-auto">
            
            {/* Intro Section */}
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Seamless Text Replacement <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">無縫文字修改專家</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                Replace text in images while perfectly preserving background textures and lighting.
                Powered by Gemini Nano Banana Pro (Gemini 3 Pro Image).
              </p>
            </div>

            {/* Upload Area */}
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/50 hover:bg-gray-900 transition-all duration-300 group cursor-pointer mb-16"
                 onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-gray-800 p-5 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Upload Image / 上傳圖片</h2>
              <p className="text-gray-500 mb-8 text-center max-w-md px-4">
                Supported formats: JPG, PNG <br/>
                <span className="text-xs opacity-70">支援高解析度圖片</span>
              </p>
              <button 
                className="bg-white text-black px-10 py-3 rounded-full font-bold hover:bg-gray-200 transition-all shadow-lg shadow-white/10 transform group-hover:translate-y-[-2px]"
              >
                Select Image
              </button>
            </div>
          </div>
        )}

        {/* Workspace */}
        {state.imageSrc && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Editor Column */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                 {state.resultSrc ? (
                    <>
                        {/* Result Image Area */}
                        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-1 relative overflow-hidden">
                             <img src={state.resultSrc} alt="Result" className="w-full rounded-lg" />
                             <div className="absolute top-4 right-4 bg-black/70 backdrop-blur text-white text-xs px-2 py-1 rounded flex items-center gap-1 border border-green-500/50 z-10">
                                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                 Generated Result
                             </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="bg-gray-800 rounded-xl p-4 flex flex-wrap items-center justify-between border border-gray-700 shadow-xl">
                             <button 
                                onClick={handleDiscard} 
                                className="px-4 py-2 text-red-400 hover:text-red-300 text-sm font-medium hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                             >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                 Discard
                             </button>
                             
                             <div className="flex gap-3">
                                 <button 
                                    onClick={handleDownload} 
                                    className="px-5 py-2 text-white bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
                                 >
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                     Download
                                 </button>
                                 <button 
                                    onClick={handleContinue} 
                                    className="px-5 py-2 text-black bg-yellow-500 hover:bg-yellow-400 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-yellow-500/20"
                                 >
                                     Next Edit
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                 </button>
                             </div>
                        </div>
                    </>
                 ) : (
                    <div className="bg-gray-900/50 rounded-xl border border-gray-800 relative p-1 overflow-hidden min-h-[300px] flex items-center justify-center">
                        <CanvasEditor 
                            imageSrc={state.imageSrc}
                            onSelectionChange={handleSelectionChange}
                            resetSelectionTrigger={resetTrigger}
                        />

                        {state.isProcessing && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
                                <div className="relative w-16 h-16 mb-4">
                                  <div className="absolute inset-0 border-4 border-gray-600 rounded-full"></div>
                                  <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <p className="text-purple-200 font-bold text-lg animate-pulse">
                                    Refining Text...
                                </p>
                            </div>
                        )}
                    </div>
                 )}
              </div>
            </div>

            {/* Controls Column */}
            <div className="space-y-6">
               
               <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-24">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-white">
                          Inpaint Controls
                      </h3>
                      <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-500 border border-gray-700">
                          Nano Banana Pro
                      </span>
                  </div>

                  <div className="space-y-6">
                      
                      {/* Step 1: Selection */}
                      <div className={`transition-colors duration-300 ${state.selection ? 'text-gray-400' : 'text-white'}`}>
                          <div className="flex items-center gap-3 mb-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${state.selection ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'}`}>
                                  {state.selection ? '✓' : '1'}
                              </div>
                              <span className="font-medium">Select Region</span>
                          </div>
                          <p className="text-sm pl-9 text-gray-500">
                              Draw a box around the text you want to replace.
                          </p>
                      </div>

                      {/* Step 2: Prompt */}
                      <div className={`transition-colors duration-300 ${!state.selection ? 'opacity-50' : 'opacity-100'}`}>
                          <div className="flex items-center gap-3 mb-2">
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${state.inputText ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'}`}>
                                 2
                             </div>
                             <span className="font-medium text-white">
                                 Enter Replacement Text
                             </span>
                          </div>
                          <div className="pl-9">
                              <textarea
                                value={state.inputText}
                                onChange={(e) => setState(prev => ({...prev, inputText: e.target.value}))}
                                disabled={!state.selection || state.isProcessing}
                                placeholder={state.selection ? "Type new text..." : "Select a region first..."}
                                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none h-24 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                          </div>
                      </div>

                      {/* Submit */}
                      <div className="pt-4 border-t border-gray-800">
                          <button
                             onClick={handleProcess}
                             disabled={!isReadyToSubmit}
                             className={`w-full py-4 rounded-lg font-bold text-lg shadow-xl transition-all transform ${
                                 isReadyToSubmit 
                                 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-[1.02] active:scale-95' 
                                 : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                             }`}
                          >
                             {state.isProcessing ? 'Processing...' : 'Generate Inpaint'}
                          </button>
                      </div>
                  </div>
               </div>
               
               {/* Tip */}
               <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4 text-sm text-blue-300">
                   <p><strong>Pro Tip:</strong> Ensure your selection box includes a small margin around the text. The Visual Guide system will help the AI align pixels perfectly.</p>
               </div>

            </div>
          </div>
        )}

        {/* Hidden Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </main>

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl transform scale-100 transition-all">
            <div className="flex items-center gap-3 mb-4 text-red-400">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
               <h3 className="text-xl font-bold text-white">Start Over?</h3>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              This will discard all current progress. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-900/20"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
