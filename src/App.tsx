import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Map as MapIcon, Settings, BarChart2, Plus, Trash2, Wand2, Download, Calendar, Loader2, FileText, Upload } from 'lucide-react';
import Select from 'react-select';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import MapChart from './components/MapChart';
import ImageGenerator from './components/ImageGenerator';
import BulkInput from './components/BulkInput';

interface ProvinceData {
  name: string;
  value: number | '';
  showLabel?: boolean;
}

export default function App() {
  const [title, setTitle] = useState('Bản đồ Dân số Việt Nam');
  const [titleFontSize, setTitleFontSize] = useState(30);
  const [parameterName, setParameterName] = useState('Dân số');
  const [paramFontSize, setParamFontSize] = useState(18);
  const [unit, setUnit] = useState('người');
  const [baseColor, setBaseColor] = useState('#3b82f6'); // Default blue
  const [showDataLabels, setShowDataLabels] = useState(true);
  
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearlyData, setYearlyData] = useState<Record<number, ProvinceData[]>>({});
  const [baseProvinces, setBaseProvinces] = useState<ProvinceData[]>([]);
  const [geoData, setGeoData] = useState<any>(null);
  const [nameKey, setNameKey] = useState<string>('Ten');

  const mapRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Form state
  const [selectedProvince, setSelectedProvince] = useState<{value: string, label: string} | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [isBulkInputOpen, setIsBulkInputOpen] = useState(false);

  // Image Generator state
  const [isImageGenOpen, setIsImageGenOpen] = useState(false);

  useEffect(() => {
    fetch('/vietnam.json')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        const provinceNames = data.features
          .map((f: any) => f.properties.Ten)
          .filter(Boolean)
          .sort((a: string, b: string) => a.localeCompare(b, 'vi'));
        
        const initialProvinces = provinceNames.map((name: string) => ({ name, value: '', showLabel: true }));
        setBaseProvinces(initialProvinces);
        setYearlyData({ [new Date().getFullYear()]: initialProvinces });
      })
      .catch(err => console.error("Error loading GeoJSON:", err));
  }, []);

  const provinces = useMemo(() => {
    return yearlyData[selectedYear] || baseProvinces;
  }, [yearlyData, selectedYear, baseProvinces]);

  const provinceOptions = useMemo(() => {
    return provinces.map(p => ({
      value: p.name,
      label: p.name ? p.name.replace('Tỉnh ', '').replace('Thành phố ', 'TP ') : ''
    }));
  }, [provinces]);

  const handleUpdateValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvince) return;
    
    const numValue = inputValue === '' ? '' : Number(inputValue);
    
    setYearlyData(prev => {
      const currentYearData = prev[selectedYear] || baseProvinces;
      return {
        ...prev,
        [selectedYear]: currentYearData.map(p => 
          p.name === selectedProvince.value ? { ...p, value: numValue } : p
        )
      };
    });
    
    // Reset form
    setSelectedProvince(null);
    setInputValue('');
  };

  const handleRemoveValue = (name: string) => {
    setYearlyData(prev => {
      const currentYearData = prev[selectedYear] || baseProvinces;
      return {
        ...prev,
        [selectedYear]: currentYearData.map(p => 
          p.name === name ? { ...p, value: '' } : p
        )
      };
    });
  };

  const handleToggleLabel = (name: string, show: boolean) => {
    setYearlyData(prev => {
      const currentYearData = prev[selectedYear] || baseProvinces;
      return {
        ...prev,
        [selectedYear]: currentYearData.map(p => 
          p.name === name ? { ...p, showLabel: show } : p
        )
      };
    });
  };

  const handleBulkApply = (data: Record<string, number>) => {
    setYearlyData(prev => {
      const currentYearData = prev[selectedYear] || baseProvinces;
      return {
        ...prev,
        [selectedYear]: currentYearData.map(p => {
          if (data[p.name] !== undefined) {
            return { ...p, value: data[p.name] };
          }
          return p;
        })
      };
    });
  };

  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    if (!mapRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(mapRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        pdf.save(`vietnam-map-${selectedYear}.pdf`);
      } else {
        const imgData = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 1.0);
        const link = document.createElement('a');
        link.download = `vietnam-map-${selectedYear}.${format}`;
        link.href = imgData;
        link.click();
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data && data.features) {
          setGeoData(data);
          
          // Try to find the name property in the features
          // Usually it's properties.Ten, properties.name, properties.NAME, etc.
          const firstFeature = data.features[0];
          let nameKey = 'Ten';
          if (firstFeature && firstFeature.properties) {
            const props = firstFeature.properties;
            if (!props.Ten) {
              if (props.name) nameKey = 'name';
              else if (props.NAME) nameKey = 'NAME';
              else if (props.Name) nameKey = 'Name';
              else if (props.ten_tinh) nameKey = 'ten_tinh';
              else {
                // Just pick the first string property
                const stringProps = Object.keys(props).filter(k => typeof props[k] === 'string');
                if (stringProps.length > 0) nameKey = stringProps[0];
              }
            }
          }

          const provinceNames = data.features
            .map((f: any) => f.properties[nameKey])
            .filter(Boolean)
            .sort((a: string, b: string) => a.localeCompare(b, 'vi'));
          
          const initialProvinces: ProvinceData[] = provinceNames.map((name: string) => ({
            name,
            value: ''
          }));
          
          setNameKey(nameKey);
          setBaseProvinces(initialProvinces);
          setYearlyData({ [selectedYear]: initialProvinces });
        } else {
          alert("File JSON không đúng định dạng GeoJSON (thiếu features).");
        }
      } catch (err) {
        console.error("Error parsing JSON file:", err);
        alert("Lỗi khi đọc file JSON. Vui lòng kiểm tra lại định dạng.");
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (e.target) e.target.value = '';
  };

  const maxVal = useMemo(() => {
    const vals = provinces.map(p => p.value).filter(v => typeof v === 'number') as number[];
    return vals.length > 0 ? Math.max(...vals) : 100;
  }, [provinces]);

  const inputtedProvinces = useMemo(() => {
    return provinces.filter(p => p.value !== '');
  }, [provinces]);

  const handleProvinceClick = (provinceName: string) => {
    const option = provinceOptions.find(opt => opt.value === provinceName);
    if (option) {
      setSelectedProvince(option);
      const existingData = provinces.find(p => p.name === provinceName);
      setInputValue(existingData?.value !== '' && existingData?.value !== undefined ? String(existingData.value) : '');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MapIcon className="w-6 h-6 text-blue-600" />
              Vietnam Map Viz
            </h1>
            <div className="flex gap-2">
              <label 
                className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                title="Tải lên file GeoJSON"
              >
                <Upload className="w-5 h-5" />
                <input 
                  type="file" 
                  accept=".json,application/json" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </label>
              <button 
                onClick={() => setIsImageGenOpen(true)}
                className="p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                title="Tạo ảnh AI (Nano Banana 2)"
              >
                <Wand2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề biểu đồ</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Bản đồ Dân số..."
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cỡ chữ</label>
                <input 
                  type="number" 
                  value={titleFontSize}
                  onChange={e => setTitleFontSize(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="10"
                  max="72"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thông số</label>
                <input 
                  type="text" 
                  value={parameterName}
                  onChange={e => setParameterName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Dân số"
                />
              </div>
              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                <input 
                  type="text" 
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: người"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cỡ chữ</label>
                <input 
                  type="number" 
                  value={paramFontSize}
                  onChange={e => setParamFontSize(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="10"
                  max="48"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Năm dữ liệu
                </label>
                <input 
                  type="number" 
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: 2024"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu chủ đạo</label>
                <div className="flex items-center gap-3 h-[42px]">
                  <input 
                    type="color" 
                    value={baseColor}
                    onChange={e => setBaseColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-sm text-gray-500 uppercase">{baseColor}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="showDataLabels"
                checked={showDataLabels}
                onChange={e => setShowDataLabels(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="showDataLabels" className="text-sm font-medium text-gray-700 cursor-pointer">
                Hiển thị dữ liệu trên bản đồ
              </label>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Download className="w-4 h-4" /> Xuất bản đồ
              </label>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleExport('png')}
                  disabled={isExporting || !geoData}
                  className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded border border-gray-300 transition-colors disabled:opacity-50"
                >
                  PNG
                </button>
                <button 
                  onClick={() => handleExport('jpg')}
                  disabled={isExporting || !geoData}
                  className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded border border-gray-300 transition-colors disabled:opacity-50"
                >
                  JPG
                </button>
                <button 
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting || !geoData}
                  className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded border border-gray-300 transition-colors disabled:opacity-50"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Nhập dữ liệu tỉnh thành</h2>
            <button 
              onClick={() => setIsBulkInputOpen(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              Nhập hàng loạt
            </button>
          </div>
          <form onSubmit={handleUpdateValue} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chọn tỉnh thành</label>
              <Select
                value={selectedProvince}
                onChange={setSelectedProvince}
                options={provinceOptions}
                placeholder="Gõ để tìm tỉnh..."
                noOptionsMessage={() => "Không tìm thấy"}
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Giá trị ({unit})</label>
                <input 
                  type="number" 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Nhập số..."
                  required
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit"
                  disabled={!selectedProvince || inputValue === ''}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1 h-[38px]"
                >
                  <Plus className="w-4 h-4" />
                  Thêm
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Danh sách tỉnh thành ({provinces.filter(p => p.showLabel !== false).length}/63 hiển thị)
          </h3>
          <div className="space-y-2">
            {provinces.map(province => (
              <div key={province.name} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    checked={province.showLabel !== false}
                    onChange={(e) => handleToggleLabel(province.name, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    title="Hiển thị trên bản đồ"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">
                      {province.name ? province.name.replace('Tỉnh ', '').replace('Thành phố ', 'TP ') : ''}
                    </span>
                    <span className="text-xs text-gray-500">
                      {province.value !== '' ? `${Number(province.value).toLocaleString()} ${unit}` : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                </div>
                {province.value !== '' && (
                  <button 
                    onClick={() => handleRemoveValue(province.name)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Xóa dữ liệu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Map */}
      <div className="flex-1 flex flex-col relative bg-white overflow-hidden">
        {isExporting && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center text-blue-600">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-medium">Đang xuất bản đồ...</p>
            </div>
          </div>
        )}
        
        <div ref={mapRef} id="map-export-area" className="w-full h-full relative bg-white flex flex-col">
          <div className="absolute top-8 left-0 right-0 text-center z-10 pointer-events-none">
            <h2 
              className="font-bold text-gray-800 drop-shadow-sm"
              style={{ fontSize: `${titleFontSize}px`, lineHeight: 1.2 }}
            >
              {title}
            </h2>
            {parameterName && (
              <p 
                className="text-gray-600 mt-2 font-medium"
                style={{ fontSize: `${paramFontSize}px` }}
              >
                {parameterName} {unit ? `(${unit})` : ''} - Năm {selectedYear}
              </p>
            )}
          </div>
          
          <div className="flex-1 w-full h-full flex items-center justify-center p-8">
            {geoData ? (
              <MapChart 
                geoData={geoData} 
                data={provinces} 
                baseColor={baseColor} 
                maxValue={maxVal}
                parameterName={parameterName}
                unit={unit}
                nameKey={nameKey}
                onProvinceClick={handleProvinceClick}
                showDataLabels={showDataLabels}
              />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p>Đang tải bản đồ...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Generator Modal */}
      {isImageGenOpen && (
        <ImageGenerator isOpen={isImageGenOpen} onClose={() => setIsImageGenOpen(false)} />
      )}

      {/* Bulk Input Modal */}
      {isBulkInputOpen && (
        <BulkInput 
          isOpen={isBulkInputOpen} 
          onClose={() => setIsBulkInputOpen(false)} 
          onApply={handleBulkApply}
          provinces={baseProvinces.map(p => p.name)}
        />
      )}
    </div>
  );
}

