import React from 'react';
import '../styles/ModelSelector.css';

const ModelSelector = ({ selectedModel, onModelChange }) => {
  const AVAILABLE_MODELS = {
    'claude-3.5-sonnet': 'Claude 3.5 Sonnet',
    'gpt-4o': 'GPT-4o',
    'o1-preview': 'O1 Preview',
    'o1-mini': 'O1 Mini',
  };

  return (
    <div className="model-selector">
      <select value={selectedModel} onChange={(e) => onModelChange(e.target.value)}>
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