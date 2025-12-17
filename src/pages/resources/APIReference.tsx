import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Code, Lock, Zap, Database, FileJson, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoreFooter from '@/components/store/StoreFooter';

const APIReference: React.FC = () => {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/companies',
      description: 'Lista todas las empresas del usuario',
      auth: true
    },
    {
      method: 'GET',
      path: '/api/v1/companies/:id',
      description: 'Obtiene detalles de una empresa',
      auth: true
    },
    {
      method: 'POST',
      path: '/api/v1/companies',
      description: 'Crea una nueva empresa',
      auth: true
    },
    {
      method: 'PUT',
      path: '/api/v1/companies/:id',
      description: 'Actualiza una empresa existente',
      auth: true
    },
    {
      method: 'DELETE',
      path: '/api/v1/companies/:id',
      description: 'Elimina una empresa',
      auth: true
    },
    {
      method: 'GET',
      path: '/api/v1/visits',
      description: 'Lista todas las visitas',
      auth: true
    },
    {
      method: 'POST',
      path: '/api/v1/visits',
      description: 'Registra una nueva visita',
      auth: true
    },
    {
      method: 'GET',
      path: '/api/v1/goals',
      description: 'Lista objetivos del usuario',
      auth: true
    },
    {
      method: 'GET',
      path: '/api/v1/analytics/dashboard',
      description: 'Datos del dashboard analítico',
      auth: true
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-emerald-400 bg-emerald-400/10';
      case 'POST': return 'text-blue-400 bg-blue-400/10';
      case 'PUT': return 'text-yellow-400 bg-yellow-400/10';
      case 'DELETE': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/store">
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la tienda
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm mb-6">
            <Code className="w-4 h-4" />
            API Reference
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">API de ObelixIA</h1>
          <p className="text-xl text-slate-400">
            Integra ObelixIA en tus aplicaciones con nuestra API REST.
          </p>
        </div>
      </section>

      {/* Base URL */}
      <section className="px-4 pb-12">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              Base URL
            </h2>
            <code className="block bg-slate-800 rounded-lg p-4 text-emerald-400 font-mono text-sm">
              https://api.obelixia.com/v1
            </code>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="px-4 pb-12">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              Autenticación
            </h2>
            <p className="text-slate-400 mb-4">
              Todas las peticiones deben incluir un token JWT en el header de autorización:
            </p>
            <code className="block bg-slate-800 rounded-lg p-4 text-emerald-400 font-mono text-sm overflow-x-auto">
              Authorization: Bearer YOUR_ACCESS_TOKEN
            </code>
            <p className="text-sm text-slate-500 mt-4">
              Obtén tu token de acceso desde el panel de administración de tu cuenta.
            </p>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="px-4 pb-12">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-400" />
            Endpoints
          </h2>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 hover:border-emerald-500/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg font-mono text-sm font-semibold ${getMethodColor(endpoint.method)} w-fit`}>
                    {endpoint.method}
                  </span>
                  <code className="text-slate-300 font-mono text-sm">{endpoint.path}</code>
                  {endpoint.auth && (
                    <Lock className="w-4 h-4 text-yellow-500 hidden sm:block" />
                  )}
                </div>
                <p className="text-slate-400 text-sm mt-2">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="px-4 pb-12">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileJson className="w-5 h-5 text-emerald-400" />
              Ejemplo de Respuesta
            </h2>
            <pre className="bg-slate-800 rounded-lg p-4 text-sm overflow-x-auto">
              <code className="text-slate-300">
{`{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "uuid",
        "name": "Empresa S.L.",
        "tax_id": "B12345678",
        "sector": "banking",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "per_page": 20
    }
  }
}`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="px-4 pb-12">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/20">
            <h2 className="text-lg font-semibold text-white mb-2">Límites de uso</h2>
            <p className="text-slate-400 text-sm">
              La API tiene un límite de <strong className="text-white">1000 peticiones por hora</strong> por token. 
              Si necesitas un límite mayor, contacta con nosotros para discutir opciones enterprise.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">¿Necesitas ayuda con la integración?</h2>
          <p className="text-slate-400 mb-8">
            Nuestro equipo técnico está disponible para ayudarte.
          </p>
          <Link to="/contact">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Contactar soporte técnico
            </Button>
          </Link>
        </div>
      </section>

      <StoreFooter />
    </div>
  );
};

export default APIReference;
