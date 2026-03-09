import React, { useState } from 'react';
import { X, FileText, Check } from 'lucide-react';

interface BulkInputProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: Record<string, number>) => void;
  provinces: string[];
}

export default function BulkInput({ isOpen, onClose, onApply, provinces }: BulkInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = () => {
    setError(null);
    const lines = text.split('\n');
    const parsedData: Record<string, number> = {};
    let hasError = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Try to split by tab, comma, or multiple spaces
      const parts = line.split(/\t|,|\s{2,}/);
      
      if (parts.length < 2) {
        setError(`Dòng ${i + 1} không đúng định dạng. Vui lòng sử dụng định dạng: Tên tỉnh [tab/phẩy] Giá trị`);
        hasError = true;
        break;
      }

      const rawName = parts[0].trim();
      const rawValue = parts[parts.length - 1].trim().replace(/,/g, ''); // Remove commas from numbers
      const value = Number(rawValue);

      if (isNaN(value)) {
        setError(`Dòng ${i + 1}: Giá trị "${rawValue}" không phải là số hợp lệ.`);
        hasError = true;
        break;
      }

      // Try to match province name
      const matchedProvince = provinces.find(p => 
        p.toLowerCase().includes(rawName.toLowerCase()) || 
        rawName.toLowerCase().includes(p.replace('Tỉnh ', '').replace('Thành phố ', '').toLowerCase())
      );

      if (matchedProvince) {
        parsedData[matchedProvince] = value;
      }
    }

    if (!hasError) {
      onApply(parsedData);
      setText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Nhập dữ liệu hàng loạt
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-100">
            <p className="font-medium mb-1">Hướng dẫn:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dán dữ liệu từ Excel hoặc Google Sheets vào ô bên dưới.</li>
              <li>Định dạng: <strong>Tên tỉnh</strong> (tab hoặc dấu phẩy) <strong>Giá trị</strong></li>
              <li>Hệ thống sẽ tự động nhận diện tên tỉnh gần đúng.</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">Ví dụ:<br/>Hà Nội 1000<br/>Hồ Chí Minh 2000</p>
          </div>

          <textarea 
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows={10}
            placeholder="Hà Nội&#9;1000&#10;Hồ Chí Minh&#9;2000&#10;Đà Nẵng&#9;500"
          />

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleApply}
            disabled={!text.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" />
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
