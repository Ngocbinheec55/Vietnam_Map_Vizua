import React, { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  Sphere
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { geoCentroid } from 'd3-geo';
import { Plus, Minus } from 'lucide-react';

interface ProvinceData {
  name: string;
  value: number | '';
  showLabel?: boolean;
}

interface MapChartProps {
  geoData: any;
  data: ProvinceData[];
  baseColor: string;
  maxValue: number;
  parameterName: string;
  unit: string;
  nameKey?: string;
  onProvinceClick?: (provinceName: string) => void;
  showDataLabels?: boolean;
}

export default function MapChart({ geoData, data, baseColor, maxValue, parameterName, unit, nameKey = 'Ten', onProvinceClick, showDataLabels = false }: MapChartProps) {
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ coordinates: [106, 16] as [number, number], zoom: 1 });

  // Create a color scale from white to the base color
  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, maxValue === 0 ? 1 : maxValue])
      .range(["#ffffff", baseColor]);
  }, [baseColor, maxValue]);

  const handleMouseEnter = (geo: any, evt: React.MouseEvent) => {
    const provinceName = geo.properties[nameKey];
    if (!provinceName) return;
    
    const provinceData = data.find(p => p.name === provinceName);
    const value = provinceData?.value;
    
    let content = `${provinceName}`;
    if (value !== undefined && value !== '') {
      content += `\n${parameterName}: ${value.toLocaleString()} ${unit}`;
    } else {
      content += `\nChưa có dữ liệu`;
    }
    
    setTooltipContent(content);
    setTooltipPos({ x: evt.clientX, y: evt.clientY });
  };

  const handleMouseLeave = () => {
    setTooltipContent('');
  };

  const handleMouseMove = (evt: React.MouseEvent) => {
    setTooltipPos({ x: evt.clientX, y: evt.clientY });
  };

  const handleZoomIn = () => {
    if (position.zoom >= 8) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (position: { coordinates: [number, number], zoom: number }) => {
    setPosition(position);
  };

  return (
    <div className="w-full h-full relative bg-[#e0f2fe]" onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 2200,
          center: [106, 16] // Center of Vietnam roughly
        }}
        className="w-full h-full"
      >
        <ZoomableGroup 
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          minZoom={1} 
          maxZoom={8}
        >
          {/* Surrounding Countries */}
          <Geographies geography="/world.json">
            {({ geographies }) =>
              geographies.map((geo) => {
                // Skip Vietnam as we have a detailed map for it
                if (geo.properties.name === 'Vietnam') return null;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#f3f4f6" // Faint gray for surrounding countries
                    stroke="#d1d5db"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none" },
                      pressed: { outline: "none" }
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Vietnam Provinces */}
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const provinceName = geo.properties[nameKey];
                const provinceData = data.find(p => p.name === provinceName);
                const value = provinceData?.value;
                
                // Default to white if no value
                const fill = (value !== undefined && value !== '') 
                  ? colorScale(value as number) 
                  : "#ffffff";

                return (
                  <React.Fragment key={geo.rsmKey}>
                    <Geography
                      geography={geo}
                      onMouseEnter={(e) => handleMouseEnter(geo, e)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => onProvinceClick && onProvinceClick(provinceName)}
                      style={{
                        default: {
                          fill,
                          stroke: "#9ca3af", // gray-400 for better contrast against white
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: "#fcd34d", // amber-300 for hover
                          stroke: "#6b7280",
                          strokeWidth: 1,
                          outline: "none",
                          cursor: "pointer"
                        },
                        pressed: {
                          fill: "#fbbf24",
                          stroke: "#4b5563",
                          strokeWidth: 1,
                          outline: "none",
                        }
                      }}
                    />
                    {showDataLabels && provinceData?.showLabel !== false && (
                      <Marker coordinates={geoCentroid(geo)}>
                        <text
                          textAnchor="middle"
                          y={value !== undefined && value !== '' ? -1.5 : 1}
                          style={{
                            fontFamily: "sans-serif",
                            fontSize: "3.5px",
                            fill: "#374151",
                            fontWeight: 600,
                            pointerEvents: "none",
                            textShadow: "1px 1px 0 #fff, -1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff"
                          }}
                        >
                          {provinceName ? provinceName.replace('Tỉnh ', '').replace('Thành phố ', 'TP ') : ''}
                        </text>
                        {value !== undefined && value !== '' && (
                          <text
                            textAnchor="middle"
                            y={3}
                            style={{
                              fontFamily: "sans-serif",
                              fontSize: "3.5px",
                              fill: "#ef4444",
                              fontWeight: 700,
                              pointerEvents: "none",
                              textShadow: "1px 1px 0 #fff, -1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff"
                            }}
                          >
                            {value.toLocaleString()}
                          </text>
                        )}
                      </Marker>
                    )}
                  </React.Fragment>
                );
              })
            }
          </Geographies>

          {/* Hoang Sa Archipelago */}
          <Marker coordinates={[112.0, 16.5]}>
            <circle r={2} fill="#ef4444" stroke="#fff" strokeWidth={0.5} />
            <text
              textAnchor="middle"
              y={-5}
              style={{ fontFamily: "sans-serif", fontSize: "6px", fill: "#4b5563", fontWeight: "bold" }}
            >
              Quần đảo Hoàng Sa
            </text>
            <text
              textAnchor="middle"
              y={2}
              style={{ fontFamily: "sans-serif", fontSize: "4px", fill: "#6b7280" }}
            >
              (Đà Nẵng)
            </text>
          </Marker>

          {/* Truong Sa Archipelago */}
          <Marker coordinates={[114.0, 10.0]}>
            <circle r={2} fill="#ef4444" stroke="#fff" strokeWidth={0.5} />
            <text
              textAnchor="middle"
              y={-5}
              style={{ fontFamily: "sans-serif", fontSize: "6px", fill: "#4b5563", fontWeight: "bold" }}
            >
              Quần đảo Trường Sa
            </text>
            <text
              textAnchor="middle"
              y={2}
              style={{ fontFamily: "sans-serif", fontSize: "4px", fill: "#6b7280" }}
            >
              (Khánh Hòa)
            </text>
          </Marker>
        </ZoomableGroup>
      </ComposableMap>

      {/* Custom Tooltip */}
      {tooltipContent && (
        <div 
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-lg text-sm pointer-events-none whitespace-pre-line"
          style={{ 
            left: tooltipPos.x + 15, 
            top: tooltipPos.y + 15,
            transform: 'translate(0, 0)'
          }}
        >
          {tooltipContent}
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-8 right-8 flex flex-col gap-2 bg-white/90 p-2 rounded-lg shadow-md border border-gray-200">
        <button 
          onClick={handleZoomIn}
          className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded transition-colors"
          title="Phóng to"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="w-full h-px bg-gray-200"></div>
        <button 
          onClick={handleZoomOut}
          className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded transition-colors"
          title="Thu nhỏ"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-8 left-8 bg-white/90 p-4 rounded-lg shadow-md border border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">{parameterName}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">0</span>
          <div 
            className="w-32 h-3 rounded"
            style={{
              background: `linear-gradient(to right, #ffffff, ${baseColor})`,
              border: '1px solid #e5e7eb'
            }}
          />
          <span className="text-xs text-gray-500">{maxValue.toLocaleString()}</span>
        </div>
        <div className="text-xs text-gray-400 mt-1 text-right">{unit}</div>
      </div>
    </div>
  );
}
