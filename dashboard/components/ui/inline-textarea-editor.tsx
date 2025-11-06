'use client';

import * as React from 'react';
import { Textarea } from './textarea';

interface InlineTextareaEditorProps {
  value: string;
  onSubmit: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  autoSaveDelay?: number;
}

/**
 * Inline textarea editor that looks like text until clicked.
 * Features auto-save after typing stops.
 */
export function InlineTextareaEditor({
  value,
  onSubmit,
  placeholder,
  className,
  minHeight = 'min-h-20',
  autoSaveDelay = 1000,
}: InlineTextareaEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor to end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = React.useCallback(() => {
    if (localValue !== value) {
      onSubmit(localValue);
    }
    setIsEditing(false);
  }, [localValue, value, onSubmit]);

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after delay
    saveTimeoutRef.current = setTimeout(() => {
      if (newValue !== value) {
        onSubmit(newValue);
      }
    }, autoSaveDelay);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`${minHeight} w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text hover:border-ring transition-colors whitespace-pre-wrap ${className || ''}`}
      >
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${minHeight} resize-y`}
      />
    </div>
  );
}
