'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ExpandableText({ text, limit = 250 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) return null;
  if (text.length <= limit) return <p className="expandable-text-industrial">{text}</p>;

  const displayText = isExpanded ? text : text.slice(0, limit) + '...';

  return (
    <div className="expandable-container-industrial">
      <p className="expandable-text-industrial">
        {displayText}
      </p>
      <button 
        className="expand-btn-industrial"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <>Thu gọn <ChevronUp size={16} /></>
        ) : (
          <>Xem thêm mô tả <ChevronDown size={16} /></>
        )}
      </button>
    </div>
  );
}
