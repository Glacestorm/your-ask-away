import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * ScrollArea (Safe)
 *
 * Radix ScrollArea puede provocar bucles de actualización (Maximum update depth) en algunas combinaciones
 * de React + Radix Presence. Para estabilizar la app, este wrapper usa overflow nativo.
 */
const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative overflow-auto overscroll-contain", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
ScrollArea.displayName = "ScrollArea";

/**
 * ScrollBar
 *
 * Mantiene compatibilidad con imports existentes. Con overflow nativo no se renderiza scrollbar custom.
 */
type ScrollBarProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "vertical" | "horizontal";
};

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>((_props, _ref) => null);
ScrollBar.displayName = "ScrollBar";


export { ScrollArea, ScrollBar };

