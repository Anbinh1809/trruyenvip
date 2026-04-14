'use client';

/**
 * StructuredData Component
 * Safely injects JSON-LD into the page.
 * @param {Object} data - The schema.org object
 */
export default function StructuredData({ data }) {
    if (!data) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ 
                __html: JSON.stringify(data).replace(/</g, '\\u003c') 
            }}
        />
    );
}
