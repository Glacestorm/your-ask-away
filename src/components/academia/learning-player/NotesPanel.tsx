/**
 * NotesPanel - Panel para tomar notas durante el curso
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StickyNote, Plus, Trash2, Clock, Download, Search,
  Bold, Italic, List, Link as LinkIcon, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface Note {
  id: string;
  content: string;
  lessonId: string;
  lessonTitle: string;
  timestamp: number; // Video timestamp in seconds
  createdAt: Date;
  updatedAt: Date;
}

interface NotesPanelProps {
  courseId: string;
  currentLessonId: string;
  currentLessonTitle: string;
  currentVideoTime?: number;
  onTimestampClick?: (lessonId: string, timestamp: number) => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  courseId,
  currentLessonId,
  currentLessonTitle,
  currentVideoTime = 0,
  onTimestampClick,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByLesson, setFilterByLesson] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`course-notes-${courseId}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes).map((n: Note) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      })));
    }
  }, [courseId]);

  // Save notes to localStorage
  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem(`course-notes-${courseId}`, JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const newNote: Note = {
      id: crypto.randomUUID(),
      content: newNoteContent,
      lessonId: currentLessonId,
      lessonTitle: currentLessonTitle,
      timestamp: currentVideoTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    saveNotes([newNote, ...notes]);
    setNewNoteContent('');
    toast.success('Note saved');
  };

  const handleUpdateNote = (noteId: string) => {
    if (!editContent.trim()) return;

    const updatedNotes = notes.map(note =>
      note.id === noteId
        ? { ...note, content: editContent, updatedAt: new Date() }
        : note
    );
    saveNotes(updatedNotes);
    setEditingNoteId(null);
    setEditContent('');
    toast.success('Note updated');
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    saveNotes(updatedNotes);
    toast.success('Note deleted');
  };

  const handleExportNotes = () => {
    const notesToExport = filterByLesson 
      ? notes.filter(n => n.lessonId === currentLessonId)
      : notes;
    
    const content = notesToExport
      .map(note => `[${note.lessonTitle} - ${formatTimestamp(note.timestamp)}]\n${note.content}\n`)
      .join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-notes-${courseId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Notes exported');
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLesson = filterByLesson ? note.lessonId === currentLessonId : true;
    return matchesSearch && matchesLesson;
  });

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-lg border border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-white">My Notes</h3>
            <Badge variant="secondary" className="text-xs">
              {notes.length}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={handleExportNotes}
            disabled={notes.length === 0}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-slate-800/50 border-slate-700"
            />
          </div>
          <Button
            variant={filterByLesson ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterByLesson(!filterByLesson)}
            className="shrink-0"
          >
            This lesson
          </Button>
        </div>
      </div>

      {/* New Note Form */}
      <div className="p-4 border-b border-slate-800">
        <div className="relative">
          <Textarea
            placeholder="Take a note... (Ctrl+Enter to save)"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleAddNote();
              }
            }}
            className="min-h-[80px] bg-slate-800/50 border-slate-700 resize-none pr-20"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
              <Clock className="w-3 h-3 mr-1" />
              {formatTimestamp(currentVideoTime)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Bold className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Italic className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <LinkIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button 
            size="sm" 
            onClick={handleAddNote}
            disabled={!newNoteContent.trim()}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredNotes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <StickyNote className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  {searchQuery ? 'No notes match your search' : 'No notes yet'}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Take notes while watching to remember key points
                </p>
              </motion.div>
            ) : (
              filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-slate-800/50 rounded-lg p-3 group"
                >
                  {editingNoteId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px] bg-slate-900 border-slate-700 resize-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditContent('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                        >
                          <Save className="w-3.5 h-3.5 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => onTimestampClick?.(note.lessonId, note.timestamp)}
                          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(note.timestamp)}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditContent(note.content);
                            }}
                          >
                            <StickyNote className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete note?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      {note.lessonId !== currentLessonId && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-1">
                          {note.lessonTitle}
                        </p>
                      )}
                    </>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};

export default NotesPanel;
