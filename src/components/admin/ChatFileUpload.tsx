import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileText, Image, FileAudio, File } from 'lucide-react';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'document' | 'image' | 'audio' | 'other';
}

interface ChatFileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = {
  document: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls', '.csv'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  audio: ['.mp3', '.wav', '.m4a', '.ogg', '.webm'],
};

const ALL_ACCEPTED = [...ACCEPTED_TYPES.document, ...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.audio].join(',');

export function ChatFileUpload({ 
  files, 
  onFilesChange, 
  disabled = false,
  maxFiles = 5,
  maxSizeMB = 10
}: ChatFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): UploadedFile['type'] => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (ACCEPTED_TYPES.image.includes(ext)) return 'image';
    if (ACCEPTED_TYPES.audio.includes(ext)) return 'audio';
    if (ACCEPTED_TYPES.document.includes(ext)) return 'document';
    return 'other';
  };

  const getFileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'audio': return <FileAudio className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    const validFiles: UploadedFile[] = [];
    
    for (const file of selectedFiles) {
      // Check size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${file.name} excede el límite de ${maxSizeMB}MB`);
        continue;
      }

      const type = getFileType(file);
      const uploadedFile: UploadedFile = {
        id: crypto.randomUUID(),
        file,
        type,
      };

      // Create preview for images
      if (type === 'image') {
        uploadedFile.preview = URL.createObjectURL(file);
      }

      validFiles.push(uploadedFile);
    }

    onFilesChange([...files, ...validFiles]);
    
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    onFilesChange(files.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-2">
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div 
              key={file.id}
              className="relative group flex items-center gap-2 bg-muted rounded-md p-2 pr-8 text-xs"
            >
              {file.preview ? (
                <img 
                  src={file.preview} 
                  alt={file.file.name}
                  className="h-8 w-8 object-cover rounded"
                />
              ) : (
                <div className="h-8 w-8 flex items-center justify-center bg-background rounded">
                  {getFileIcon(file.type)}
                </div>
              )}
              <div className="max-w-[120px]">
                <p className="truncate font-medium">{file.file.name}</p>
                <p className="text-muted-foreground">{formatFileSize(file.file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="absolute top-1 right-1 p-1 rounded-full bg-background hover:bg-destructive hover:text-destructive-foreground transition-colors"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept={ALL_ACCEPTED}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || files.length >= maxFiles}
      />
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || files.length >= maxFiles}
        title="Adjuntar archivo"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </div>
  );
}

export type { UploadedFile };
