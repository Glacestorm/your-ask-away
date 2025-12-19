import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormDefinition, FormField } from '../types';
import { useFormSubmissions } from '@/hooks/lowcode/useLowCodeForms';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField as FormFieldComponent, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon, Upload, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FormRendererProps {
  formDefinition: FormDefinition;
  onSuccess?: (data: Record<string, any>) => void;
  className?: string;
}

// Dynamic Zod schema generator
function generateZodSchema(fields: FormField[]) {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    if (field.hidden) return;

    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email('Email inválido');
        break;
      case 'number':
        fieldSchema = z.coerce.number();
        if (field.validation.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min);
        }
        if (field.validation.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max);
        }
        break;
      case 'checkbox':
        fieldSchema = z.boolean();
        break;
      case 'multiselect':
        fieldSchema = z.array(z.string());
        break;
      case 'date':
      case 'datetime':
        fieldSchema = z.string();
        break;
      default:
        fieldSchema = z.string();
        if (field.validation.minLength) {
          fieldSchema = (fieldSchema as z.ZodString).min(
            field.validation.minLength,
            `Mínimo ${field.validation.minLength} caracteres`
          );
        }
        if (field.validation.maxLength) {
          fieldSchema = (fieldSchema as z.ZodString).max(
            field.validation.maxLength,
            `Máximo ${field.validation.maxLength} caracteres`
          );
        }
        if (field.validation.pattern) {
          fieldSchema = (fieldSchema as z.ZodString).regex(
            new RegExp(field.validation.pattern),
            field.validation.patternMessage || 'Formato inválido'
          );
        }
    }

    if (!field.validation.required) {
      fieldSchema = fieldSchema.optional();
    }

    schemaFields[field.name] = fieldSchema;
  });

  return z.object(schemaFields);
}

export function FormRenderer({ formDefinition, onSuccess, className }: FormRendererProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { submitForm } = useFormSubmissions(formDefinition.id);

  const schema = generateZodSchema(formDefinition.fields);
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: formDefinition.fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue || (field.type === 'multiselect' ? [] : field.type === 'checkbox' ? false : '');
      return acc;
    }, {} as Record<string, any>),
  });

  const onSubmit = async (data: Record<string, any>) => {
    try {
      await submitForm.mutateAsync({ formId: formDefinition.id, data });
      setIsSubmitted(true);
      onSuccess?.(data);
      
      if (!formDefinition.settings.allowMultipleSubmissions) {
        // Show success state
      } else {
        form.reset();
        setTimeout(() => setIsSubmitted(false), 2000);
      }
    } catch (error) {
      toast.error('Error al enviar el formulario');
    }
  };

  const widthClasses = {
    full: 'col-span-12',
    half: 'col-span-12 md:col-span-6',
    third: 'col-span-12 md:col-span-4',
  };

  const renderFieldControl = (field: FormField, formField: any) => {
    const baseProps = {
      placeholder: field.placeholder,
      disabled: field.readOnly,
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input 
            {...baseProps} 
            {...formField}
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'} 
          />
        );

      case 'number':
        return (
          <Input 
            {...baseProps} 
            {...formField}
            type="number"
            min={field.validation.min}
            max={field.validation.max}
          />
        );

      case 'date':
      case 'datetime':
        return (
          <Input 
            {...baseProps} 
            {...formField}
            type={field.type === 'datetime' ? 'datetime-local' : 'date'} 
          />
        );

      case 'textarea':
      case 'richtext':
        return (
          <Textarea 
            {...baseProps} 
            {...formField}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select 
            disabled={field.readOnly}
            value={formField.value}
            onValueChange={formField.onChange}
          >
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

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox 
              id={field.id} 
              disabled={field.readOnly}
              checked={formField.value}
              onCheckedChange={formField.onChange}
            />
            <Label htmlFor={field.id} className="font-normal">
              {field.placeholder || 'Confirmar'}
            </Label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup 
            disabled={field.readOnly}
            value={formField.value}
            onValueChange={formField.onChange}
          >
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

      default:
        return <Input {...baseProps} {...formField} />;
    }
  };

  if (isSubmitted && !formDefinition.settings.allowMultipleSubmissions) {
    return (
      <Card className={cn("max-w-2xl mx-auto", className)}>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-xl font-semibold mb-2">¡Enviado correctamente!</h3>
          <p className="text-muted-foreground">
            {formDefinition.settings.successMessage || 'Tu respuesta ha sido registrada.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("max-w-2xl mx-auto", className)}>
      <CardHeader>
        <CardTitle>{formDefinition.form_name}</CardTitle>
        {formDefinition.description && (
          <CardDescription>{formDefinition.description}</CardDescription>
        )}
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="grid grid-cols-12 gap-4">
              {formDefinition.fields
                .filter(f => !f.hidden)
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div 
                    key={field.id} 
                    className={cn(widthClasses[field.width || 'full'])}
                  >
                    <FormFieldComponent
                      control={form.control}
                      name={field.name}
                      render={({ field: formField }) => (
                        <FormItem>
                          {field.type !== 'checkbox' && (
                            <FormLabel>
                              {field.label}
                              {field.validation.required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </FormLabel>
                          )}
                          <FormControl>
                            {renderFieldControl(field, formField)}
                          </FormControl>
                          {field.helpText && (
                            <FormDescription>{field.helpText}</FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Limpiar
            </Button>
            <Button type="submit" disabled={submitForm.isPending}>
              {submitForm.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {formDefinition.settings.submitButtonText || 'Enviar'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
