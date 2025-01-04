// src/components/MessageInput.js
import React, {
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
  } from 'react';
  import '../styles/MessageInput.css';
  import ModelSelector from './ModelSelector';
  
  const MessageInput = forwardRef(({ onSend, onStop }, ref) => {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet');
    const [imagePreview, setImagePreview] = useState(null);
    const textareaRef = useRef(null);
  
    useImperativeHandle(ref, () => ({
      resetButton() {
        setIsProcessing(false);
        setInput('');
        setImagePreview(null);
      },
      focus() {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      },
    }));
  
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          
          const file = item.getAsFile();
          if (!file) continue;

          // Convert image to base64
          const reader = new FileReader();
          reader.onload = () => {
            setImagePreview({
              data: reader.result,
              type: file.type,
              name: file.name || 'pasted-image.png'
            });
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };

    const removeImage = () => {
      setImagePreview(null);
    };
  
    const handleSend = () => {
      if (input.trim() || imagePreview) {
        try {
          const message = {
            text: input.trim(),
            image: imagePreview?.data
          };
          onSend(message, selectedModel);
          setIsProcessing(true);
          setInput('');
          setImagePreview(null);
        } catch (error) {
          console.error('Error sending message:', error);
          setIsProcessing(false);
        }
      }
    };
  
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };
  
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [input]);
  
    return (
      <div className="message-input">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview.data} alt="Preview" />
            <button className="remove-image" onClick={removeImage}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            placeholder="Type your message here or paste an image..."
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            onClick={isProcessing ? onStop : handleSend}
            disabled={(!input.trim() && !imagePreview) && !isProcessing}
          >
            {isProcessing ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                width="24"
                viewBox="0 0 24 24"
                fill="#FF3B30"
              >
                <path d="M19 13H5v-2h14v2z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                width="24"
                viewBox="0 0 24 24"
                fill="#007AFF"
              >
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  });
  
  export default MessageInput;