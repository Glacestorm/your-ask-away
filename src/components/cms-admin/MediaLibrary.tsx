import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Image, Upload, Search, FolderPlus, Grid, List, Trash2, Copy, Loader2,
  FileText, Video, File, Download, Edit2, Tag, Move, Check, X,
  ChevronRight, Home, MoreVertical, Eye, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface MediaFile {
  id: string;
  file_name: string;
  original_name: string;
  file_url: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  folder_id: string | null;
  tags: string[];
  alt_text: Record<string, string> | null;
  title: string | null;
  description: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  thumbnail_url: string | null;
  created_at: string;
}

interface Folder {
  id: string;
  folder_name: string;
  parent_id: string | null;
  description: string | null;
  color: string;
  icon: string;
}

export function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [moveDialog, setMoveDialog] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);

  useEffect(() => { 
    loadData(); 
    loadAllFolders();
  }, [currentFolder]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [filesRes, foldersRes] = await Promise.all([
        supabase.from('cms_media_library').select('*').eq('folder_id', currentFolder).order('created_at', { ascending: false }),
        supabase.from('cms_media_folders').select('*').eq('parent_id', currentFolder)
      ]);
      if (filesRes.error) throw filesRes.error;
      if (foldersRes.error) throw foldersRes.error;
      setFiles(filesRes.data?.map(f => ({ 
        ...f, 
        tags: (f.tags as string[]) || [],
        alt_text: f.alt_text as Record<string, string> | null
      })) || []);
      setFolders(foldersRes.data || []);
      
      // Build folder path
      if (currentFolder) {
        const path: Folder[] = [];
        let folderId: string | null = currentFolder;
        while (folderId) {
          const { data } = await supabase.from('cms_media_folders').select('*').eq('id', folderId).single();
          if (data) {
            path.unshift(data);
            folderId = data.parent_id;
          } else {
            break;
          }
        }
        setFolderPath(path);
      } else {
        setFolderPath([]);
      }
    } catch (error) {
      console.error('Error loading media:', error);
      toast.error('Error al cargar medios');
    } finally {
      setLoading(false);
    }
  };

  const loadAllFolders = async () => {
    const { data } = await supabase.from('cms_media_folders').select('*').order('folder_name');
    setAllFolders(data || []);
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const totalFiles = fileList.length;
      let completed = 0;
      
      for (const file of Array.from(fileList)) {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('cms-media').upload(fileName, file);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('cms-media').getPublicUrl(fileName);
        
        // Get image dimensions if it's an image
        let width = null, height = null;
        if (file.type.startsWith('image/')) {
          const img = new window.Image();
          await new Promise((resolve) => {
            img.onload = () => {
              width = img.width;
              height = img.height;
              resolve(null);
            };
            img.src = URL.createObjectURL(file);
          });
        }
        
        await supabase.from('cms_media_library').insert({
          file_name: fileName,
          original_name: file.name,
          file_url: publicUrl,
          file_type: file.type.split('/')[0],
          mime_type: file.type,
          file_size: file.size,
          folder_id: currentFolder,
          tags: [],
          width,
          height
        });
        
        completed++;
        setUploadProgress(Math.round((completed / totalFiles) * 100));
      }
      
      toast.success(`${totalFiles} archivo(s) subido(s)`);
      loadData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir archivos');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }, [currentFolder]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await supabase.from('cms_media_folders').insert({ 
        folder_name: newFolderName.trim(), 
        parent_id: currentFolder,
        color: '#6366f1',
        icon: 'folder'
      });
      toast.success('Carpeta creada');
      setNewFolderDialog(false);
      setNewFolderName('');
      loadData();
      loadAllFolders();
    } catch (error) {
      toast.error('Error al crear carpeta');
    }
  };

  const deleteFiles = async () => {
    if (!selectedFiles.size) return;
    if (!confirm(`¿Eliminar ${selectedFiles.size} archivo(s)?`)) return;
    
    try {
      const ids = Array.from(selectedFiles);
      await supabase.from('cms_media_library').delete().in('id', ids);
      toast.success('Archivos eliminados');
      setSelectedFiles(new Set());
      loadData();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const moveFiles = async () => {
    if (!selectedFiles.size) return;
    
    try {
      const ids = Array.from(selectedFiles);
      await supabase.from('cms_media_library').update({ folder_id: targetFolderId }).in('id', ids);
      toast.success('Archivos movidos');
      setSelectedFiles(new Set());
      setMoveDialog(false);
      loadData();
    } catch (error) {
      toast.error('Error al mover archivos');
    }
  };

  const updateFile = async () => {
    if (!editingFile) return;
    
    try {
      await supabase.from('cms_media_library').update({
        title: editingFile.title,
        description: editingFile.description,
        alt_text: editingFile.alt_text,
        tags: editingFile.tags
      }).eq('id', editingFile.id);
      toast.success('Archivo actualizado');
      setEditingFile(null);
      loadData();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada');
  };

  const toggleFileSelection = (id: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedFiles(newSelection);
  };

  const selectAll = () => {
    if (selectedFiles.size === filtered.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filtered.map(f => f.id)));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video')) return <Video className="h-5 w-5" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const filtered = files.filter(f => {
    const matchesSearch = f.file_name.toLowerCase().includes(search.toLowerCase()) || 
                          f.original_name.toLowerCase().includes(search.toLowerCase()) ||
                          f.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'images') return matchesSearch && f.file_type === 'image';
    if (activeTab === 'videos') return matchesSearch && f.file_type === 'video';
    if (activeTab === 'documents') return matchesSearch && (f.file_type === 'application' || f.mime_type.includes('pdf'));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Image className="h-6 w-6 text-primary" />
            Biblioteca de Medios
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {files.length} archivos • {folders.length} carpetas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNewFolderDialog(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Carpeta
          </Button>
          <label>
            <Button size="sm" asChild disabled={uploading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <span>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? `${uploadProgress}%` : 'Subir'}
              </span>
            </Button>
            <input type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
          </label>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" onClick={() => setCurrentFolder(null)} className="text-muted-foreground hover:text-foreground">
          <Home className="h-4 w-4" />
        </Button>
        {folderPath.map((folder, index) => (
          <div key={folder.id} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentFolder(folder.id)}
              className={index === folderPath.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}
            >
              {folder.folder_name}
            </Button>
          </div>
        ))}
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar archivos, tags..." 
            className="pl-10 bg-card border-border" 
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-card/80 border border-border/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground">Todos</TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground">Imágenes</TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground">Videos</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground">Documentos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bulk Actions */}
      {selectedFiles.size > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-3 bg-primary/10 rounded-lg border border-primary/20"
        >
          <span className="text-sm font-medium text-foreground">{selectedFiles.size} seleccionado(s)</span>
          <Button size="sm" variant="outline" onClick={selectAll}>
            {selectedFiles.size === filtered.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMoveDialog(true)}>
            <Move className="h-4 w-4 mr-1" /> Mover
          </Button>
          <Button size="sm" variant="destructive" onClick={deleteFiles}>
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedFiles(new Set())}>
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative min-h-[400px] rounded-xl border-2 border-dashed transition-all duration-300
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border/50'}
        `}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl z-10">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto text-primary mb-2" />
              <p className="text-lg font-medium text-foreground">Suelta los archivos aquí</p>
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Folders */}
          {folders.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Carpetas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {folders.map(folder => (
                  <motion.div
                    key={folder.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 border border-border rounded-lg cursor-pointer hover:bg-accent/50 bg-card transition-colors"
                    onClick={() => setCurrentFolder(folder.id)}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: folder.color + '20' }}
                    >
                      <FolderPlus className="h-5 w-5" style={{ color: folder.color }} />
                    </div>
                    <p className="text-sm font-medium truncate text-foreground">{folder.folder_name}</p>
                    {folder.description && (
                      <p className="text-xs text-muted-foreground truncate">{folder.description}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {filtered.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Archivos</h3>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <AnimatePresence>
                    {filtered.map(file => (
                      <motion.div
                        key={file.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`
                          relative group border rounded-lg overflow-hidden cursor-pointer bg-card
                          transition-all hover:shadow-lg
                          ${selectedFiles.has(file.id) ? 'ring-2 ring-primary border-primary' : 'border-border hover:border-primary/50'}
                        `}
                      >
                        {/* Selection checkbox */}
                        <div 
                          className="absolute top-2 left-2 z-10"
                          onClick={(e) => { e.stopPropagation(); toggleFileSelection(file.id); }}
                        >
                          <div className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                            ${selectedFiles.has(file.id) ? 'bg-primary border-primary' : 'bg-background/80 border-muted-foreground/50 group-hover:border-primary'}
                          `}>
                            {selectedFiles.has(file.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                        </div>

                        {/* Preview */}
                        <div 
                          className="aspect-square bg-muted"
                          onClick={() => setPreviewFile(file)}
                        >
                          {file.file_type === 'image' ? (
                            <img src={file.file_url} alt={file.original_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {getFileIcon(file.mime_type)}
                            </div>
                          )}
                        </div>

                        {/* Actions overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="secondary" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                                <Eye className="h-4 w-4 mr-2" /> Ver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingFile(file)}>
                                <Edit2 className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyUrl(file.file_url)}>
                                <Copy className="h-4 w-4 mr-2" /> Copiar URL
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-2" /> Descargar
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Info */}
                        <div className="p-2">
                          <p className="text-xs font-medium truncate text-foreground">{file.original_name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">{formatSize(file.file_size)}</span>
                            {file.width && file.height && (
                              <span className="text-xs text-muted-foreground">{file.width}x{file.height}</span>
                            )}
                          </div>
                          {file.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {file.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {file.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  +{file.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(file => (
                    <motion.div
                      key={file.id}
                      className={`
                        flex items-center gap-4 p-3 border rounded-lg cursor-pointer bg-card
                        transition-all hover:shadow-md
                        ${selectedFiles.has(file.id) ? 'ring-2 ring-primary border-primary' : 'border-border hover:border-primary/50'}
                      `}
                    >
                      <div onClick={(e) => { e.stopPropagation(); toggleFileSelection(file.id); }}>
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center
                          ${selectedFiles.has(file.id) ? 'bg-primary border-primary' : 'border-muted-foreground/50'}
                        `}>
                          {selectedFiles.has(file.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </div>
                      
                      <div 
                        className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden"
                        onClick={() => setPreviewFile(file)}
                      >
                        {file.file_type === 'image' ? (
                          <img src={file.file_url} alt={file.original_name} className="w-full h-full object-cover" />
                        ) : (
                          getFileIcon(file.mime_type)
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0" onClick={() => setPreviewFile(file)}>
                        <p className="font-medium truncate text-foreground">{file.original_name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{file.mime_type}</span>
                          <span>{formatSize(file.file_size)}</span>
                          {file.width && file.height && <span>{file.width}x{file.height}</span>}
                        </div>
                      </div>
                      
                      {file.tags.length > 0 && (
                        <div className="flex gap-1">
                          {file.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditingFile(file)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => copyUrl(file.file_url)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <Image className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-foreground">No hay archivos</p>
              <p className="text-sm text-muted-foreground mt-1">Arrastra archivos aquí o usa el botón Subir</p>
            </div>
          )}
        </div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Carpeta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre de la carpeta</Label>
              <Input 
                value={newFolderName} 
                onChange={e => setNewFolderName(e.target.value)} 
                placeholder="Mi carpeta"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialog(false)}>Cancelar</Button>
            <Button onClick={createFolder}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={moveDialog} onOpenChange={setMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover archivos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Carpeta destino</Label>
            <Select value={targetFolderId || 'root'} onValueChange={v => setTargetFolderId(v === 'root' ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar carpeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Raíz</SelectItem>
                {allFolders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>{folder.folder_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialog(false)}>Cancelar</Button>
            <Button onClick={moveFiles}>Mover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar archivo</DialogTitle>
          </DialogHeader>
          {editingFile && (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input 
                  value={editingFile.title || ''} 
                  onChange={e => setEditingFile({ ...editingFile, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea 
                  value={editingFile.description || ''} 
                  onChange={e => setEditingFile({ ...editingFile, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Texto alternativo (SEO)</Label>
                <Input 
                  value={editingFile.alt_text?.['es'] || ''} 
                  onChange={e => setEditingFile({ 
                    ...editingFile, 
                    alt_text: { ...editingFile.alt_text, es: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Tags (separados por coma)</Label>
                <Input 
                  value={editingFile.tags.join(', ')} 
                  onChange={e => setEditingFile({ 
                    ...editingFile, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFile(null)}>Cancelar</Button>
            <Button onClick={updateFile}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewFile && getFileIcon(previewFile.mime_type)}
              {previewFile?.original_name}
            </DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              {previewFile.file_type === 'image' ? (
                <img src={previewFile.file_url} alt={previewFile.original_name} className="w-full rounded-lg" />
              ) : previewFile.file_type === 'video' ? (
                <video src={previewFile.file_url} controls className="w-full rounded-lg" />
              ) : previewFile.mime_type.includes('pdf') ? (
                <iframe src={previewFile.file_url} className="w-full h-[500px] rounded-lg border" />
              ) : (
                <div className="text-center py-8">
                  <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Vista previa no disponible</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="ml-2 text-foreground">{previewFile.mime_type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tamaño:</span>
                  <span className="ml-2 text-foreground">{formatSize(previewFile.file_size)}</span>
                </div>
                {previewFile.width && previewFile.height && (
                  <div>
                    <span className="text-muted-foreground">Dimensiones:</span>
                    <span className="ml-2 text-foreground">{previewFile.width} x {previewFile.height}px</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="ml-2 text-foreground">{new Date(previewFile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => copyUrl(previewFile.file_url)}>
                  <Copy className="h-4 w-4 mr-2" /> Copiar URL
                </Button>
                <Button variant="outline" asChild>
                  <a href={previewFile.file_url} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" /> Descargar
                  </a>
                </Button>
                <Button variant="outline" onClick={() => { setPreviewFile(null); setEditingFile(previewFile); }}>
                  <Edit2 className="h-4 w-4 mr-2" /> Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}