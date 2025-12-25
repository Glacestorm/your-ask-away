/**
 * ResourcesPanel - Panel de recursos y materiales del curso
 */

import React from 'react';
import { 
  FileText, Download, ExternalLink, File, Image, 
  Code, FileSpreadsheet, FileArchive, Video, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'image' | 'code' | 'spreadsheet' | 'archive' | 'video' | 'audio' | 'link' | 'other';
  url: string;
  size?: string;
  lessonId?: string;
  description?: string;
  isExternal?: boolean;
}

interface ResourcesPanelProps {
  resources: Resource[];
  currentLessonId?: string;
  showAllResources?: boolean;
}

export const ResourcesPanel: React.FC<ResourcesPanelProps> = ({
  resources,
  currentLessonId,
  showAllResources = true,
}) => {
  const getResourceIcon = (type: Resource['type']) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'pdf':
        return <FileText className={cn(iconClass, "text-red-400")} />;
      case 'doc':
        return <FileText className={cn(iconClass, "text-blue-400")} />;
      case 'image':
        return <Image className={cn(iconClass, "text-green-400")} />;
      case 'code':
        return <Code className={cn(iconClass, "text-purple-400")} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={cn(iconClass, "text-green-500")} />;
      case 'archive':
        return <FileArchive className={cn(iconClass, "text-yellow-400")} />;
      case 'video':
        return <Video className={cn(iconClass, "text-pink-400")} />;
      case 'audio':
        return <Headphones className={cn(iconClass, "text-orange-400")} />;
      case 'link':
        return <ExternalLink className={cn(iconClass, "text-cyan-400")} />;
      default:
        return <File className={cn(iconClass, "text-slate-400")} />;
    }
  };

  const getTypeLabel = (type: Resource['type']) => {
    const labels: Record<Resource['type'], string> = {
      pdf: 'PDF',
      doc: 'Document',
      image: 'Image',
      code: 'Code',
      spreadsheet: 'Spreadsheet',
      archive: 'Archive',
      video: 'Video',
      audio: 'Audio',
      link: 'Link',
      other: 'File',
    };
    return labels[type];
  };

  // Group resources
  const currentLessonResources = resources.filter(r => r.lessonId === currentLessonId);
  const allResources = showAllResources ? resources : currentLessonResources;
  const courseResources = resources.filter(r => !r.lessonId);

  const handleDownload = (resource: Resource) => {
    if (resource.isExternal) {
      window.open(resource.url, '_blank');
    } else {
      // Simulate download
      const a = document.createElement('a');
      a.href = resource.url;
      a.download = resource.title;
      a.click();
    }
  };

  const ResourceItem: React.FC<{ resource: Resource }> = ({ resource }) => (
    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors group">
      <div className="shrink-0">
        {getResourceIcon(resource.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white line-clamp-1">
          {resource.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-[10px] h-4 border-slate-600">
            {getTypeLabel(resource.type)}
          </Badge>
          {resource.size && (
            <span className="text-xs text-slate-500">{resource.size}</span>
          )}
        </div>
        {resource.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            {resource.description}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => handleDownload(resource)}
      >
        {resource.isExternal ? (
          <ExternalLink className="w-4 h-4" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-lg border border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-white">Resources</h3>
          <Badge variant="secondary" className="text-xs">
            {allResources.length}
          </Badge>
        </div>
      </div>

      {/* Resources List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Current Lesson Resources */}
          {currentLessonResources.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                This Lesson
              </h4>
              <div className="space-y-2">
                {currentLessonResources.map((resource) => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          )}

          {/* Course Resources */}
          {courseResources.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Course Materials
              </h4>
              <div className="space-y-2">
                {courseResources.map((resource) => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          )}

          {/* All other resources */}
          {showAllResources && allResources.length > currentLessonResources.length + courseResources.length && (
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                All Resources
              </h4>
              <div className="space-y-2">
                {allResources
                  .filter(r => r.lessonId && r.lessonId !== currentLessonId)
                  .map((resource) => (
                    <ResourceItem key={resource.id} resource={resource} />
                  ))}
              </div>
            </div>
          )}

          {allResources.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No resources available</p>
              <p className="text-slate-500 text-xs mt-1">
                Resources will appear here as you progress through the course
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ResourcesPanel;
