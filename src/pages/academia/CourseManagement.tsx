import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Video, 
  FileText,
  GripVertical,
  Save,
  Eye,
  EyeOff,
  Clock,
  Users,
  ChevronLeft,
  Layers,
  PlayCircle,
  Upload,
  FolderUp
} from 'lucide-react';
import { ContentUploader } from '@/components/academia/ContentUploader';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  duration_hours: number | null;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  content_text: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_published: boolean;
}

const CATEGORIES = [
  'Desarrollo Web',
  'Marketing Digital',
  'Finanzas',
  'Liderazgo',
  'Productividad',
  'Diseño',
  'Programación',
  'Negocios',
  'Otros'
];

const LEVELS = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' }
];

const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'text', label: 'Texto', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: BookOpen }
];

export default function CourseManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [isUploadMediaOpen, setIsUploadMediaOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'estructura' | 'contenido'>('estructura');

  // Course form state
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    duration_hours: 0,
    thumbnail_url: '',
    is_published: false
  });

  // Module form state
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    is_published: false
  });

  // Lesson form state
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content_type: 'video',
    content_url: '',
    content_text: '',
    duration_minutes: 0,
    is_published: false
  });

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('academia_courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Course[];
    }
  });

  // Fetch modules for selected course
  const { data: modules = [] } = useQuery({
    queryKey: ['course-modules', selectedCourse?.id],
    queryFn: async () => {
      if (!selectedCourse) return [];
      
      const { data, error } = await (supabase as any)
        .from('academia_modules')
        .select('*')
        .eq('course_id', selectedCourse.id)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as Module[];
    },
    enabled: !!selectedCourse
  });

  // Fetch lessons for selected module
  const { data: lessons = [] } = useQuery({
    queryKey: ['module-lessons', selectedModuleId],
    queryFn: async () => {
      if (!selectedModuleId) return [];
      
      const { data, error } = await (supabase as any)
        .from('academia_lessons')
        .select('*')
        .eq('module_id', selectedModuleId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!selectedModuleId
  });

  // Course mutations
  const createCourse = useMutation({
    mutationFn: async (data: typeof courseForm) => {
      const { error } = await (supabase as any)
        .from('academia_courses')
        .insert([{
          ...data,
          instructor_id: user?.id
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setIsCreateCourseOpen(false);
      resetCourseForm();
      toast.success('Curso creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear el curso');
      console.error(error);
    }
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Course> }) => {
      const { error } = await (supabase as any)
        .from('academia_courses')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Curso actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar el curso');
      console.error(error);
    }
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('academia_courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setSelectedCourse(null);
      toast.success('Curso eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar el curso');
      console.error(error);
    }
  });

  // Module mutations
  const createModule = useMutation({
    mutationFn: async (data: typeof moduleForm) => {
      const maxOrder = modules.length > 0 
        ? Math.max(...modules.map(m => m.order_index)) + 1 
        : 0;
      
      const { error } = await (supabase as any)
        .from('academia_modules')
        .insert([{
          ...data,
          course_id: selectedCourse?.id,
          order_index: maxOrder
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules'] });
      setIsCreateModuleOpen(false);
      resetModuleForm();
      toast.success('Módulo creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear el módulo');
      console.error(error);
    }
  });

  const updateModule = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Module> }) => {
      const { error } = await (supabase as any)
        .from('academia_modules')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules'] });
      setEditingModule(null);
      toast.success('Módulo actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar el módulo');
      console.error(error);
    }
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('academia_modules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules'] });
      toast.success('Módulo eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar el módulo');
      console.error(error);
    }
  });

  // Lesson mutations
  const createLesson = useMutation({
    mutationFn: async (data: typeof lessonForm) => {
      const moduleLessons = lessons.filter(l => l.module_id === selectedModuleId);
      const maxOrder = moduleLessons.length > 0 
        ? Math.max(...moduleLessons.map(l => l.order_index)) + 1 
        : 0;
      
      const { error } = await (supabase as any)
        .from('academia_lessons')
        .insert([{
          ...data,
          module_id: selectedModuleId,
          order_index: maxOrder
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-lessons'] });
      setIsCreateLessonOpen(false);
      resetLessonForm();
      toast.success('Lección creada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear la lección');
      console.error(error);
    }
  });

  const updateLesson = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lesson> }) => {
      const { error } = await (supabase as any)
        .from('academia_lessons')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-lessons'] });
      setEditingLesson(null);
      toast.success('Lección actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar la lección');
      console.error(error);
    }
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('academia_lessons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-lessons'] });
      toast.success('Lección eliminada');
    },
    onError: (error) => {
      toast.error('Error al eliminar la lección');
      console.error(error);
    }
  });

  const resetCourseForm = () => {
    setCourseForm({
      title: '',
      description: '',
      category: '',
      level: 'beginner',
      duration_hours: 0,
      thumbnail_url: '',
      is_published: false
    });
  };

  const resetModuleForm = () => {
    setModuleForm({
      title: '',
      description: '',
      is_published: false
    });
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      description: '',
      content_type: 'video',
      content_url: '',
      content_text: '',
      duration_minutes: 0,
      is_published: false
    });
  };

  const handleEditCourse = (course: Course) => {
    setCourseForm({
      title: course.title,
      description: course.description || '',
      category: course.category || '',
      level: course.level || 'beginner',
      duration_hours: course.duration_hours || 0,
      thumbnail_url: course.thumbnail_url || '',
      is_published: course.is_published
    });
    setSelectedCourse(course);
  };

  if (selectedCourse) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedCourse(null)}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{selectedCourse.title}</h1>
              <p className="text-muted-foreground">
                {modules.length} módulos • {lessons.length} lecciones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedCourse.is_published ? "outline" : "default"}
              onClick={() => updateCourse.mutate({
                id: selectedCourse.id,
                data: { is_published: !selectedCourse.is_published }
              })}
            >
              {selectedCourse.is_published ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Despublicar
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>
            <Button variant="destructive" size="icon" onClick={() => deleteCourse.mutate(selectedCourse.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs para Estructura y Contenido Multimedia */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'estructura' | 'contenido')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="estructura" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Estructura
            </TabsTrigger>
            <TabsTrigger value="contenido" className="flex items-center gap-2">
              <FolderUp className="w-4 h-4" />
              Subir Material
            </TabsTrigger>
          </TabsList>

          <TabsContent value="estructura" className="mt-6">
            {/* Course Editor - Estructura */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Course Details */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Detalles del Curso</CardTitle>
                </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input 
                  value={courseForm.title} 
                  onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea 
                  value={courseForm.description} 
                  onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select 
                  value={courseForm.category} 
                  onValueChange={(value) => setCourseForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nivel</Label>
                <Select 
                  value={courseForm.level} 
                  onValueChange={(value) => setCourseForm(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duración (horas)</Label>
                <Input 
                  type="number" 
                  value={courseForm.duration_hours} 
                  onChange={(e) => setCourseForm(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>URL Thumbnail</Label>
                <Input 
                  value={courseForm.thumbnail_url} 
                  onChange={(e) => setCourseForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => updateCourse.mutate({ id: selectedCourse.id, data: courseForm })}
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>

          {/* Modules & Lessons */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Módulos y Lecciones</CardTitle>
              <Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Módulo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Módulo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Título</Label>
                      <Input 
                        value={moduleForm.title}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Descripción</Label>
                      <Textarea 
                        value={moduleForm.description}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={moduleForm.is_published}
                        onCheckedChange={(checked) => setModuleForm(prev => ({ ...prev, is_published: checked }))}
                      />
                      <Label>Publicar inmediatamente</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateModuleOpen(false)}>Cancelar</Button>
                    <Button onClick={() => createModule.mutate(moduleForm)}>Crear Módulo</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Accordion type="single" collapsible className="space-y-2">
                  {modules.map((module, idx) => (
                    <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <Layers className="w-4 h-4" />
                          <span className="font-medium">{idx + 1}. {module.title}</span>
                          <Badge variant={module.is_published ? "default" : "secondary"} className="ml-auto mr-4">
                            {module.is_published ? 'Publicado' : 'Borrador'}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">{module.description || 'Sin descripción'}</p>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedModuleId(module.id);
                                  setIsCreateLessonOpen(true);
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Lección
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => updateModule.mutate({ 
                                  id: module.id, 
                                  data: { is_published: !module.is_published } 
                                })}
                              >
                                {module.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => deleteModule.mutate(module.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Lessons list */}
                          {selectedModuleId === module.id && lessons.length > 0 && (
                            <div className="space-y-2 pl-4 border-l-2">
                              {lessons.map((lesson, lessonIdx) => (
                                <div 
                                  key={lesson.id} 
                                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <GripVertical className="w-3 h-3 text-muted-foreground" />
                                    {lesson.content_type === 'video' && <Video className="w-4 h-4 text-blue-500" />}
                                    {lesson.content_type === 'text' && <FileText className="w-4 h-4 text-green-500" />}
                                    {lesson.content_type === 'quiz' && <BookOpen className="w-4 h-4 text-purple-500" />}
                                    <span className="text-sm">{lessonIdx + 1}. {lesson.title}</span>
                                    {lesson.duration_minutes && (
                                      <span className="text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {lesson.duration_minutes} min
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Badge variant={lesson.is_published ? "default" : "secondary"} className="text-xs">
                                      {lesson.is_published ? 'Pub' : 'Borr'}
                                    </Badge>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-7 w-7"
                                      onClick={() => updateLesson.mutate({ 
                                        id: lesson.id, 
                                        data: { is_published: !lesson.is_published } 
                                      })}
                                    >
                                      {lesson.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-7 w-7"
                                      onClick={() => deleteLesson.mutate(lesson.id)}
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {selectedModuleId !== module.id && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedModuleId(module.id)}
                            >
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Ver lecciones
                            </Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {modules.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay módulos aún</p>
                    <p className="text-sm">Crea el primer módulo para este curso</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            </Card>
          </div>
          </TabsContent>

          {/* TabsContent para Subir Material */}
          <TabsContent value="contenido" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderUp className="w-5 h-5" />
                  Subir Material Audiovisual
                </CardTitle>
                <CardDescription>
                  Sube videos, PDFs, imágenes y audios para tus lecciones. Arrastra y suelta archivos o haz clic para seleccionar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentUploader 
                  courseId={selectedCourse.id}
                  onUploadComplete={(files) => {
                    toast.success(`${files.length} archivo(s) subidos correctamente`);
                    // Aquí podrías asociar los archivos a lecciones específicas
                  }}
                  maxFileSizeMB={500}
                  allowedTypes={['video', 'pdf', 'image', 'audio']}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <Dialog open={isCreateLessonOpen} onOpenChange={setIsCreateLessonOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Lección</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título</Label>
                <Input 
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea 
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de contenido</Label>
                  <Select 
                    value={lessonForm.content_type}
                    onValueChange={(value) => setLessonForm(prev => ({ ...prev, content_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duración (minutos)</Label>
                  <Input 
                    type="number"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              
              {lessonForm.content_type === 'video' && (
                <div>
                  <Label>URL del Video</Label>
                  <Input 
                    value={lessonForm.content_url}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, content_url: e.target.value }))}
                    placeholder="https://youtube.com/... o https://vimeo.com/..."
                  />
                </div>
              )}
              
              {lessonForm.content_type === 'text' && (
                <div>
                  <Label>Contenido</Label>
                  <Textarea 
                    value={lessonForm.content_text}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, content_text: e.target.value }))}
                    rows={6}
                    placeholder="Escribe el contenido de la lección..."
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Switch 
                  checked={lessonForm.is_published}
                  onCheckedChange={(checked) => setLessonForm(prev => ({ ...prev, is_published: checked }))}
                />
                <Label>Publicar inmediatamente</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateLessonOpen(false)}>Cancelar</Button>
              <Button onClick={() => createLesson.mutate(lessonForm)}>Crear Lección</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cursos</h1>
          <p className="text-muted-foreground">Administra cursos, módulos y lecciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/academia">
            <Button variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              Ver Catálogo
            </Button>
          </Link>
          <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Curso</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Título del Curso</Label>
                  <Input 
                    value={courseForm.title}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej: Introducción al Marketing Digital"
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea 
                    value={courseForm.description}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe el contenido y objetivos del curso..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoría</Label>
                    <Select 
                      value={courseForm.category}
                      onValueChange={(value) => setCourseForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nivel</Label>
                    <Select 
                      value={courseForm.level}
                      onValueChange={(value) => setCourseForm(prev => ({ ...prev, level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duración estimada (horas)</Label>
                    <Input 
                      type="number"
                      value={courseForm.duration_hours}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>URL Thumbnail</Label>
                    <Input 
                      value={courseForm.thumbnail_url}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={courseForm.is_published}
                    onCheckedChange={(checked) => setCourseForm(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label>Publicar inmediatamente</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateCourseOpen(false)}>Cancelar</Button>
                <Button onClick={() => createCourse.mutate(courseForm)}>Crear Curso</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-sm text-muted-foreground">Total Cursos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Eye className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.filter(c => c.is_published).length}</p>
                <p className="text-sm text-muted-foreground">Publicados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <EyeOff className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.filter(c => !c.is_published).length}</p>
                <p className="text-sm text-muted-foreground">Borradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Layers className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{modules.length}</p>
                <p className="text-sm text-muted-foreground">Módulos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <Card 
            key={course.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleEditCourse(course)}
          >
            <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
              {course.thumbnail_url ? (
                <img 
                  src={course.thumbnail_url} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <BookOpen className="w-12 h-12 text-muted-foreground/50" />
                </div>
              )}
              <Badge 
                className="absolute top-2 right-2"
                variant={course.is_published ? "default" : "secondary"}
              >
                {course.is_published ? 'Publicado' : 'Borrador'}
              </Badge>
            </div>
            <CardContent className="pt-4">
              <h3 className="font-semibold line-clamp-1">{course.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {course.description || 'Sin descripción'}
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                {course.category && (
                  <Badge variant="outline">{course.category}</Badge>
                )}
                {course.duration_hours && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {course.duration_hours}h
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {courses.length === 0 && !coursesLoading && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold">No hay cursos aún</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crea tu primer curso para comenzar
              </p>
              <Button className="mt-4" onClick={() => setIsCreateCourseOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Curso
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
