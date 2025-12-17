import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoreFooter from '@/components/store/StoreFooter';

const Blog: React.FC = () => {
  const posts = [
    {
      title: 'Cómo DORA está transformando la resiliencia operativa en banca',
      excerpt: 'El Reglamento DORA establece nuevos estándares de resiliencia digital para el sector financiero. Descubre cómo preparar tu organización.',
      author: 'Equipo ObelixIA',
      date: '15 Dic 2024',
      category: 'Compliance',
      readTime: '8 min',
      featured: true
    },
    {
      title: 'IA en la gestión de carteras bancarias: Casos de uso prácticos',
      excerpt: 'Exploramos cómo la inteligencia artificial está revolucionando la gestión de carteras de clientes en el sector bancario.',
      author: 'Equipo ObelixIA',
      date: '10 Dic 2024',
      category: 'Inteligencia Artificial',
      readTime: '6 min'
    },
    {
      title: 'NIS2: Lo que necesitas saber sobre la nueva directiva',
      excerpt: 'La Directiva NIS2 amplía los requisitos de ciberseguridad. Te explicamos los puntos clave y cómo afecta a tu empresa.',
      author: 'Equipo ObelixIA',
      date: '5 Dic 2024',
      category: 'Seguridad',
      readTime: '10 min'
    },
    {
      title: 'Optimización de rutas comerciales con geolocalización',
      excerpt: 'Mejora la eficiencia de tu equipo comercial con herramientas de planificación de rutas inteligentes.',
      author: 'Equipo ObelixIA',
      date: '28 Nov 2024',
      category: 'Productividad',
      readTime: '5 min'
    },
    {
      title: 'Análisis financiero automatizado: Del balance al insight',
      excerpt: 'Cómo las herramientas de análisis automático pueden transformar datos financieros en decisiones estratégicas.',
      author: 'Equipo ObelixIA',
      date: '20 Nov 2024',
      category: 'Finanzas',
      readTime: '7 min'
    }
  ];

  const categories = ['Todos', 'Compliance', 'Inteligencia Artificial', 'Seguridad', 'Productividad', 'Finanzas'];

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
            <BookOpen className="w-4 h-4" />
            Blog
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Recursos y Artículos</h1>
          <p className="text-xl text-slate-400">
            Insights sobre tecnología, compliance y gestión empresarial.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={index === 0 ? 'default' : 'outline'}
                size="sm"
                className={index === 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'border-slate-700 text-slate-400 hover:text-white'}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {posts.filter(p => p.featured).map((post, index) => (
        <section key={index} className="px-4 pb-12">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-8 border border-emerald-500/20">
              <span className="inline-block bg-emerald-500 text-white text-xs px-2 py-1 rounded mb-4">
                Destacado
              </span>
              <h2 className="text-2xl font-bold text-white mb-3">{post.title}</h2>
              <p className="text-slate-400 mb-4">{post.excerpt}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {post.category}
                </span>
              </div>
              <Button className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white">
                Leer artículo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      ))}

      {/* Posts Grid */}
      <section className="px-4 pb-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6">
            {posts.filter(p => !p.featured).map((post, index) => (
              <article key={index} className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <span className="inline-block bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded mb-3">
                  {post.category}
                </span>
                <h3 className="text-lg font-semibold text-white mb-2 hover:text-emerald-400 transition-colors">
                  {post.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{post.date}</span>
                  <span>{post.readTime} lectura</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Suscríbete a nuestro newsletter</h2>
          <p className="text-slate-400 mb-6">
            Recibe las últimas novedades sobre tecnología bancaria y compliance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Suscribirse
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Al suscribirte, aceptas nuestra <Link to="/privacy" className="text-emerald-400 hover:underline">Política de Privacidad</Link>.
          </p>
        </div>
      </section>

      <StoreFooter />
    </div>
  );
};

export default Blog;
