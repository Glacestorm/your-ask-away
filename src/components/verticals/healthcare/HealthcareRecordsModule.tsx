import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Lock, Paperclip, Search, Plus, User, Calendar } from 'lucide-react';

export const HealthcareRecordsModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const patients = [
    { id: '1', name: 'María García López', dni: '12345678A', lastVisit: '2024-01-15', age: 45, records: 12 },
    { id: '2', name: 'Juan Pérez Martín', dni: '23456789B', lastVisit: '2024-01-14', age: 62, records: 28 },
    { id: '3', name: 'Ana Rodríguez Sanz', dni: '34567890C', lastVisit: '2024-01-10', age: 33, records: 5 },
    { id: '4', name: 'Pedro Fernández Gil', dni: '45678901D', lastVisit: '2024-01-08', age: 55, records: 15 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Expedientes Médicos</h2>
          <p className="text-muted-foreground">Historial clínico digital seguro</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: FileText, label: 'Historia Clínica', color: 'text-red-500' },
          { icon: Lock, label: 'Encriptación', color: 'text-emerald-500' },
          { icon: Paperclip, label: 'Adjuntos', color: 'text-blue-500' },
          { icon: Search, label: 'Búsqueda Avanzada', color: 'text-violet-500' },
        ].map((feature, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <feature.icon className={`h-5 w-5 ${feature.color}`} />
              <span className="font-medium text-sm">{feature.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, DNI o número de expediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patients.map((patient) => (
          <Card key={patient.id} className="hover:border-red-500/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{patient.name}</h3>
                  <p className="text-sm text-muted-foreground">DNI: {patient.dni}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted-foreground">{patient.age} años</span>
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {patient.records} registros
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {patient.lastVisit}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
