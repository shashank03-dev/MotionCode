"use client";

import React, { useEffect, useRef, ReactNode, HTMLAttributes } from 'react';

import { detectDeviceTier } from '@/lib/device-tier';

interface MagnetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  wrapperClassName?: string;
  innerClassName?: string;
}

const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.5s ease-in-out',
  wrapperClassName = '',
  innerClassName = '',
  ...props
}) => {
  const magnetRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const moveTo = (x: number, y: number, transition: string) => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        inner.style.transition = transition;
        inner.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };

    // Low-end / data-saving devices skip the global mousemove listener and its
    // per-move rAF transform writes entirely — the magnet just rests centered.
    const lowTier = detectDeviceTier() === 'low';

    if (disabled || reduceMotion.matches || lowTier) {
      moveTo(0, 0, inactiveTransition);
      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!magnetRef.current) return;

      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        const offsetX = (e.clientX - centerX) / magnetStrength;
        const offsetY = (e.clientY - centerY) / magnetStrength;
        moveTo(offsetX, offsetY, activeTransition);
      } else {
        moveTo(0, 0, inactiveTransition);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [activeTransition, inactiveTransition, padding, disabled, magnetStrength]);

  return (
    <div
      ref={magnetRef}
      className={wrapperClassName}
      style={{ position: 'relative', display: 'inline-block' }}
      {...props}
    >
      <div
        ref={innerRef}
        className={innerClassName}
        style={{
          transform: 'translate3d(0, 0, 0)',
          transition: inactiveTransition,
          willChange: 'transform'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;
