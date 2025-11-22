import React, { useState, useEffect } from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);

  const checkKey = async () => {
    const win = window as any;
    if (win.aistudio && win.aistudio.hasSelectedApiKey) {
      const selected = await win.aistudio.hasSelectedApiKey();
      setHasKey(selected);
      if (selected) {
        onKeySelected();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    const win = window as any;
    if (win.aistudio && win.aistudio.openSelectKey) {
      await win.aistudio.openSelectKey();
      // Assume success immediately per instructions to avoid race conditions
      setHasKey(true);
      onKeySelected();
    }
  };

  if (loading || hasKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Google Cloud</h2>
        <p className="text-gray-400 mb-6">
          To use the high-fidelity <strong>Nano Banana Pro</strong> (Gemini 3 Pro Image) model, you must connect a billing-enabled project.
        </p>
        
        <button
          onClick={handleConnect}
          className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-lg"
        >
          Select API Key
        </button>

        <div className="mt-4 text-xs text-gray-500">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-gray-300">
            Learn more about billing
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySelector;