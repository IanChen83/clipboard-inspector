import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface XmlViewerProps {
  node: Node;
  defaultExpanded?: boolean;
  key?: React.Key;
}

export function XmlViewer({ node, defaultExpanded = true }: XmlViewerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Text node
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue?.trim();
    if (!text) return null;
    return <div className="pl-4 py-0.5 font-mono text-sm text-foreground">{text}</div>;
  }

  // CDATA section
  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return (
      <div className="pl-4 py-0.5 font-mono text-sm text-muted-foreground">
        {"<![CDATA["}
        <span className="text-foreground">{node.nodeValue}</span>
        {"]]>"}
      </div>
    );
  }

  // Comment node
  if (node.nodeType === Node.COMMENT_NODE) {
    return (
      <div className="pl-4 py-0.5 font-mono text-sm text-emerald-600 dark:text-emerald-400 italic">
        {"<!-- "}{node.nodeValue}{" -->"}
      </div>
    );
  }

  // DocumentFragment or Document node
  if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.DOCUMENT_NODE) {
    return (
      <>
        {Array.from(node.childNodes).map((child, i) => (
          <XmlViewer key={i} node={child} defaultExpanded={defaultExpanded} />
        ))}
      </>
    );
  }

  // Element node
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    const hasChildren = element.childNodes.length > 0;
    
    const attributes = Array.from(element.attributes).map(attr => (
      <span key={attr.name} className="ml-2">
        <span className="text-orange-600 dark:text-orange-400">{attr.name}</span>
        <span className="text-muted-foreground">="</span>
        <span className="text-blue-600 dark:text-blue-400">{attr.value}</span>
        <span className="text-muted-foreground">"</span>
      </span>
    ));

    const toggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded(!expanded);
    };

    return (
      <div className="font-mono text-sm">
        <div 
          className="flex items-start cursor-pointer hover:bg-muted py-0.5 rounded-sm px-1 -ml-1"
          onClick={hasChildren ? toggleExpand : undefined}
        >
          <span className="w-4 h-4 flex items-center justify-center text-muted-foreground mt-0.5 shrink-0">
            {hasChildren && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </span>
          <div className="flex-1 break-all">
            <span className="text-muted-foreground">&lt;</span>
            <span className="text-purple-700 dark:text-purple-400">{tagName}</span>
            {attributes}
            <span className="text-muted-foreground">{hasChildren ? (expanded ? '>' : ' ... >') : ' />'}</span>
            
            {!expanded && hasChildren && (
              <span className="text-muted-foreground ml-1">&lt;/{tagName}&gt;</span>
            )}
          </div>
        </div>

        {expanded && hasChildren && (
          <div className="pl-4 border-l border-border ml-1">
            {Array.from(element.childNodes).map((child, i) => (
              <XmlViewer key={i} node={child} defaultExpanded={false} />
            ))}
          </div>
        )}

        {expanded && hasChildren && (
          <div className="pl-1 text-muted-foreground">
            &lt;/<span className="text-purple-700 dark:text-purple-400">{tagName}</span>&gt;
          </div>
        )}
      </div>
    );
  }

  return null;
}
