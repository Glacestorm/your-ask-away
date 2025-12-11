import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import { RealtimeChatPanel } from '@/components/chat/RealtimeChatPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const RealtimeChatCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Chat en Tiempo Real</CardTitle>
                <CardDescription>Comunicación instantánea con tu equipo</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="h-4 w-4 mr-1" />
                    Minimizar
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-1" />
                    Expandir
                  </>
                )}
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setIsFullscreen(true)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Abrir Chat
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="h-[400px] border rounded-lg overflow-hidden">
              <RealtimeChatPanel />
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat en Tiempo Real
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-0">
            <RealtimeChatPanel />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
