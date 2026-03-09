import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Image as ImageIcon, Loader2, Wand2, X } from 'lucide-react';

interface ImageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageGenerator({ isOpen, onClose }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Check if API key is selected
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      }

      // Initialize AI with the key from process.env (injected by platform)
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            { text: prompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${base64EncodeString}`;
          setGeneratedImage(imageUrl);
          foundImage = true;
          break;
        }
      }
      
      if (!foundImage) {
        setError("Không tìm thấy hình ảnh trong phản hồi.");
      }
    } catch (err: any) {
      console.error("Error generating image:", err);
      // If error is about missing entity, prompt key selection again
      if (err.message && err.message.includes("Requested entity was not found")) {
        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
          // @ts-ignore
          await window.aistudio.openSelectKey();
          setError("Vui lòng chọn API key và thử lại.");
        } else {
          setError(err.message || "Đã xảy ra lỗi khi tạo ảnh.");
        }
      } else {
        setError(err.message || "Đã xảy ra lỗi khi tạo ảnh.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            Tạo ảnh bằng AI (Nano Banana 2)
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả hình ảnh (Prompt)</label>
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
              placeholder="VD: Một bản đồ Việt Nam được vẽ bằng màu nước..."
            />
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tạo ảnh...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                Tạo ảnh
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}

          {generatedImage && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Kết quả:</h3>
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="max-w-full max-h-[400px] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
