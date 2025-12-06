import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function GoalsAlertsDashboardCard() {
  const navigate = useNavigate();

  return (
    <Card className="group relative overflow-hidden border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 via-background to-orange-600/10 transition-all duration-500 hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-orange-500/50">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-bold">Alertes d'Objectius</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        <p className="text-sm text-muted-foreground">
          Gestiona i supervisa les alertes relacionades amb objectius i rendiment.
        </p>
        
        <Button 
          onClick={() => navigate('/admin?section=director-alerts')}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-300 hover:shadow-orange-500/50"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Veure Alertes
        </Button>
      </CardContent>
    </Card>
  );
}
