import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Folder, CheckCircle, BarChart, Plus, Play, Pause, Square, Calendar, TrendingUp } from 'lucide-react';
import { AreaChart, Area, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const weeklyHoursData = [
  { day: 'Lun', horas: 7.5, facturables: 6.5 },
  { day: 'Mar', horas: 8.0, facturables: 7.0 },
  { day: 'Mié', horas: 6.5, facturables: 5.5 },
  { day: 'Jue', horas: 8.5, facturables: 7.5 },
  { day: 'Vie', horas: 7.0, facturables: 6.0 },
];

const byProjectData = [
  { name: 'EXP-2024-001', value: 35, color: '#8b5cf6' },
  { name: 'EXP-2024-002', value: 25, color: '#3b82f6' },
  { name: 'EXP-2024-003', value: 20, color: '#10b981' },
  { name: 'Otros', value: 20, color: '#f59e0b' },
];

export const LegalTimesheetModule: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedProject, setSelectedProject] = useState('EXP-2024-001');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const todayEntries = [
    { id: '1', case: 'EXP-2024-001', client: 'Empresa ABC', task: 'Revisión contrato', hours: 2.5, status: 'approved', rate: 120 },
    { id: '2', case: 'EXP-2024-002', client: 'García Hermanos', task: 'Llamada cliente', hours: 0.5, status: 'pending', rate: 120 },
    { id: '3', case: 'EXP-2024-001', client: 'Empresa ABC', task: 'Redacción demanda', hours: 3.0, status: 'pending', rate: 150 },
    { id: '4', case: 'EXP-2024-003', client: 'Constructora Norte', task: 'Investigación precedentes', hours: 1.5, status: 'approved', rate: 120 },
  ];

  const totalHours = todayEntries.reduce((s, e) => s + e.hours, 0);
  const totalBillable = todayEntries.reduce((s, e) => s + (e.hours * e.rate), 0);
  const approvedHours = todayEntries.filter(e => e.status === 'approved').reduce((s, e) => s + e.hours, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Clock className="h-5 w-5 text-white" />
            </div>
            Control de Tiempos
          </h2>
          <p className="text-muted-foreground">Registro de horas por proyecto</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Entrada Manual
          </Button>
        </div>
      </motion.div>

      {/* Timer Card */}
      <motion.div variants={itemVariants}>
        <Card className={`overflow-hidden ${isTracking ? 'border-violet-500 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent' : ''}`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-mono font-bold tracking-tight">{formatTime(elapsedTime)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Tiempo actual</p>
                </div>
                {isTracking && (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-violet-500 animate-pulse" />
                    <span className="text-sm text-violet-500 font-medium">Registrando...</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <select 
                  className="h-10 px-3 rounded-lg border bg-background text-sm"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="EXP-2024-001">EXP-2024-001 - Empresa ABC</option>
                  <option value="EXP-2024-002">EXP-2024-002 - García Hermanos</option>
                  <option value="EXP-2024-003">EXP-2024-003 - Constructora Norte</option>
                </select>
                
                <div className="flex gap-2">
                  <Button 
                    size="lg"
                    className={isTracking 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' 
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                    }
                    onClick={() => setIsTracking(!isTracking)}
                  >
                    {isTracking ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                    {isTracking ? 'Pausar' : 'Iniciar'}
                  </Button>
                  {isTracking && (
                    <Button 
                      size="lg" 
                      variant="destructive"
                      onClick={() => { setIsTracking(false); setElapsedTime(0); }}
                    >
                      <Square className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas Hoy</p>
                <p className="text-3xl font-bold">{totalHours}h</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Facturables</p>
                <p className="text-3xl font-bold">{totalBillable.toLocaleString()} €</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprobadas</p>
                <p className="text-3xl font-bold">{approvedHours}h</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proyectos</p>
                <p className="text-3xl font-bold">{new Set(todayEntries.map(e => e.case)).size}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Folder className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Horas Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyHoursData}>
                <defs>
                  <linearGradient id="horasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="horas" stroke="#3b82f6" fill="url(#horasGrad)" strokeWidth={2} name="Totales" />
                <Area type="monotone" dataKey="facturables" stroke="#10b981" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Facturables" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-500" />
              Por Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={byProjectData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={3} dataKey="value">
                  {byProjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {byProjectData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Today's Entries */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Registros de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayEntries.map((entry, index) => (
                <motion.div 
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{entry.task}</p>
                      <p className="text-sm text-muted-foreground">{entry.case} · {entry.client}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-mono font-bold text-lg">{entry.hours}h</span>
                      <p className="text-xs text-muted-foreground">{(entry.hours * entry.rate).toLocaleString()} €</p>
                    </div>
                    <Badge className={entry.status === 'approved' 
                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                    }>
                      {entry.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
