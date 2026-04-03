import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  name?: string;
  defaultExpanded?: boolean;
}

export function JsonViewer({ data, name, defaultExpanded = true }: JsonViewerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);

  if (!isObject) {
    let valueColor = 'text-emerald-600 dark:text-emerald-400';
    if (typeof data === 'number') valueColor = 'text-blue-600 dark:text-blue-400';
    else if (typeof data === 'boolean') valueColor = 'text-purple-600 dark:text-purple-400';
    else if (data === null) valueColor = 'text-muted-foreground';

    return (
      <div className="flex font-mono text-sm pl-4 py-0.5">
        {name && <span className="text-blue-800 dark:text-blue-400 mr-1">"{name}":</span>}
        <span className={valueColor}>
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    );
  }

  const keys = Object.keys(data);
  const isEmpty = keys.length === 0;

  const toggleExpand = () => setExpanded(!expanded);

  return (
    <div className="font-mono text-sm">
      <div 
        className="flex items-center cursor-pointer hover:bg-muted py-0.5 rounded-sm px-1 -ml-1"
        onClick={toggleExpand}
      >
        <span className="w-4 h-4 flex items-center justify-center text-muted-foreground">
          {!isEmpty && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>
        {name && <span className="text-blue-800 dark:text-blue-400 mr-1">"{name}":</span>}
        <span className="text-foreground">
          {isArray ? '[' : '{'}
          {!expanded && !isEmpty && <span className="text-muted-foreground mx-1">...</span>}
          {isEmpty && (isArray ? ']' : '}')}
        </span>
        {!expanded && !isEmpty && <span className="text-foreground">{isArray ? ']' : '}'}</span>}
        <span className="text-muted-foreground text-xs ml-2">
          {isArray ? `${keys.length} items` : `${keys.length} keys`}
        </span>
      </div>
      
      {expanded && !isEmpty && (
        <div className="pl-4 border-l border-border ml-1">
          {keys.map((key, index) => (
            <div key={key}>
              <JsonViewer 
                data={data[key as keyof typeof data]} 
                name={isArray ? undefined : key} 
                defaultExpanded={false}
              />
            </div>
          ))}
        </div>
      )}
      
      {expanded && !isEmpty && (
        <div className="pl-1 text-foreground">
          {isArray ? ']' : '}'}
        </div>
      )}
    </div>
  );
}
