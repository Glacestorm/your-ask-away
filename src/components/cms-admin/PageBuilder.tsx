import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Plus, Save, Eye, Trash2, History, Monitor, Smartphone, Loader2 } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Block { id: string; type: string; content: Record<string, any>; }
interface Page { id: string; title: string; slug: string; status: string; blocks: Block[]; created_at: string; }

const blockTypes = [
  { type: 'heading', label: 'Encabezado', icon: 'H' },
  { type: 'text', label: 'Texto', icon: 'T' },
  { type: 'image', label: 'Imagen', icon: '🖼' },
  { type: 'columns', label: 'Columnas', icon: '▥' },
  { type: 'card', label: 'Tarjeta', icon: '▢' },
  { type: 'quote', label: 'Cita', icon: '"' },
  { type: 'list', label: 'Lista', icon: '•' },
];

function SortableBlock({ block, onUpdate, onDelete }: { block: Block; onUpdate: (content: any) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="p-4 border rounded-lg bg-card" {...attributes}>
      <div className="flex items-center justify-between mb-2">
        <div {...listeners} className="cursor-grab px-2 py-1 bg-muted rounded">⋮⋮</div>
        <span className="text-sm font-medium capitalize">{block.type}</span>
        <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
      {block.type === 'heading' && <Input value={block.content.text || ''} onChange={e => onUpdate({ text: e.target.value })} placeholder="Título..." />}
      {block.type === 'text' && <Textarea value={block.content.text || ''} onChange={e => onUpdate({ text: e.target.value })} placeholder="Contenido..." />}
      {block.type === 'image' && <Input value={block.content.url || ''} onChange={e => onUpdate({ url: e.target.value })} placeholder="URL de la imagen..." />}
      {block.type === 'quote' && <Textarea value={block.content.text || ''} onChange={e => onUpdate({ text: e.target.value })} placeholder="Cita..." />}
      {block.type === 'list' && <Textarea value={block.content.items?.join('\n') || ''} onChange={e => onUpdate({ items: e.target.value.split('\n') })} placeholder="Un item por línea..." />}
    </div>
  );
}

export function PageBuilder() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => { loadPages(); }, []);

  const loadPages = async () => {
    try {
      const { data, error } = await (supabase.from('cms_pages') as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPages(data?.map((p: any) => ({ ...p, title: p.title?.en || p.title || '', blocks: p.content?.blocks || [] })) || []);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPage = async () => {
    try {
      const { data, error } = await (supabase.from('cms_pages') as any).insert({ title: { en: 'Nueva Página' }, slug: `page-${Date.now()}`, content: { blocks: [] }, status: 'draft' }).select().single();
      if (error) throw error;
      toast.success('Página creada');
      loadPages();
      setSelectedPage({ ...data, title: data.title?.en || 'Nueva Página', blocks: [] } as any);
      setBlocks([]);
    } catch (error) {
      toast.error('Error al crear página');
    }
  };

  const savePage = async () => {
    if (!selectedPage) return;
    try {
      await (supabase.from('cms_page_revisions') as any).insert({ page_id: selectedPage.id, content: { blocks }, revision_number: Date.now() });
      await (supabase.from('cms_pages') as any).update({ content: { blocks }, updated_at: new Date().toISOString() }).eq('id', selectedPage.id);
      toast.success('Página guardada');
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const publishPage = async () => {
    if (!selectedPage) return;
    try {
      await (supabase.from('cms_pages') as any).update({ status: 'published', published_at: new Date().toISOString() }).eq('id', selectedPage.id);
      toast.success('Página publicada');
      loadPages();
    } catch (error) {
      toast.error('Error al publicar');
    }
  };

  const addBlock = (type: string) => {
    const newBlock: Block = { id: `block-${Date.now()}`, type, content: {} };
    setBlocks(prev => [...prev, newBlock]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks(items => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" />Page Builder</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}>
            {previewMode === 'desktop' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          </Button>
          <Button onClick={createPage}><Plus className="h-4 w-4 mr-2" />Nueva Página</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="col-span-1">
          <CardHeader><CardTitle>Páginas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pages.map(page => (
              <div key={page.id} className={`p-3 rounded-lg border cursor-pointer ${selectedPage?.id === page.id ? 'border-primary bg-primary/10' : ''}`} onClick={() => { setSelectedPage(page); setBlocks(page.blocks); }}>
                <p className="font-medium truncate">{page.title}</p>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${page.status === 'published' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{page.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="col-span-2 space-y-4">
          {selectedPage && (
            <>
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input value={selectedPage.title} onChange={e => setSelectedPage(p => p ? { ...p, title: e.target.value } : null)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input value={selectedPage.slug} onChange={e => setSelectedPage(p => p ? { ...p, slug: e.target.value } : null)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {blocks.map((block, i) => (
                      <SortableBlock key={block.id} block={block} onUpdate={content => setBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, content } : b))} onDelete={() => setBlocks(prev => prev.filter((_, idx) => idx !== i))} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex gap-2">
                <Button onClick={savePage}><Save className="h-4 w-4 mr-2" />Guardar</Button>
                <Button variant="outline" onClick={publishPage}><Eye className="h-4 w-4 mr-2" />Publicar</Button>
              </div>
            </>
          )}
        </div>

        <Card className="col-span-1">
          <CardHeader><CardTitle>Bloques</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {blockTypes.map(bt => (
              <Button key={bt.type} variant="outline" className="w-full justify-start" onClick={() => addBlock(bt.type)}>
                <span className="mr-2">{bt.icon}</span>{bt.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
