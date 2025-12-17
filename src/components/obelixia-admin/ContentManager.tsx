import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Save, Edit2, Trash2, 
  FileText, Image, Code, Type, RefreshCw, Check, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Content {
  id: string;
  content_key: string;
  content_type: string;
  title: string;
  content: string;
  metadata: any;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export const ContentManager: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  
  const [newContent, setNewContent] = useState({
    content_key: '',
    content_type: 'text',
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('obelixia_content')
      .select('*')
      .order('content_key', { ascending: true });

    if (error) {
      toast.error('Error cargando contenidos');
    } else {
      setContents(data || []);
    }
    setLoading(false);
  };

  const createContent = async () => {
    if (!newContent.content_key || !newContent.title || !newContent.content) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    const { data, error } = await supabase
      .from('obelixia_content')
      .insert({
        content_key: newContent.content_key,
        content_type: newContent.content_type,
        title: newContent.title,
        content: newContent.content,
      })
      .select()
      .single();

    if (error) {
      toast.error('Error creando contenido');
    } else {
      toast.success('Contenido creado');
      setContents([...contents, data]);
      setIsCreateOpen(false);
      setNewContent({ content_key: '', content_type: 'text', title: '', content: '' });
    }
  };

  const startEditing = () => {
    if (selectedContent) {
      setEditedContent(selectedContent.content);
      setIsEditing(true);
    }
  };

  const saveContent = async () => {
    if (!selectedContent) return;

    const { error } = await supabase
      .from('obelixia_content')
      .update({
        content: editedContent,
        version: selectedContent.version + 1,
      })
      .eq('id', selectedContent.id);

    if (error) {
      toast.error('Error guardando cambios');
    } else {
      toast.success('Contenido actualizado');
      const updatedContent = { ...selectedContent, content: editedContent, version: selectedContent.version + 1 };
      setContents(contents.map(c => c.id === selectedContent.id ? updatedContent : c));
      setSelectedContent(updatedContent);
      setIsEditing(false);
    }
  };

  const toggleActive = async (content: Content) => {
    const { error } = await supabase
      .from('obelixia_content')
      .update({ is_active: !content.is_active })
      .eq('id', content.id);

    if (error) {
      toast.error('Error actualizando estado');
    } else {
      setContents(contents.map(c => c.id === content.id ? { ...c, is_active: !c.is_active } : c));
      if (selectedContent?.id === content.id) {
        setSelectedContent({ ...selectedContent, is_active: !selectedContent.is_active });
      }
    }
  };

  const deleteContent = async (contentId: string) => {
    if (!confirm('¿Eliminar este contenido?')) return;

    const { error } = await supabase
      .from('obelixia_content')
      .delete()
      .eq('id', contentId);

    if (error) {
      toast.error('Error eliminando contenido');
    } else {
      toast.success('Contenido eliminado');
      setContents(contents.filter(c => c.id !== contentId));
      if (selectedContent?.id === contentId) {
        setSelectedContent(null);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      text: Type,
      html: Code,
      json: FileText,
      image: Image,
    };
    const Icon = icons[type] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      text: 'bg-blue-500/20 text-blue-300',
      html: 'bg-purple-500/20 text-purple-300',
      json: 'bg-amber-500/20 text-amber-300',
      image: 'bg-emerald-500/20 text-emerald-300',
    };
    return (
      <Badge className={styles[type] || styles.text}>
        {getTypeIcon(type)}
        <span className="ml-1">{type}</span>
      </Badge>
    );
  };

  const filteredContents = contents.filter(c =>
    c.content_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Gestión de Contenidos
          </h3>
          <p className="text-slate-400 text-sm">
            Administra textos, HTML y configuraciones de la aplicación
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchContents} className="border-slate-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Contenido
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Nuevo Contenido</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Clave única *</Label>
                  <Input
                    value={newContent.content_key}
                    onChange={e => setNewContent({ ...newContent, content_key: e.target.value })}
                    placeholder="hero_title, footer_text..."
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Tipo</Label>
                  <Select
                    value={newContent.content_type}
                    onValueChange={val => setNewContent({ ...newContent, content_type: val })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="image">Imagen URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Título descriptivo *</Label>
                  <Input
                    value={newContent.title}
                    onChange={e => setNewContent({ ...newContent, title: e.target.value })}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Contenido *</Label>
                  <Textarea
                    value={newContent.content}
                    onChange={e => setNewContent({ ...newContent, content: e.target.value })}
                    className="bg-slate-800 border-slate-600 font-mono text-sm"
                    rows={6}
                  />
                </div>
                <Button onClick={createContent} className="w-full">
                  Crear Contenido
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content list */}
        <Card className="lg:col-span-1 bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar contenidos..."
                className="pl-10 bg-slate-800 border-slate-600"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {loading ? (
                <p className="text-center text-slate-400 py-8">Cargando...</p>
              ) : filteredContents.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No hay contenidos</p>
              ) : (
                <div className="space-y-2">
                  {filteredContents.map(content => (
                    <div
                      key={content.id}
                      onClick={() => { setSelectedContent(content); setIsEditing(false); }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedContent?.id === content.id
                          ? 'bg-amber-500/10 border-amber-500'
                          : 'border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm text-white truncate">
                          {content.content_key}
                        </span>
                        {getTypeBadge(content.content_type)}
                      </div>
                      <p className="text-sm text-slate-400 truncate">{content.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge 
                          variant="outline" 
                          className={content.is_active ? 'border-emerald-500 text-emerald-400' : 'border-slate-600 text-slate-500'}
                        >
                          {content.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <span className="text-xs text-slate-500">v{content.version}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Content detail/editor */}
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-700">
          {selectedContent ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      {getTypeIcon(selectedContent.content_type)}
                      {selectedContent.title}
                    </CardTitle>
                    <p className="text-sm text-slate-400 font-mono mt-1">
                      {selectedContent.content_key}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Activo</span>
                      <Switch
                        checked={selectedContent.is_active}
                        onCheckedChange={() => toggleActive(selectedContent)}
                      />
                    </div>
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={saveContent} className="bg-emerald-600 hover:bg-emerald-700">
                          <Check className="w-4 h-4 mr-1" />
                          Guardar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={startEditing} className="border-slate-600">
                          <Edit2 className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => deleteContent(selectedContent.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedContent}
                    onChange={e => setEditedContent(e.target.value)}
                    className="bg-slate-800 border-slate-600 font-mono text-sm min-h-[400px]"
                  />
                ) : (
                  <div className="bg-slate-800/50 rounded-lg p-4 min-h-[400px]">
                    {selectedContent.content_type === 'html' ? (
                      <div 
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedContent.content }}
                      />
                    ) : selectedContent.content_type === 'json' ? (
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                        {JSON.stringify(JSON.parse(selectedContent.content || '{}'), null, 2)}
                      </pre>
                    ) : selectedContent.content_type === 'image' ? (
                      <div className="text-center">
                        <img 
                          src={selectedContent.content} 
                          alt={selectedContent.title}
                          className="max-w-full max-h-96 mx-auto rounded-lg"
                        />
                        <p className="text-sm text-slate-500 mt-2">{selectedContent.content}</p>
                      </div>
                    ) : (
                      <p className="text-slate-300 whitespace-pre-wrap">{selectedContent.content}</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>Versión: {selectedContent.version}</span>
                  <span>Actualizado: {new Date(selectedContent.updated_at).toLocaleString('es-ES')}</span>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecciona un contenido para ver o editar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};
