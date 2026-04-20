'use client';

/**
 * TITAN INDUSTRIAL SKELETON
 * High-fidelity, shimmer-enabled loading states to prevent layout shifts.
 */
export default function IndustrialSkeleton({ 
    type = 'text', 
    width = '100%', 
    height = '20px', 
    borderRadius = '8px',
    className = '' 
}) {
    const getPresetStyles = () => {
        switch (type) {
            case 'card':
                return { height: '320px', borderRadius: '24px' };
            case 'avatar':
                return { width: '45px', height: '45px', borderRadius: '50%' };
            case 'title':
                return { height: '40px', width: '60%', borderRadius: '12px' };
            default:
                return { width, height, borderRadius };
        }
    };

    const styles = getPresetStyles();

    return (
        <div 
            className={`skeleton-titan-shimmer ${className}`}
            style={{
                width: styles.width,
                height: styles.height,
                borderRadius: styles.borderRadius,
            }}
        >
            <style>{`
                .skeleton-titan-shimmer {
                    background: var(--nebula-glass);
                    position: relative;
                    overflow: hidden;
                    border: 1px solid var(--glass-border);
                }

                .skeleton-titan-shimmer::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    transform: translateX(-100%);
                    background: linear-gradient(
                        90deg, 
                        transparent 0%, 
                        var(--glass-border) 50%, 
                        transparent 100%
                    );
                    animation: shimmer-titan 2s infinite;
                }

                @keyframes shimmer-titan {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
}
