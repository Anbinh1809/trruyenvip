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
            <style jsx>{`
                .skeleton-titan-shimmer {
                    background: rgba(255, 255, 255, 0.05);
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.03);
                }

                .skeleton-titan-shimmer::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    transform: translateX(-100%);
                    background: linear-gradient(
                        90deg, 
                        transparent 0%, 
                        rgba(255, 255, 255, 0.05) 50%, 
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
