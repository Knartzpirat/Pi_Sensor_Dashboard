'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';

export type Tag = {
  id: string;
  name: string;
  color?: string;
};

interface TagsInputProps {
  value: Tag[];
  onChange: (tags: Tag[]) => void;
  suggestions?: Tag[];
  placeholder?: string;
  maxTags?: number;
  allowCreate?: boolean;
  className?: string;
}

export function TagsInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Add tags...',
  maxTags,
  allowCreate = true,
  className,
}: TagsInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleUnselect = React.useCallback(
    (tag: Tag) => {
      onChange(value.filter((t) => t.id !== tag.id));
    },
    [value, onChange]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '') {
            const newValue = [...value];
            newValue.pop();
            onChange(newValue);
          }
        }
        // This is not a default behavior of the <input /> field
        if (e.key === 'Escape') {
          input.blur();
        }
      }
    },
    [value, onChange]
  );

  const selectTag = React.useCallback(
    (tag: Tag) => {
      if (maxTags && value.length >= maxTags) {
        return;
      }

      // Check if tag already exists
      if (value.some((t) => t.id === tag.id)) {
        return;
      }

      onChange([...value, tag]);
      setInputValue('');
    },
    [value, onChange, maxTags]
  );

  const createTag = React.useCallback(
    (name: string) => {
      if (!allowCreate) return;
      if (maxTags && value.length >= maxTags) return;

      const trimmedName = name.trim();
      if (!trimmedName) return;

      // Check if tag with this name already exists in value or suggestions
      const existingTag =
        value.find((t) => t.name.toLowerCase() === trimmedName.toLowerCase()) ||
        suggestions.find((t) => t.name.toLowerCase() === trimmedName.toLowerCase());

      if (existingTag) {
        // If it exists in suggestions but not in value, select it
        if (!value.some((t) => t.id === existingTag.id)) {
          selectTag(existingTag);
        }
        return;
      }

      // Create new tag
      const newTag: Tag = {
        id: `new-${Date.now()}-${Math.random()}`,
        name: trimmedName,
      };

      onChange([...value, newTag]);
      setInputValue('');
    },
    [value, suggestions, onChange, selectTag, allowCreate, maxTags]
  );

  const handleInputKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        if (inputValue.trim()) {
          createTag(inputValue);
        }
      }
    },
    [inputValue, createTag]
  );

  // Filter suggestions based on input
  const filteredSuggestions = React.useMemo(() => {
    const selected = new Set(value.map((t) => t.id));
    return suggestions
      .filter((tag) => !selected.has(tag.id))
      .filter((tag) => tag.name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [suggestions, value, inputValue]);

  const showSuggestions = open && (filteredSuggestions.length > 0 || (allowCreate && inputValue.trim()));
  const isMaxTagsReached = maxTags !== undefined && value.length >= maxTags;

  return (
    <Command onKeyDown={handleKeyDown} className={cn('overflow-visible bg-transparent', className)}>
      <div
        className={cn(
          'group rounded-md border border-input px-3 py-2 text-sm ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
        )}
      >
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="rounded-sm">
              {tag.name}
              <button
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUnselect(tag);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(tag)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
          {!isMaxTagsReached && (
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleInputKeyDown}
              placeholder={value.length === 0 ? placeholder : undefined}
              className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          )}
        </div>
      </div>
      <div className="relative mt-2">
        {showSuggestions && (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandList>
              <CommandGroup className="h-full overflow-auto max-h-[200px]">
                {filteredSuggestions.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      selectTag(tag);
                      inputRef.current?.focus();
                    }}
                    className="cursor-pointer"
                  >
                    {tag.name}
                  </CommandItem>
                ))}
                {allowCreate && inputValue.trim() && !filteredSuggestions.some(
                  (t) => t.name.toLowerCase() === inputValue.trim().toLowerCase()
                ) && (
                  <CommandItem
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      createTag(inputValue);
                      inputRef.current?.focus();
                    }}
                    className="cursor-pointer"
                  >
                    <span className="text-muted-foreground">Create:</span>{' '}
                    <span className="font-medium">&quot;{inputValue.trim()}&quot;</span>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </div>
    </Command>
  );
}
