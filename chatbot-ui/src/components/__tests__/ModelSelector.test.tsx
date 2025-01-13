/// <reference types="jest" />
import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';
import ModelSelector from '../ModelSelector';

describe('ModelSelector', () => {
  const mockOnModelChange = jest.fn();

  beforeEach(() => {
    mockOnModelChange.mockClear();
  });

  it('renders with default selected model', () => {
    render(
      <ModelSelector
        selectedModel="claude-3-5-sonnet"
        onModelChange={mockOnModelChange}
      />
    );
    
    expect(screen.getByRole('combobox')).toHaveValue('claude-3-5-sonnet');
  });

  it('displays all available models', () => {
    render(
      <ModelSelector
        selectedModel="claude-3-5-sonnet"
        onModelChange={mockOnModelChange}
      />
    );

    expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument();
    expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    expect(screen.getByText('o1 Preview')).toBeInTheDocument();
    expect(screen.getByText('o1 Mini')).toBeInTheDocument();
  });

  it('calls onModelChange when selection changes', () => {
    render(
      <ModelSelector
        selectedModel="claude-3-5-sonnet"
        onModelChange={mockOnModelChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'gpt-4o' } });

    expect(mockOnModelChange).toHaveBeenCalledWith('gpt-4o');
    expect(mockOnModelChange).toHaveBeenCalledTimes(1);
  });
}); 