import React, {
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react';
import '../styles/MessageInput.css';
import ModelSelector, { ModelId } from './ModelSelector';

interface ImagePreview {
    data: string;
    type: string;
    name: string;
}

interface MessageData {
    text: string;
    images: string[];
}

interface MessageInputProps {
    onSend: (message: MessageData, model: ModelId) => void;
    onStop: () => void;
}

interface MessageInputRef {
    resetButton: () => void;
    focus: () => void;
}

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({ onSend, onStop }, ref) => {
    const [input, setInput] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [selectedModel, setSelectedModel] = useState<ModelId>('claude-3-5-sonnet');
    const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        resetButton() {
            setIsProcessing(false);
            setInput('');
            setImagePreviews([]);
        },
        focus() {
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        },
    }));

    const addImageToPreview = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreviews(prev => [...prev, {
                data: reader.result as string,
                type: file.type,
                name: file.name || 'uploaded-image.png'
            }]);
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        
        if (!items) return;
        
        Array.from(items).forEach(item => {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                
                const file = item.getAsFile();
                if (!file) return;
                
                addImageToPreview(file);
            }
        });
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                addImageToPreview(file);
            }
        });
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                addImageToPreview(file);
            }
        });
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = () => {
        if (input.trim() || imagePreviews.length > 0) {
            try {
                const message = {
                    text: input.trim(),
                    images: imagePreviews.map(img => img.data)
                };
                onSend(message, selectedModel);
                setIsProcessing(true);
                setInput('');
                setImagePreviews([]);
            } catch (error) {
                console.error('Error sending message:', error);
                setIsProcessing(false);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
            {imagePreviews.length > 0 && (
                <div className="image-previews">
                    {imagePreviews.map((preview, index) => (
                        <div key={index} className="image-preview">
                            <img src={preview.data} alt={`Preview ${index + 1}`} />
                            <button className="remove-image" onClick={() => removeImage(index)}>
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
                    ))}
                </div>
            )}
            <div className="input-container" onDrop={handleDrop} onDragOver={handleDragOver}>
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Type your message here, paste, or drag & drop images..."
                    onKeyDown={handleKeyDown}
                    rows={1}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                />
                <button
                    className="upload-button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload images"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                </button>
                <button
                    onClick={isProcessing ? onStop : handleSend}
                    disabled={(!input.trim() && imagePreviews.length === 0) && !isProcessing}
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