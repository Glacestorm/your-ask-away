import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Image, Upload, Search, FolderPlus, Grid, List, Trash2, Copy, Loader2 } from 'lucide-react';

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  folder_id: string | null;
  tags: string[];
  created_at: string;
}

interface Folder { id: string; folder_name: string; parent_id: string | null; }

export function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

  useEffect(() => { loadData(); }, [currentFolder]);

  const loadData = async () => {
    try {
      const [filesRes, foldersRes] = await Promise.all([
        supabase.from('cms_media_library').select('*').eq('folder_id', currentFolder).order('created_at', { ascending: false }),
        supabase.from('cms_media_folders').select('*').eq('parent_id', currentFolder)
      ]);
      if (filesRes.error) throw filesRes.error;
      if (foldersRes.error) throw foldersRes.error;
      setFiles(filesRes.data?.map(f => ({ ...f, tags: (f.tags as string[]) || [] })) || []);
      setFolders(foldersRes.data || []);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('cms-media').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('cms-media').getPublicUrl(fileName);
        await (supabase as any).from('cms_media_library').insert({
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          folder_id: currentFolder,
          tags: []
        });
      }
      toast.success('Archivos subidos');
      loadData();
    } catch (error) {
      toast.error('Error al subir archivos');
    } finally {
      setUploading(false);
    }
  };

  const createFolder = async () => {
    const name = prompt('Nombre de la carpeta:');
    if (!name) return;
    try {
      await supabase.from('cms_media_folders').insert({ folder_name: name, parent_id: currentFolder });
      toast.success('Carpeta creada');
      loadData();
    } catch (error) {
      toast.error('Error al crear carpeta');
    }
  };

  const deleteFile = async (file: MediaFile) => {
    if (!confirm('¿Eliminar este archivo?')) return;
    try {
      await supabase.from('cms_media_library').delete().eq('id', file.id);
      toast.success('Archivo eliminado');
      setSelectedFile(null);
      loadData();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = files.filter(f => f.file_name.toLowerCase().includes(search.toLowerCase()) || f.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Image className="h-6 w-6" />Biblioteca de Medios</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={createFolder}><FolderPlus className="h-4 w-4 mr-2" />Carpeta</Button>
          <label>
            <Button asChild disabled={uploading}><span>{uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}Subir</span></Button>
            <input type="file" multiple className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {currentFolder && (
          <Button variant="ghost" onClick={() => setCurrentFolder(null)}>← Atrás</Button>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar archivos o tags..." className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className={selectedFile ? 'col-span-3' : 'col-span-4'}>
          {folders.length > 0 && (
            <div className="grid grid-cols-6 gap-4 mb-4">
              {folders.map(folder => (
                <div key={folder.id} className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 text-center" onClick={() => setCurrentFolder(folder.id)}>
                  <FolderPlus className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-sm truncate">{folder.folder_name}</p>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-6 gap-4">
              {filtered.map(file => (
                <div key={file.id} className={`border rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary ${selectedFile?.id === file.id ? 'ring-2' : ''}`} onClick={() => setSelectedFile(file)}>
                  {file.file_type.startsWith('image/') ? (
                    <img src={file.file_url} alt={file.file_name} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-muted flex items-center justify-center">
                      <span className="text-2xl">📄</span>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.file_size)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(file => (
                <div key={file.id} className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${selectedFile?.id === file.id ? 'bg-muted/50' : ''}`} onClick={() => setSelectedFile(file)}>
                  {file.file_type.startsWith('image/') ? (
                    <img src={file.file_url} alt={file.file_name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">📄</div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{file.file_name}</p>
                    <p className="text-sm text-muted-foreground">{file.file_type} • {formatSize(file.file_size)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedFile && (
          <Card className="col-span-1">
            <CardHeader><CardTitle className="text-sm">Detalles</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {selectedFile.file_type.startsWith('image/') && (
                <img src={selectedFile.file_url} alt={selectedFile.file_name} className="w-full rounded" />
              )}
              <div className="space-y-2 text-sm">
                <p><strong>Nombre:</strong> {selectedFile.file_name}</p>
                <p><strong>Tipo:</strong> {selectedFile.file_type}</p>
                <p><strong>Tamaño:</strong> {formatSize(selectedFile.file_size)}</p>
                <p><strong>Fecha:</strong> {new Date(selectedFile.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyUrl(selectedFile.file_url)}><Copy className="h-4 w-4 mr-1" />URL</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteFile(selectedFile)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
