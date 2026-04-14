'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ExpandableText({ text, limit = 300 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;

  const sanitizeHtml = (rawHtml) => {
    if (!rawHtml) return '';
    return rawHtml
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
      .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, '')
      .replace(/<object\b[^>]*>([\s\S]*?)<\/object>/gim, '')
      .replace(/<embed\b[^>]*>([\s\S]*?)<\/embed>/gim, '')
      .replace(/<applet\b[^>]*>([\s\S]*?)<\/applet>/gim, '')
      .replace(/<meta\b[^>]*>/gim, '')
      .replace(/<link\b[^>]*>/gim, '')
      .replace(/on\w+="[^"]*"/gim, '')
      .replace(/on\w+='[^']*'/gim, '')
      .replace(/on\w+=\S+/gim, '')
      .replace(/javascript:[^"']*/gim, '#')
      .replace(/data:[^"']*/gim, '#')
      .replace(/base64[^"']*/gim, '#')
      .replace(/style="[^"]*"/gim, '')
      .replace(/class="[^"]*"/gim, '')
      .replace(/id="[^"]*"/gim, '');
  };

  const sanitizedFull = sanitizeHtml(text);
  const isLong = sanitizedFull.length > limit;
  const displayText = isExpanded ? sanitizedFull : sanitizedFull.substring(0, limit) + (isLong ? '...' : '');

  return (
    <div style={{ position: 'relative' }}>
      <div 
        className="titan-detail-description" 
        style={{ marginBottom: '10px', lineHeight: '1.6', color: 'var(--text-secondary)' }}
        dangerouslySetInnerHTML={{ __html: displayText }}
      />
      {isLong && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--accent)',
            fontWeight: '800',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '30px',
            padding: 0,
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {isExpanded ? <><ChevronUp size={16} /> Thu gọn</> : <><ChevronDown size={16} /> Xem thêm</>}
        </button>
      )}
    </div>
  );
}
