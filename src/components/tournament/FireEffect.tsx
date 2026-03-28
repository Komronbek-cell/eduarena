'use client'

import { useEffect, useRef } from 'react'

interface FireEffectProps {
  intensity?: 'low' | 'medium' | 'high'
  className?: string
}

export default function FireEffect({ intensity = 'medium', className = '' }: FireEffectProps) {
  const count = intensity === 'low' ? 8 : intensity === 'medium' ? 14 : 20

  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 5 + (i / count) * 90,
    delay: (i * 0.15) % 1.5,
    duration: 1.2 + (i % 5) * 0.3,
    size: 4 + (i % 4) * 3,
    color: i % 3 === 0 ? '#ff4500' : i % 3 === 1 ? '#ff8c00' : '#ffd700',
  }))

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute bottom-0 rounded-full"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 2,
              background: `radial-gradient(ellipse at 50% 80%, ${p.color}, transparent)`,
              animation: `fireRise ${p.duration}s ease-in ${p.delay}s infinite`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes fireRise {
          0% { transform: translateY(0) scale(1); opacity: 0.9; }
          50% { transform: translateY(-30px) scale(0.8) rotate(5deg); opacity: 0.6; }
          100% { transform: translateY(-60px) scale(0.3) rotate(-5deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}