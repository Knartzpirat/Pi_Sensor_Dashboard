'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
  EditableLabel,
} from '@/components/ui/editable';
import { InlineTextareaEditor } from '@/components/ui/inline-textarea-editor';
import { TagsInput, Tag } from '@/components/ui/tags-input';

interface Label {
  id: string;
  name: string;
  color: string | null;
}

interface EditableInfoSectionProps {
  title: string;
  description: string | null;
  labelIds: string[];
  labels: Label[];
  onTitleUpdate: (value: string) => void;
  onDescriptionUpdate: (value: string) => void;
  onLabelUpdate: (labelIds: string[]) => void;
}

/**
 * Reusable editable info section with title, description, and label selector
 */
export function EditableInfoSection({
  title,
  description,
  labelIds,
  labels,
  onTitleUpdate,
  onDescriptionUpdate,
  onLabelUpdate,
}: EditableInfoSectionProps) {
  const t = useTranslations();

  // Convert labels to tags format
  const labelSuggestions: Tag[] = React.useMemo(
    () => labels.map((label) => ({ id: label.id, name: label.name, color: label.color ?? undefined })),
    [labels]
  );

  // Track if tags are being edited by user
  const isEditingRef = React.useRef(false);

  // Initialize selected tags from labelIds
  const [selectedTags, setSelectedTags] = React.useState<Tag[]>([]);

  // Compute selected tags from labelIds and labels
  const computedTags = React.useMemo(() => {
    if (labelIds.length > 0 && labels.length > 0) {
      return labelIds
        .map((id) => {
          const label = labels.find((l) => l.id === id);
          return label ? { id: label.id, name: label.name, color: label.color ?? undefined } : null;
        })
        .filter((tag): tag is Tag => tag !== null);
    }
    return [];
  }, [labelIds, labels]);

  // Update selected tags when computed tags change (only if not editing)
  React.useEffect(() => {
    if (!isEditingRef.current) {
      setSelectedTags(computedTags);
    }
  }, [computedTags]);

  // Handle tag changes
  const handleTagsChange = async (tags: Tag[]) => {
    isEditingRef.current = true;
    setSelectedTags(tags);

    const labelIds: string[] = [];

    // Process all tags - create new ones if needed
    for (const tag of tags) {
      // Check if this is a new tag (starts with "new-")
      if (tag.id.startsWith('new-')) {
        // Create new label
        try {
          const response = await fetch('/api/labels', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: tag.name,
              type: 'TEST_OBJECT',
              color: tag.color || '#3b82f6',
            }),
          });

          if (response.ok) {
            const newLabel = await response.json();
            labelIds.push(newLabel.id);
            // Update the tag with the real ID
            setSelectedTags((prev) =>
              prev.map((t) =>
                t.id === tag.id
                  ? { id: newLabel.id, name: newLabel.name, color: newLabel.color }
                  : t
              )
            );
          }
        } catch (error) {
          console.error('Error creating label:', error);
        }
      } else {
        labelIds.push(tag.id);
      }
    }

    // Update with all label IDs
    await onLabelUpdate(labelIds);

    // Reset editing flag after update is complete
    isEditingRef.current = false;
  };

  return (
    <div className="space-y-4">
      <Editable value={title} onSubmit={onTitleUpdate} required>
        <EditableLabel>{t('testObjects.table.title')}</EditableLabel>
        <EditableArea>
          <EditablePreview />
          <EditableInput />
        </EditableArea>
      </Editable>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t('testObjects.table.description')}
        </label>
        <InlineTextareaEditor
          value={description || ''}
          onSubmit={onDescriptionUpdate}
          placeholder={t('testObjects.table.description_placeholder')}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t('testObjects.table.label')}
        </label>
        <TagsInput
          value={selectedTags}
          onChange={handleTagsChange}
          suggestions={labelSuggestions}
          placeholder={t('testObjects.table.label_placeholder')}
          maxTags={5}
          allowCreate={true}
        />
      </div>
    </div>
  );
}
