/**
 * useModuleStudioKeyboard - Atajos de teclado para Module Studio
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

interface UseModuleStudioKeyboardProps {
  selectedModuleKey?: string | null;
  onToggleCopilot?: () => void;
  onToggleAgent?: () => void;
  onTogglePreview?: () => void;
  onRefresh?: () => void;
  onSearch?: () => void;
}

export function useModuleStudioKeyboard({
  selectedModuleKey,
  onToggleCopilot,
  onToggleAgent,
  onTogglePreview,
  onRefresh,
  onSearch,
}: UseModuleStudioKeyboardProps) {
  const navigate = useNavigate();

  const navigateWithModule = useCallback((path: string) => {
    navigate(path + (selectedModuleKey ? `?module=${selectedModuleKey}` : ''));
  }, [navigate, selectedModuleKey]);

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    { key: 'h', alt: true, action: () => navigateWithModule('/obelixia-admin/module-studio'), description: 'Ir al Hub' },
    { key: 'd', alt: true, action: () => navigateWithModule('/obelixia-admin/module-studio/development'), description: 'Ir a Development' },
    { key: 'o', alt: true, action: () => navigateWithModule('/obelixia-admin/module-studio/operations'), description: 'Ir a Operations' },
    { key: 'a', alt: true, action: () => navigateWithModule('/obelixia-admin/module-studio/analytics'), description: 'Ir a Analytics' },
    { key: 'g', alt: true, action: () => navigateWithModule('/obelixia-admin/module-studio/governance'), description: 'Ir a Governance' },
    { key: 'e', alt: true, action: () => navigateWithModule('/obelixia-admin/module-studio/ecosystem'), description: 'Ir a Ecosystem' },
    
    // Panels
    { key: 'p', ctrl: true, action: () => onTogglePreview?.(), description: 'Toggle Preview' },
    { key: 'i', ctrl: true, action: () => onToggleCopilot?.(), description: 'Toggle Copilot' },
    { key: 'j', ctrl: true, action: () => onToggleAgent?.(), description: 'Toggle Agent' },
    
    // Actions
    { key: 'r', ctrl: true, action: () => onRefresh?.(), description: 'Refrescar datos' },
    { key: 'k', ctrl: true, action: () => onSearch?.(), description: 'Buscar módulo' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        
        if (e.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  const showShortcutsHelp = useCallback(() => {
    const groups = {
      'Navegación (Alt + tecla)': shortcuts.filter(s => s.alt),
      'Paneles (Ctrl + tecla)': shortcuts.filter(s => s.ctrl && !s.alt),
    };
    
    console.log('Module Studio Shortcuts:', groups);
    toast.info('Atajos de teclado', {
      description: 'Alt+H: Hub | Alt+D: Dev | Ctrl+P: Preview | Ctrl+K: Buscar',
      duration: 5000,
    });
  }, [shortcuts]);

  return {
    shortcuts,
    showShortcutsHelp,
  };
}

export default useModuleStudioKeyboard;
