/**
 * ContentUploader - Sistema de gestión de contenido multimedia
 * Soporte para videos, PDFs, imágenes, audios con drag & drop
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Video,
  FileText,
  Image,
  Music,
  Folder,
  X,
  Check,
  Loader2,
  GripVertical,
  MoreVertical,
  Eye,
  Trash2,
  Download,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface UploadFile {
  id: string;
  file: File;
  name: string;
  type: 'video' | 'pdf' | 'image' | 'audio' | 'other';
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  moduleId?: string;
  error?: string;
}

interface ContentModule {
  id: string;
  name: string;
  order: number;
  files: UploadFile[];
  isExpanded: boolean;
}

interface ContentUploaderProps {
  courseId?: string;
  onUploadComplete?: (files: UploadFile[]) => void;
  maxFileSizeMB?: number;
  allowedTypes?: ('video' | 'pdf' | 'image' | 'audio')[];
  className?: string;
}

// File type detection
const getFileType = (file: File): UploadFile['type'] => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type.toLowerCase();

  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (mimeType === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(ext)) return 'audio';
  return 'other';
};

// File type icons
const FileTypeIcon: React.FC<{ type: UploadFile['type']; className?: string }> = ({ type, className }) => {
  const iconProps = { className: cn("w-5 h-5", className) };
  switch (type) {
    case 'video': return <Video {...iconProps} />;
    case 'pdf': return <FileText {...iconProps} />;
    case 'image': return <Image {...iconProps} />;
    case 'audio': return <Music {...iconProps} />;
    default: return <FileText {...iconProps} />;
  }
};

// File type colors
const getTypeColor = (type: UploadFile['type']) => {
  switch (type) {
    case 'video': return 'text-purple-400 bg-purple-500/20';
    case 'pdf': return 'text-red-400 bg-red-500/20';
    case 'image': return 'text-green-400 bg-green-500/20';
    case 'audio': return 'text-blue-400 bg-blue-500/20';
    default: return 'text-slate-400 bg-slate-500/20';
  }
};

// Format file size
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const ContentUploader: React.FC<ContentUploaderProps> = ({
  courseId,
  onUploadComplete,
  maxFileSizeMB = 500,
  allowedTypes = ['video', 'pdf', 'image', 'audio'],
  className,
}) => {
  const [modules, setModules] = useState<ContentModule[]>([
    { id: 'default', name: 'Contenido General', order: 0, files: [], isExpanded: true }
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('default');
  const [previewFile, setPreviewFile] = useState<UploadFile | null>(null);
  const [newModuleName, setNewModuleName] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Simulate upload progress
  const simulateUpload = useCallback(async (file: UploadFile): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        setModules(prev => prev.map(m => ({
          ...m,
          files: m.files.map(f => 
            f.id === file.id 
              ? { ...f, progress: Math.min(progress, 100), status: progress >= 100 ? 'completed' : 'uploading' }
              : f
          )
        })));
      }, 200);
    });
  }, []);

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const maxSize = maxFileSizeMB * 1024 * 1024;

    const newFiles: UploadFile[] = [];
    
    for (const file of fileArray) {
      const type = getFileType(file);
      
      // Validate type
      if (!allowedTypes.includes(type as any) && type !== 'other') {
        toast.error(`Tipo de archivo no permitido: ${file.name}`);
        continue;
      }

      // Validate size
      if (file.size > maxSize) {
        toast.error(`Archivo muy grande: ${file.name} (max ${maxFileSizeMB}MB)`);
        continue;
      }

      const uploadFile: UploadFile = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        type,
        size: file.size,
        progress: 0,
        status: 'pending',
        moduleId: selectedModule,
      };

      newFiles.push(uploadFile);
    }

    if (newFiles.length === 0) return;

    // Add files to selected module
    setModules(prev => prev.map(m => 
      m.id === selectedModule 
        ? { ...m, files: [...m.files, ...newFiles] }
        : m
    ));

    // Start uploads
    for (const file of newFiles) {
      setModules(prev => prev.map(m => ({
        ...m,
        files: m.files.map(f => 
          f.id === file.id ? { ...f, status: 'uploading' } : f
        )
      })));

      try {
        await simulateUpload(file);
        toast.success(`${file.name} subido correctamente`);
      } catch (error) {
        setModules(prev => prev.map(m => ({
          ...m,
          files: m.files.map(f => 
            f.id === file.id ? { ...f, status: 'error', error: 'Error de subida' } : f
          )
        })));
        toast.error(`Error subiendo ${file.name}`);
      }
    }

    // Notify completion
    const allFiles = modules.flatMap(m => m.files);
    onUploadComplete?.(allFiles);
  }, [selectedModule, maxFileSizeMB, allowedTypes, simulateUpload, onUploadComplete, modules]);

  // Drag handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // Module management
  const addModule = useCallback(() => {
    if (!newModuleName.trim()) return;
    
    const newModule: ContentModule = {
      id: crypto.randomUUID(),
      name: newModuleName.trim(),
      order: modules.length,
      files: [],
      isExpanded: true,
    };

    setModules(prev => [...prev, newModule]);
    setNewModuleName('');
    setIsAddingModule(false);
    toast.success(`Módulo "${newModule.name}" creado`);
  }, [newModuleName, modules.length]);

  const deleteModule = useCallback((moduleId: string) => {
    if (moduleId === 'default') {
      toast.error('No se puede eliminar el módulo por defecto');
      return;
    }
    setModules(prev => prev.filter(m => m.id !== moduleId));
    if (selectedModule === moduleId) {
      setSelectedModule('default');
    }
    toast.success('Módulo eliminado');
  }, [selectedModule]);

  const toggleModule = useCallback((moduleId: string) => {
    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, isExpanded: !m.isExpanded } : m
    ));
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    setModules(prev => prev.map(m => ({
      ...m,
      files: m.files.filter(f => f.id !== fileId)
    })));
    toast.success('Archivo eliminado');
  }, []);

  // Stats
  const totalFiles = modules.reduce((acc, m) => acc + m.files.length, 0);
  const uploadingFiles = modules.reduce((acc, m) => 
    acc + m.files.filter(f => f.status === 'uploading').length, 0);
  const completedFiles = modules.reduce((acc, m) => 
    acc + m.files.filter(f => f.status === 'completed').length, 0);

  return (
    <Card className={cn("bg-slate-900/50 border-slate-800", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Gestor de Contenido
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {completedFiles}/{totalFiles} archivos
            </Badge>
            {uploadingFiles > 0 && (
              <Badge className="bg-primary/20 text-primary animate-pulse">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {uploadingFiles} subiendo
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
            isDragging 
              ? "border-primary bg-primary/10 scale-[1.02]" 
              : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/30"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".mp4,.webm,.mov,.avi,.pdf,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.m4a,.ogg"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />

          <motion.div
            animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
              isDragging ? "bg-primary/20" : "bg-slate-800"
            )}>
              <Upload className={cn(
                "w-8 h-8 transition-colors",
                isDragging ? "text-primary" : "text-slate-400"
              )} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">
                {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para subir'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Videos, PDFs, Imágenes, Audios (máx. {maxFileSizeMB}MB)
              </p>
            </div>
            <div className="flex items-center gap-4 mt-2">
              {allowedTypes.map(type => (
                <div key={type} className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs", getTypeColor(type))}>
                  <FileTypeIcon type={type} className="w-3 h-3" />
                  {type.toUpperCase()}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Module Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Subir a:</span>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {modules.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingModule(true)}
            className="border-slate-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Módulo
          </Button>
        </div>

        {/* Add Module Dialog */}
        <AnimatePresence>
          {isAddingModule && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2"
            >
              <Input
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                placeholder="Nombre del módulo..."
                className="flex-1 bg-slate-800 border-slate-700"
                onKeyDown={(e) => e.key === 'Enter' && addModule()}
              />
              <Button size="sm" onClick={addModule}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingModule(false)}>
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modules & Files List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {modules.map((module) => (
              <motion.div
                key={module.id}
                layout
                className="bg-slate-800/50 rounded-lg overflow-hidden"
              >
                {/* Module Header */}
                <div
                  className="flex items-center gap-2 p-3 cursor-pointer hover:bg-slate-800/70 transition-colors"
                  onClick={() => toggleModule(module.id)}
                >
                  <GripVertical className="w-4 h-4 text-slate-600" />
                  <Folder className={cn(
                    "w-5 h-5",
                    module.isExpanded ? "text-primary" : "text-slate-400"
                  )} />
                  <span className="flex-1 text-sm font-medium text-slate-300">
                    {module.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {module.files.length} archivos
                  </Badge>
                  {module.id !== 'default' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => deleteModule(module.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar módulo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Module Files */}
                <AnimatePresence>
                  {module.isExpanded && module.files.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700/50"
                    >
                      <div className="p-2 space-y-1">
                        {module.files.map((file, index) => (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors group"
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              getTypeColor(file.type)
                            )}>
                              <FileTypeIcon type={file.type} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-300 truncate">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{formatSize(file.size)}</span>
                                {file.status === 'uploading' && (
                                  <span className="text-primary">{Math.round(file.progress)}%</span>
                                )}
                                {file.status === 'completed' && (
                                  <span className="text-green-400 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Completado
                                  </span>
                                )}
                                {file.status === 'error' && (
                                  <span className="text-red-400">Error</span>
                                )}
                              </div>
                              {file.status === 'uploading' && (
                                <Progress value={file.progress} className="h-1 mt-1" />
                              )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPreviewFile(file)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => deleteFile(file.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-3xl bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileTypeIcon type={previewFile?.type || 'other'} />
              {previewFile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {previewFile?.type === 'image' && previewFile.file && (
              <img
                src={URL.createObjectURL(previewFile.file)}
                alt={previewFile.name}
                className="max-h-[60vh] mx-auto rounded-lg"
              />
            )}
            {previewFile?.type === 'video' && previewFile.file && (
              <video
                src={URL.createObjectURL(previewFile.file)}
                controls
                className="max-h-[60vh] mx-auto rounded-lg"
              />
            )}
            {previewFile?.type === 'audio' && previewFile.file && (
              <audio
                src={URL.createObjectURL(previewFile.file)}
                controls
                className="w-full"
              />
            )}
            {previewFile?.type === 'pdf' && (
              <div className="text-center text-slate-400 py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p>Vista previa de PDF no disponible</p>
                <Button variant="outline" className="mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ContentUploader;
