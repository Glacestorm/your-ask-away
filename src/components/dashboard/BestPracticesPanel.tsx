import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Heart, Eye, Trophy, TrendingUp, Plus, Tag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BestPractice {
  id: string;
  gestor_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  likes_count: number;
  views_count: number;
  created_at: string;
  profiles: {
    full_name: string;
    gestor_number: string;
  };
  isLiked?: boolean;
}

const categories = [
  { value: "vinculacion", label: "Vinculación" },
  { value: "tpv", label: "TPV" },
  { value: "visitas", label: "Visitas" },
  { value: "negociacion", label: "Negociación" },
  { value: "otros", label: "Otros" },
];

export const BestPracticesPanel = () => {
  const { user } = useAuth();
  const [practices, setPractices] = useState<BestPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPractice, setNewPractice] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
  });

  useEffect(() => {
    if (user) {
      fetchPractices();
    }
  }, [user, selectedCategory]);

  const fetchPractices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("best_practices")
        .select(`
          *,
          profiles:gestor_id (full_name, gestor_number)
        `)
        .order("likes_count", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Check which practices the user has liked
      const practiceIds = data?.map((p) => p.id) || [];
      const { data: likesData } = await supabase
        .from("best_practice_likes")
        .select("practice_id")
        .eq("user_id", user!.id)
        .in("practice_id", practiceIds);

      const likedIds = new Set(likesData?.map((l) => l.practice_id) || []);

      const practicesWithLikes = data?.map((practice) => ({
        ...practice,
        isLiked: likedIds.has(practice.id),
      })) || [];

      setPractices(practicesWithLikes);
    } catch (error) {
      console.error("Error fetching practices:", error);
      toast.error("Error al cargar las mejores prácticas");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (practiceId: string, isCurrentlyLiked: boolean) => {
    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from("best_practice_likes")
          .delete()
          .eq("practice_id", practiceId)
          .eq("user_id", user!.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("best_practice_likes")
          .insert({ practice_id: practiceId, user_id: user!.id });

        if (error) throw error;
      }

      // Increment view count
      await supabase
        .from("best_practices")
        .update({ views_count: practices.find(p => p.id === practiceId)!.views_count + 1 })
        .eq("id", practiceId);

      await fetchPractices();
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Error al actualizar el me gusta");
    }
  };

  const handleCreatePractice = async () => {
    try {
      if (!newPractice.title || !newPractice.content || !newPractice.category) {
        toast.error("Por favor completa todos los campos requeridos");
        return;
      }

      const tags = newPractice.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      const { error } = await supabase.from("best_practices").insert({
        gestor_id: user!.id,
        title: newPractice.title,
        content: newPractice.content,
        category: newPractice.category,
        tags,
      });

      if (error) throw error;

      toast.success("Práctica compartida exitosamente");
      setIsDialogOpen(false);
      setNewPractice({ title: "", content: "", category: "", tags: "" });
      await fetchPractices();
    } catch (error) {
      console.error("Error creating practice:", error);
      toast.error("Error al compartir la práctica");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mejores Prácticas</h2>
          <p className="text-muted-foreground">
            Aprende de las estrategias de los mejores gestores
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Compartir Práctica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compartir una Mejor Práctica</DialogTitle>
              <DialogDescription>
                Comparte tus estrategias de éxito con el equipo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newPractice.title}
                  onChange={(e) =>
                    setNewPractice({ ...newPractice, title: e.target.value })
                  }
                  placeholder="Ej: Técnica de cierre efectiva en TPV"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={newPractice.category}
                  onValueChange={(value) =>
                    setNewPractice({ ...newPractice, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Descripción</Label>
                <Textarea
                  id="content"
                  value={newPractice.content}
                  onChange={(e) =>
                    setNewPractice({ ...newPractice, content: e.target.value })
                  }
                  placeholder="Describe tu estrategia en detalle..."
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
                <Input
                  id="tags"
                  value={newPractice.tags}
                  onChange={(e) =>
                    setNewPractice({ ...newPractice, tags: e.target.value })
                  }
                  placeholder="Ej: cierre, negociación, comunicación"
                />
              </div>
              <Button onClick={handleCreatePractice} className="w-full">
                Compartir Práctica
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4 mt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando prácticas...</p>
            </div>
          ) : practices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay prácticas compartidas en esta categoría todavía
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {practices.map((practice) => (
                  <Card key={practice.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            {practice.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">
                                {practice.profiles?.full_name || "Gestor"}
                              </span>
                              {practice.profiles?.gestor_number && (
                                <span className="text-muted-foreground">
                                  (#{practice.profiles.gestor_number})
                                </span>
                              )}
                            </div>
                            <span className="text-muted-foreground">
                              {format(new Date(practice.created_at), "d MMM yyyy", {
                                locale: es,
                              })}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{practice.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {practice.content}
                      </p>
                      {practice.tags && practice.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {practice.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <Button
                          variant={practice.isLiked ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleLike(practice.id, practice.isLiked || false)}
                          className="gap-2"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              practice.isLiked ? "fill-current" : ""
                            }`}
                          />
                          <span>{practice.likes_count}</span>
                        </Button>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span>{practice.views_count || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
