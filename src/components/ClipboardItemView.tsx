import React, { useState, useEffect } from 'react';
import { JsonViewer } from './JsonViewer';
import { XmlViewer } from './XmlViewer';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface ClipboardItemViewProps {
  type: string;
  data: string | Blob;
}

export function ClipboardItemView({ type, data }: ClipboardItemViewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [parsedXml, setParsedXml] = useState<Node | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof data === 'string') {
      setContent(data);
      parseContent(data, type);
    } else if (data instanceof Blob) {
      if (type.startsWith('image/')) {
        const url = URL.createObjectURL(data);
        setImageUrl(url);
        setContent(null);
        return () => URL.revokeObjectURL(url);
      } else {
        data.text().then(text => {
          setContent(text);
          parseContent(text, type);
        });
      }
    }
  }, [data, type]);

  const parseContent = (text: string, mimeType: string) => {
    // Try JSON
    if (mimeType.includes('json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        const json = JSON.parse(text);
        setParsedJson(json);
        return;
      } catch (e) {
        // Not valid JSON
      }
    }

    // Try HTML/XML
    if (mimeType.includes('html') || mimeType.includes('xml') || text.trim().startsWith('<')) {
      if (mimeType.includes('xml')) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'application/xml');
          const parseError = doc.querySelector('parsererror');
          if (!parseError) {
            setParsedXml(doc);
            return;
          }
        } catch (e) {
          // Not valid XML
        }
      } else {
        // HTML or unknown markup
        try {
          const template = document.createElement('template');
          template.innerHTML = text;
          if (template.content.childNodes.length > 0) {
            setParsedXml(template.content);
            return;
          }
        } catch (e) {
          // Not valid HTML
        }
      }
    }
  };

  if (imageUrl) {
    return (
      <div className="p-4 bg-muted/10 overflow-auto max-h-96">
        <img src={imageUrl} alt="Clipboard content" className="max-w-full h-auto" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-96 w-full">
      <div className="p-4">
        {parsedJson ? (
          <JsonViewer data={parsedJson} />
        ) : parsedXml ? (
          <div className="flex flex-col gap-4">
            <XmlViewer node={parsedXml.nodeType === Node.DOCUMENT_NODE ? (parsedXml as Document).documentElement : parsedXml} />
          </div>
        ) : (
          <pre className="text-sm font-mono whitespace-pre-wrap text-foreground break-all">
            {content}
          </pre>
        )}
      </div>
    </ScrollArea>
  );
}
