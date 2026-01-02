import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Palette, Check, Settings, X } from 'lucide-react';

interface ColorPaletteSelectorProps {
  onClose?: () => void;
  showAsModal?: boolean;
}

const ColorPaletteSelector: React.FC<ColorPaletteSelectorProps> = ({
  onClose,
  showAsModal = false,
}) => {
  const { currentPalette, setPalette, availablePalettes } = useTheme();
  const [selectedPalette, setSelectedPalette] = useState(currentPalette.id);

  const handlePaletteChange = (paletteId: string) => {
    setSelectedPalette(paletteId);
    setPalette(paletteId);
  };

  const PalettePreview = ({ palette }: { palette: any }) => (
    <div className="flex space-x-1">
      <div
        className="w-4 h-4 rounded-full border border-gray-300"
        style={{ backgroundColor: palette.colors.primary }}
      />
      <div
        className="w-4 h-4 rounded-full border border-gray-300"
        style={{ backgroundColor: palette.colors.secondary }}
      />
      <div
        className="w-4 h-4 rounded-full border border-gray-300"
        style={{ backgroundColor: palette.colors.accent }}
      />
      <div
        className="w-4 h-4 rounded-full border border-gray-300"
        style={{ backgroundColor: palette.colors.success }}
      />
    </div>
  );

  const content = (
    <div className={`${showAsModal ? 'bg-white rounded-lg shadow-xl border' : ''} p-6`}>
      {showAsModal && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Palette className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Paleta de Cores</h3>
              <p className="text-sm text-gray-600">Escolha a paleta de cores do sistema</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {availablePalettes.map((palette) => (
          <div
            key={palette.id}
            onClick={() => handlePaletteChange(palette.id)}
            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
              selectedPalette === palette.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{palette.name}</h4>
                  {selectedPalette === palette.id && (
                    <div className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{palette.description}</p>
                <PalettePreview palette={palette} />
              </div>
            </div>

            {/* Preview das cores principais */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="text-center">
                <div
                  className="w-full h-8 rounded border border-gray-300 mb-1"
                  style={{ backgroundColor: palette.colors.primary }}
                />
                <span className="text-xs text-gray-500">Primária</span>
              </div>
              <div className="text-center">
                <div
                  className="w-full h-8 rounded border border-gray-300 mb-1"
                  style={{ backgroundColor: palette.colors.secondary }}
                />
                <span className="text-xs text-gray-500">Secundária</span>
              </div>
              <div className="text-center">
                <div
                  className="w-full h-8 rounded border border-gray-300 mb-1"
                  style={{ backgroundColor: palette.colors.accent }}
                />
                <span className="text-xs text-gray-500">Destaque</span>
              </div>
              <div className="text-center">
                <div
                  className="w-full h-8 rounded border border-gray-300 mb-1"
                  style={{ backgroundColor: palette.colors.success }}
                />
                <span className="text-xs text-gray-500">Sucesso</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!showAsModal && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Paleta Atual</span>
          </div>
          <p className="text-sm text-blue-700">{currentPalette.name}</p>
          <p className="text-xs text-blue-600">{currentPalette.description}</p>
        </div>
      )}
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">{content}</div>
      </div>
    );
  }

  return content;
};

export default ColorPaletteSelector;
