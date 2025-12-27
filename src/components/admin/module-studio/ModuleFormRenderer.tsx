/**
 * ModuleFormRenderer - Dynamic Form Renderer for Module Preview
 * Renders module configuration forms based on field definitions
 */

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, HelpCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ModuleField, ModuleSection, PreviewState, PreviewConfig } from '@/hooks/admin/useModulePreview';

interface ModuleFormRendererProps {
  sections: ModuleSection[];
  previewState: PreviewState;
  config: PreviewConfig;
  onFieldChange: (fieldId: string, value: unknown) => void;
  onToggleSection: (sectionId: string) => void;
  className?: string;
}

// Field Renderer Component
const FieldRenderer = memo(function FieldRenderer({
  field,
  value,
  error,
  showValidation,
  showLabels,
  onChange,
}: {
  field: ModuleField;
  value: unknown;
  error?: string;
  showValidation: boolean;
  showLabels: boolean;
  onChange: (value: unknown) => void;
}) {
  const hasError = showValidation && error;
  
  const renderField = () => {
    switch (field.type) {
      case 'switch':
        return (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex-1">
              {showLabels && (
                <Label htmlFor={field.id} className="font-medium cursor-pointer">
                  {field.label}
                </Label>
              )}
              {field.helpText && (
                <p className="text-xs text-muted-foreground mt-0.5">{field.helpText}</p>
              )}
            </div>
            <Switch
              id={field.id}
              checked={Boolean(value)}
              onCheckedChange={onChange}
              disabled={field.disabled}
            />
          </div>
        );
      
      case 'slider':
        return (
          <div className="space-y-2">
            {showLabels && (
              <div className="flex items-center justify-between">
                <Label htmlFor={field.id}>{field.label}</Label>
                <span className="text-sm text-muted-foreground">{String(value ?? 0)}</span>
              </div>
            )}
            <Slider
              id={field.id}
              value={[Number(value) || 0]}
              onValueChange={([v]) => onChange(v)}
              min={field.validation?.min ?? 0}
              max={field.validation?.max ?? 100}
              step={1}
              disabled={field.disabled}
              className="w-full"
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );
      
      case 'select':
        return (
          <div className="space-y-2">
            {showLabels && <Label htmlFor={field.id}>{field.label}</Label>}
            <Select
              value={String(value ?? '')}
              onValueChange={onChange}
              disabled={field.disabled}
            >
              <SelectTrigger id={field.id} className={cn(hasError && 'border-destructive')}>
                <SelectValue placeholder={field.placeholder || 'Seleccionar...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );
      
      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {showLabels && <Label>{field.label}</Label>}
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[80px] bg-background">
              {field.options?.map(opt => (
                <Badge
                  key={opt.value}
                  variant={selectedValues.includes(opt.value) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => {
                    if (field.disabled) return;
                    const newValue = selectedValues.includes(opt.value)
                      ? selectedValues.filter(v => v !== opt.value)
                      : [...selectedValues, opt.value];
                    onChange(newValue);
                  }}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );
      
      case 'textarea':
      case 'richtext':
        return (
          <div className="space-y-2">
            {showLabels && <Label htmlFor={field.id}>{field.label}</Label>}
            <Textarea
              id={field.id}
              value={String(value ?? '')}
              onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              className={cn('min-h-[100px] resize-y', hasError && 'border-destructive')}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );
      
      case 'number':
        return (
          <div className="space-y-2">
            {showLabels && <Label htmlFor={field.id}>{field.label}</Label>}
            <Input
              id={field.id}
              type="number"
              value={String(value ?? '')}
              onChange={e => onChange(Number(e.target.value))}
              placeholder={field.placeholder}
              disabled={field.disabled}
              min={field.validation?.min}
              max={field.validation?.max}
              className={cn(hasError && 'border-destructive')}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );
      
      case 'color':
        return (
          <div className="space-y-2">
            {showLabels && <Label htmlFor={field.id}>{field.label}</Label>}
            <div className="flex items-center gap-3">
              <input
                id={field.id}
                type="color"
                value={String(value ?? '#6366f1')}
                onChange={e => onChange(e.target.value)}
                disabled={field.disabled}
                className="h-10 w-14 rounded-md border cursor-pointer"
              />
              <Input
                value={String(value ?? '')}
                onChange={e => onChange(e.target.value)}
                placeholder="#000000"
                disabled={field.disabled}
                className="flex-1"
              />
            </div>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );
      
      case 'date':
        return (
          <div className="space-y-2">
            {showLabels && <Label htmlFor={field.id}>{field.label}</Label>}
            <Input
              id={field.id}
              type="date"
              value={String(value ?? '')}
              onChange={e => onChange(e.target.value)}
              disabled={field.disabled}
              className={cn(hasError && 'border-destructive')}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );
      
      case 'file':
        return (
          <div className="space-y-2">
            {showLabels && <Label htmlFor={field.id}>{field.label}</Label>}
            <Input
              id={field.id}
              type="file"
              onChange={e => onChange(e.target.files?.[0]?.name || '')}
              disabled={field.disabled}
              className={cn(hasError && 'border-destructive')}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );
      
      case 'text':
      default:
        return (
          <div className="space-y-2">
            {showLabels && <Label htmlFor={field.id}>{field.label}</Label>}
            <Input
              id={field.id}
              type="text"
              value={String(value ?? '')}
              onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              className={cn(hasError && 'border-destructive')}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );
    }
  };
  
  return (
    <div className="relative">
      {renderField()}
      {hasError && (
        <div className="flex items-center gap-1 mt-1 text-destructive text-xs">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
});

// Section Renderer Component
const SectionRenderer = memo(function SectionRenderer({
  section,
  isExpanded,
  previewState,
  config,
  onFieldChange,
  onToggle,
}: {
  section: ModuleSection;
  isExpanded: boolean;
  previewState: PreviewState;
  config: PreviewConfig;
  onFieldChange: (fieldId: string, value: unknown) => void;
  onToggle: () => void;
}) {
  if (section.collapsible) {
    return (
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">{section.title}</span>
              <Badge variant="outline" className="text-xs">
                {section.fields.length}
              </Badge>
            </div>
            {section.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{section.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {section.fields.map(field => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={previewState.formValues[field.id]}
                error={previewState.validationErrors[field.id]}
                showValidation={config.showValidation}
                showLabels={config.showLabels}
                onChange={value => onFieldChange(field.id, value)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-lg">
        <div>
          <h3 className="font-medium">{section.title}</h3>
          {section.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
          )}
        </div>
        <Badge variant="outline" className="text-xs">{section.fields.length} campos</Badge>
      </div>
      <div className="px-4 space-y-4">
        {section.fields.map(field => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={previewState.formValues[field.id]}
            error={previewState.validationErrors[field.id]}
            showValidation={config.showValidation}
            showLabels={config.showLabels}
            onChange={value => onFieldChange(field.id, value)}
          />
        ))}
      </div>
    </div>
  );
});

// Main Component
export function ModuleFormRenderer({
  sections,
  previewState,
  config,
  onFieldChange,
  onToggleSection,
  className,
}: ModuleFormRendererProps) {
  if (!sections || sections.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12 text-muted-foreground', className)}>
        <p>No hay campos configurados para este módulo</p>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {sections.map(section => (
        <div
          key={section.id}
          className="border rounded-lg bg-card overflow-hidden"
        >
          <SectionRenderer
            section={section}
            isExpanded={previewState.expandedSections.includes(section.id)}
            previewState={previewState}
            config={config}
            onFieldChange={onFieldChange}
            onToggle={() => onToggleSection(section.id)}
          />
        </div>
      ))}
    </div>
  );
}

export default ModuleFormRenderer;
