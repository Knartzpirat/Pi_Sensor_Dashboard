'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const testObjectSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  labelId: z.string().optional(),
});

type TestObjectFormValues = z.infer<typeof testObjectSchema>;

interface TestObjectFormProps {
  defaultValues?: Partial<TestObjectFormValues>;
  onSuccess?: () => void;
}

export function TestObjectForm({
  defaultValues,
  onSuccess,
}: TestObjectFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [labels, setLabels] = React.useState<{ id: string; name: string }[]>([]);

  const form = useForm<TestObjectFormValues>({
    resolver: zodResolver(testObjectSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      labelId: defaultValues?.labelId ?? '',
    },
  });

  React.useEffect(() => {
    // Load available labels
    fetch('/api/labels?type=TEST_OBJECT')
      .then((res) => res.json())
      .then((data) => setLabels(data))
      .catch((error) => console.error('Error loading labels:', error));
  }, []);

  async function onSubmit(data: TestObjectFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/test-objects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create test object');
      }

      toast.success('Test-Objekt erfolgreich erstellt');
      form.reset();
      onSuccess?.();

      // Reload page to show new data
      window.location.reload();
    } catch (error) {
      console.error('Error creating test object:', error);
      toast.error('Fehler beim Erstellen des Test-Objekts');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titel</FormLabel>
              <FormControl>
                <Input placeholder="Test-Objekt Titel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Beschreibung des Test-Objekts..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="labelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Label auswählen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Kein Label</SelectItem>
                  {labels.map((label) => (
                    <SelectItem key={label.id} value={label.id}>
                      {label.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Erstellen...' : 'Test-Objekt erstellen'}
        </Button>
      </form>
    </Form>
  );
}
