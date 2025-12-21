import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientLogo {
  name: string;
  logo_url?: string | null;
  gradientColor?: string;
}

interface ClientLogosBarProps {
  clients: ClientLogo[];
  speed?: number; // pixels per second
}

export const ClientLogosBar: React.FC<ClientLogosBarProps> = ({
  clients,
  speed = 30
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Duplicate clients for seamless loop
  const duplicatedClients = [...clients, ...clients];

  const duration = (clients.length * 150) / speed;

  return (
    <div className="relative py-8">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

      {/* Scrolling container */}
      <div 
        ref={containerRef}
        className="overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          className="flex items-center gap-12"
          animate={{
            x: isPaused ? undefined : [0, -(clients.length * 150)]
          }}
          transition={{
            x: {
              duration: duration,
              repeat: Infinity,
              ease: 'linear'
            }
          }}
          style={{ willChange: 'transform' }}
        >
          {duplicatedClients.map((client, i) => (
            <div
              key={`${client.name}-${i}`}
              className="flex-shrink-0 flex items-center justify-center w-28 h-16 px-4 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
            >
              {client.logo_url ? (
                <img
                  src={client.logo_url}
                  alt={client.name}
                  className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 
                    className="w-5 h-5 opacity-40 group-hover:opacity-70 transition-opacity"
                    style={{ color: client.gradientColor || '#3B82F6' }}
                  />
                  <span className="text-xs text-slate-500 group-hover:text-slate-400 font-medium truncate">
                    {client.name}
                  </span>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-slate-400 flex items-center gap-1.5">
            <Pause className="w-3 h-3" />
            Pausado
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientLogosBar;
