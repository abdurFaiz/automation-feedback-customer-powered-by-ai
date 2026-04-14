import type { ReactNode } from 'react';

interface AnimatedContainerProps {
    children: ReactNode;
    isVisible: boolean;
    direction?: 'left' | 'right' | 'up' | 'down';
    duration?: number;
}

export default function AnimatedContainer({
    children,
    isVisible,
    direction = 'right',
    duration = 300
}: AnimatedContainerProps) {
    const getTransform = () => {
        if (!isVisible) {
            switch (direction) {
                case 'left': return 'translateX(-50px)';
                case 'right': return 'translateX(50px)';
                case 'up': return 'translateY(-50px)';
                case 'down': return 'translateY(50px)';
                default: return 'translateX(50px)';
            }
        }
        return 'translateX(0)';
    };

    return (
        <div
            className="transition-all ease-out"
            style={{
                transform: getTransform(),
                opacity: isVisible ? 1 : 0,
                transitionDuration: `${duration}ms`
            }}
        >
            {children}
        </div>
    );
}