
// src/features/search/components/ModelSelection/ModelSelectionPanel.tsx
import React from 'react';
import { Settings, Brain, Eye, Zap } from 'lucide-react';
import type { ModelSelection } from '../../types';

interface ModelSelectionPanelProps {
  modelSelection: ModelSelection;
  onModelSelectionChange: (selection: ModelSelection) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ModelSelectionPanel: React.FC<ModelSelectionPanelProps> = ({
  modelSelection,
  onModelSelectionChange,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const handleModelToggle = (model: keyof ModelSelection) => {
    onModelSelectionChange({
      ...modelSelection,
      [model]: !modelSelection[model]
    });
  };

  const ModelToggle = ({ 
    model, 
    label, 
    icon: Icon, 
    description 
  }: { 
    model: keyof ModelSelection; 
    label: string; 
    icon: React.ComponentType<any>;
    description: string;
  }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-slate-600" />
        <div>
          <div className="font-medium text-sm text-slate-700">{label}</div>
          <div className="text-xs text-slate-500">{description}</div>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={modelSelection[model]}
          onChange={() => handleModelToggle(model)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  if (isCollapsed) {
    return (
      <div className="mb-4">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between p-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">AI Models</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">
              {Object.values(modelSelection).filter(Boolean).length}/3 selected
            </span>
            <span className="text-slate-400">▼</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">AI Models</h3>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            ▲ Collapse
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        <ModelToggle
          model="use_clip"
          label="CLIP"
          icon={Eye}
          description="Vision-language understanding"
        />
        <ModelToggle
          model="use_siglip2"
          label="SigLIP2"
          icon={Zap}
          description="Advanced image-text matching"
        />
        <ModelToggle
          model="use_beit3"
          label="BEiT3"
          icon={Brain}
          description="Multimodal transformer"
        />
      </div>

      <div className="mt-3 p-2 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          Select multiple models for better accuracy. At least one model must be enabled.
        </p>
      </div>
    </div>
  );
};

export default ModelSelectionPanel;
