import React from 'react';
import '../styles/ModelSelector.css';

export type ModelId = 'claude-3-5-sonnet' | 'DeepSeek-R1-mga' | 'deepseek-r1-distill-llama-70b' | 'Deepseek-r1' | 'o3-mini' | 'gemini-2.0-flash-001' | 'gemini-1.5-pro-002' | 'gpt-4o' | 'o1-preview';

interface ModelSelectorProps {
    selectedModel: ModelId;
    onModelChange: (model: ModelId) => void;
}

// Model names mapping with strict types
const AVAILABLE_MODELS: Record<ModelId, string> = {
  'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
  'DeepSeek-R1-mga': 'DeepSeek R1',
  'deepseek-r1-distill-llama-70b': 'DeepSeek R1 70B Groq',
  'Deepseek-r1': 'DeepSeek R1 Github',
  'o3-mini': 'o3 Mini',
  'gemini-2.0-flash-001': 'Gemini 2.0 Flash',
  'gemini-1.5-pro-002': 'Gemini 1.5 Pro',
  'gpt-4o': 'GPT-4o',
  'o1-preview': 'o1 Preview',
  
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