import React from 'react';
import '../styles/ModelSelector.css';

export type ModelId = 'claude-3-5-sonnet' | 'gpt-4o' | 'o1-preview' | 'o1-mini';

interface ModelSelectorProps {
    selectedModel: ModelId;
    onModelChange: (model: ModelId) => void;
}

// Model names mapping with strict types
const AVAILABLE_MODELS: Record<ModelId, string> = {
  'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
  'gpt-4o': 'GPT-4o',
  'o1-preview': 'o1 Preview',
  'o1-mini': 'o1 Mini',
};

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  return (
    <div className="model-selector">
      <select 
        value={selectedModel} 
        onChange={(e) => onModelChange(e.target.value as ModelId)}
      >
        {Object.entries(AVAILABLE_MODELS).map(([modelId, modelName]) => (
          <option key={modelId} value={modelId}>
            {modelName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector; 