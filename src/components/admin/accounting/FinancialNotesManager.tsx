import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Save, Trash2, FileText, Edit } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FinancialNotesManagerProps {
  statementId: string;
  isLocked: boolean;
}

interface FinancialNote {
  id: string;
  statement_id: string;
  note_number: number;
  note_title: string;
  note_content: string | null;
}

const standardNotes = [
  { number: 1, title: 'Activitat de l\'empresa' },
  { number: 2, title: 'Bases de presentació dels comptes anuals' },
  { number: 3, title: 'Aplicació de resultats' },
  { number: 4, title: 'Normes de registre i valoració' },
  { number: 5, title: 'Immobilitzat material' },
  { number: 6, title: 'Inversions immobiliàries' },
  { number: 7, title: 'Immobilitzat intangible' },
  { number: 8, title: 'Arrendaments' },
  { number: 9, title: 'Instruments financers' },
  { number: 10, title: 'Existències' },
  { number: 11, title: 'Moneda estrangera' },
  { number: 12, title: 'Situació fiscal' },
  { number: 13, title: 'Ingressos i despeses' },
  { number: 14, title: 'Provisions i contingències' },
  { number: 15, title: 'Informació sobre medi ambient' },
  { number: 16, title: 'Subvencions, donacions i llegats' },
  { number: 17, title: 'Fets posteriors al tancament' },
  { number: 18, title: 'Operacions amb parts vinculades' },
  { number: 19, title: 'Altra informació' },
];

const FinancialNotesManager = ({ statementId, isLocked }: FinancialNotesManagerProps) => {
  const [notes, setNotes] = useState<FinancialNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<FinancialNote | null>(null);
  const [newNote, setNewNote] = useState({ number: 1, title: '', content: '' });

  useEffect(() => {
    fetchNotes();
  }, [statementId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_notes')
        .select('*')
        .eq('statement_id', statementId)
        .order('note_number');
      
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Error carregant notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.title.trim()) {
      toast.error('El títol és obligatori');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('financial_notes')
        .insert({
          statement_id: statementId,
          note_number: newNote.number,
          note_title: newNote.title,
          note_content: newNote.content
        });
      
      if (error) throw error;
      
      toast.success('Nota afegida correctament');
      setShowAddDialog(false);
      setNewNote({ number: 1, title: '', content: '' });
      fetchNotes();
    } catch (error: unknown) {
      console.error('Error adding note:', error);
      const errCode = (error as { code?: string })?.code;
      if (errCode === '23505') {
        toast.error('Ja existeix una nota amb aquest número');
      } else {
        toast.error('Error afegint nota');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('financial_notes')
        .update({
          note_title: editingNote.note_title,
          note_content: editingNote.note_content
        })
        .eq('id', editingNote.id);
      
      if (error) throw error;
      
      toast.success('Nota actualitzada correctament');
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Error actualitzant nota');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Estàs segur d\'eliminar aquesta nota?')) return;

    try {
      const { error } = await supabase.from('financial_notes').delete().eq('id', noteId);
      if (error) throw error;
      toast.success('Nota eliminada correctament');
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error eliminant nota');
    }
  };

  const selectStandardNote = (note: typeof standardNotes[0]) => {
    setNewNote(prev => ({ ...prev, number: note.number, title: note.title }));
  };

  if (loading) {
    return (
      <Card><CardContent className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Memòria - Notes dels Comptes Anuals
            </CardTitle>
            {!isLocked && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" /> Afegir Nota</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Afegir Nova Nota</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Notes Estàndard PGC</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                        {standardNotes.map(note => (
                          <Button
                            key={note.number}
                            variant="outline"
                            size="sm"
                            className="justify-start text-left h-auto py-2"
                            onClick={() => selectStandardNote(note)}
                          >
                            <span className="font-bold mr-2">{note.number}.</span>
                            <span className="truncate">{note.title}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Número</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newNote.number}
                          onChange={(e) => setNewNote(prev => ({ ...prev, number: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label>Títol</Label>
                        <Input
                          value={newNote.title}
                          onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Títol de la nota"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Contingut</Label>
                      <Textarea
                        value={newNote.content}
                        onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Contingut de la nota..."
                        rows={8}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel·lar</Button>
                      <Button onClick={handleAddNote} disabled={saving}>
                        {saving ? 'Guardant...' : 'Afegir'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Documentació explicativa dels comptes anuals segons el Pla General de Comptabilitat d'Andorra.
          </p>
        </CardContent>
      </Card>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hi ha notes</h3>
            <p className="text-muted-foreground">
              Afegeix notes explicatives per completar la memòria dels comptes anuals.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {notes.map(note => (
            <AccordionItem key={note.id} value={note.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {note.note_number}
                  </span>
                  <span className="font-medium">{note.note_title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 pb-4">
                  {editingNote?.id === note.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Títol</Label>
                        <Input
                          value={editingNote.note_title}
                          onChange={(e) => setEditingNote(prev => prev ? { ...prev, note_title: e.target.value } : null)}
                        />
                      </div>
                      <div>
                        <Label>Contingut</Label>
                        <Textarea
                          value={editingNote.note_content || ''}
                          onChange={(e) => setEditingNote(prev => prev ? { ...prev, note_content: e.target.value } : null)}
                          rows={8}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingNote(null)}>Cancel·lar</Button>
                        <Button onClick={handleUpdateNote} disabled={saving}>
                          <Save className="w-4 h-4 mr-2" /> Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="prose prose-sm max-w-none bg-muted/30 rounded-lg p-4 min-h-[100px]">
                        {note.note_content ? (
                          <p className="whitespace-pre-wrap">{note.note_content}</p>
                        ) : (
                          <p className="text-muted-foreground italic">Sense contingut</p>
                        )}
                      </div>
                      {!isLocked && (
                        <div className="flex justify-end gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => setEditingNote(note)}>
                            <Edit className="w-4 h-4 mr-2" /> Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteNote(note.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default FinancialNotesManager;
