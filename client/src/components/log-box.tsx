import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface LogBoxProps {
  logs: string[];
  className?: string;
}

export default function LogBox({ logs, className }: LogBoxProps) {
  return (
    <div className={cn("border rounded-lg bg-black/95", className)}>
      <ScrollArea className="h-[300px] w-full">
        <div className="p-4 font-mono text-sm">
          {logs.map((log, index) => (
            <div 
              key={index} 
              className={cn(
                "text-white/90 py-0.5",
                log.includes('Error') || log.includes('failed') ? 'text-red-400' :
                log.includes('success') || log.includes('completed') ? 'text-green-400' :
                log.includes('Running') || log.includes('Starting') ? 'text-blue-400' :
                'text-white/75'
              )}
            >
              {log}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
