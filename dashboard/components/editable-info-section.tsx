'use client';

import { useTranslations } from 'next-intl';
import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
  EditableLabel,
} from '@/components/ui/editable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InlineTextareaEditor } from '@/components/ui/inline-textarea-editor';

interface Label {
  id: string;
  name: string;
  color: string | null;
}

interface EditableInfoSectionProps {
  title: string;
  description: string | null;
  labelId: string | null;
  labels: Label[];
  onTitleUpdate: (value: string) => void;
  onDescriptionUpdate: (value: string) => void;
  onLabelUpdate: (value: string) => void;
}

/**
 * Reusable editable info section with title, description, and label selector
 */
export function EditableInfoSection({
  title,
  description,
  labelId,
  labels,
  onTitleUpdate,
  onDescriptionUpdate,
  onLabelUpdate,
}: EditableInfoSectionProps) {
  const t = useTranslations();

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
        <Select value={labelId || undefined} onValueChange={onLabelUpdate}>
          <SelectTrigger>
            <SelectValue
              placeholder={t('testObjects.table.label_placeholder')}
            />
          </SelectTrigger>
          <SelectContent>
            {labels.map((label) => (
              <SelectItem key={label.id} value={label.id}>
                <div className="flex items-center gap-2">
                  {label.color && (
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                  )}
                  {label.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
