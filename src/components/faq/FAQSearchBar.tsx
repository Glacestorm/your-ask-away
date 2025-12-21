import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FAQSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const FAQSearchBar: React.FC<FAQSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Buscar en preguntas frecuentes...',
  className
}) => {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-12 pr-12 h-14 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-primary focus:ring-primary/20 text-base"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default FAQSearchBar;
