import React from 'react';
import { FormField } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormPreviewProps {
  formName: string;
  formDescription?: string;
  fields: FormField[];
  settings?: {
    submitButtonText?: string;
    successMessage?: string;
  };
}

export function FormPreview({ formName, formDescription, fields, settings }: FormPreviewProps) {
  const widthClasses = {
    full: 'col-span-12',
    half: 'col-span-12 md:col-span-6',
    third: 'col-span-12 md:col-span-4',
  };

  const renderField = (field: FormField) => {
    if (field.hidden) return null;

    const baseProps = {
      id: field.id,
      placeholder: field.placeholder,
      disabled: field.readOnly,
      defaultValue: field.defaultValue,
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input 
            {...baseProps} 
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'} 
          />
        );

      case 'number':
        return (
          <Input 
            {...baseProps} 
            type="number"
            min={field.validation.min}
            max={field.validation.max}
          />
        );

      case 'date':
      case 'datetime':
        return (
          <div className="relative">
            <Input 
              {...baseProps} 
              type={field.type === 'datetime' ? 'datetime-local' : 'date'} 
            />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        );

      case 'textarea':
      case 'richtext':
        return (
          <Textarea 
            {...baseProps} 
            rows={4}
            className={field.type === 'richtext' ? 'font-mono' : ''}
          />
        );

      case 'select':
        return (
          <Select disabled={field.readOnly}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Seleccionar...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2 p-3 border rounded-lg">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <Checkbox id={`${field.id}-${option.value}`} disabled={field.readOnly} />
                <Label htmlFor={`${field.id}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox id={field.id} disabled={field.readOnly} />
            <Label htmlFor={field.id} className="font-normal">
              {field.placeholder || 'Confirmar'}
            </Label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup disabled={field.readOnly}>
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label htmlFor={`${field.id}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'file':
        return (
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {field.placeholder || 'Arrastra archivos o haz clic para seleccionar'}
            </p>
          </div>
        );

      case 'signature':
        return (
          <div className="border rounded-lg p-4 h-32 bg-muted/30 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Área de firma</p>
          </div>
        );

      default:
        return <Input {...baseProps} />;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{formName}</CardTitle>
        {formDescription && (
          <CardDescription>{formDescription}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-4">
          {fields
            .filter(f => !f.hidden)
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <div 
                key={field.id} 
                className={cn(widthClasses[field.width || 'full'])}
              >
                {field.type !== 'checkbox' && (
                  <Label htmlFor={field.id} className="mb-2 block">
                    {field.label}
                    {field.validation.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                )}
                {renderField(field)}
                {field.helpText && (
                  <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                )}
              </div>
            ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button>{settings?.submitButtonText || 'Enviar'}</Button>
      </CardFooter>
    </Card>
  );
}
