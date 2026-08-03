import { useEffect, useRef, useState } from 'react';
import { EasingCurve, getEasedPosition } from '../utils/easing';

interface MetronomePendulumProps {
  bpm: number;            // 0 = 静止（寸止/休息）
  running: boolean;
  accentColor: string;
  curve?: EasingCurve;
  effect?: 'none' | 'pulse' | 'ripple';
  onBeat?: () => void;
  height?: number;
}

interface Ripple {
  age: number;
  maxAge: number;
  key: number;
}

export function MetronomePendulum({
  bpm,
  running,
  accentColor,
  curve = 'sine',
  effect = 'pulse',
  onBeat,
  height = 200,
}: MetronomePendulumProps) {
  const [impactFlash, setImpactFlash] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const beadRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(0);
  const animStartRef = useRef(0);
  const prevTRef = useRef(0);
  const bpmRef = useRef(bpm);
  const curveRef = useRef(curve);
  const effectRef = useRef(effect);
  const onBeatRef = useRef(onBeat);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { curveRef.current = curve; }, [curve]);
  useEffect(() => { effectRef.current = effect; }, [effect]);
  useEffect(() => { onBeatRef.current = onBeat; }, [onBeat]);

  const loopRef = useRef<(ts: number) => void>(() => {});
  loopRef.current = (timestamp: number) => {
    if (!animStartRef.current) {
      animStartRef.current = timestamp;
      prevTRef.current = 0;
    }
    const totalElapsed = (timestamp - animStartRef.current) / 1000;
    const freq = bpmRef.current;

    if (freq > 0) {
      const cycleDuration = 60 / freq;
      const cycleT = (totalElapsed % cycleDuration) / cycleDuration;
      const pos = getEasedPosition(cycleT, curveRef.current);

      const isBeat = prevTRef.current > 0.8 && cycleT < 0.2;
      if (isBeat) {
        setImpactFlash(true);
        setTimeout(() => setImpactFlash(false), 120);
        onBeatRef.current?.();
        if (effectRef.current === 'ripple' || effectRef.current === 'pulse') {
          ripplesRef.current.push({ age: 0, maxAge: effectRef.current === 'pulse' ? 0.8 : 0.6, key: Date.now() + Math.random() });
        }
      }
      prevTRef.current = cycleT;

      if (beadRef.current && trackRef.current) {
        const trackHeight = trackRef.current.offsetHeight;
        const beadSize = 44;
        const y = pos * Math.max(0, trackHeight - beadSize);
        beadRef.current.style.transform = `translateX(-50%) translateY(${-y}px)`;
      }
    } else {
      if (beadRef.current) {
        beadRef.current.style.transform = 'translateX(-50%) translateY(0px)';
      }
      prevTRef.current = 0;
    }

    if (ripplesRef.current.length > 0) {
      ripplesRef.current = ripplesRef.current
        .map(r => ({ ...r, age: r.age + 0.016 }))
        .filter(r => r.age < r.maxAge);
      setRipples(ripplesRef.current);
    }

    animRef.current = requestAnimationFrame(loopRef.current);
  };

  useEffect(() => {
    if (running && bpm > 0) {
      animStartRef.current = 0;
      prevTRef.current = 0;
      animRef.current = requestAnimationFrame(loopRef.current);
    } else {
      cancelAnimationFrame(animRef.current);
      if (beadRef.current) {
        beadRef.current.style.transform = 'translateX(-50%) translateY(0px)';
      }
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [running, bpm]);

  const glowColor = impactFlash ? accentColor : `${accentColor}66`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute" style={{
          width: height + 120,
          height: height + 120,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(ellipse at center, ${accentColor}15 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div ref={trackRef} className="relative" style={{ width: 28, height }}>
          {/* Cylinder body */}
          <div className="absolute inset-0" style={{
            borderRadius: 14,
            background: [
              'linear-gradient(90deg,',
              '  rgba(255,255,255,0.12) 0%,',
              '  rgba(255,255,255,0.06) 25%,',
              '  transparent 45%,',
              '  rgba(0,0,0,0.15) 65%,',
              '  rgba(0,0,0,0.3) 100%',
              ')',
              ',',
              'linear-gradient(180deg,',
              '  rgba(180,120,70,0.5) 0%,',
              '  rgba(160,100,50,0.5) 40%,',
              '  rgba(140,85,45,0.5) 60%,',
              '  rgba(120,70,40,0.5) 100%',
              ')',
            ].join(''),
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
          }}>
            <div className="absolute top-0 left-0 right-0" style={{
              height: 14,
              borderRadius: '14px 14px 0 0',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.1), transparent)',
            }} />
            <div className="absolute bottom-0 left-0 right-0" style={{
              height: 14,
              borderRadius: '0 0 14px 14px',
              background: 'linear-gradient(0deg, rgba(0,0,0,0.2), transparent)',
            }} />
            <div className="absolute inset-x-0 top-4 bottom-4 mx-auto" style={{
              width: 2,
              background: `linear-gradient(180deg, transparent 0%, ${accentColor}30 20%, ${accentColor}30 80%, transparent 100%)`,
              borderRadius: 1,
            }} />
            <div className="absolute -left-1 top-6 w-3 h-px bg-white/10" />
            <div className="absolute -right-1 top-6 w-3 h-px bg-white/10" />
            <div className="absolute -left-1" style={{ top: '50%', width: 3, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div className="absolute -right-1" style={{ top: '50%', width: 3, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div className="absolute -left-1 bottom-6 w-3 h-px bg-white/10" />
            <div className="absolute -right-1 bottom-6 w-3 h-px bg-white/10" />
          </div>

          {/* Top position indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
          {/* Bottom position indicator */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Bead */}
          <div
            ref={beadRef}
            className="absolute left-1/2"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bottom: 0,
              transform: 'translateX(-50%)',
              background: 'radial-gradient(circle at 35% 30%, #FFE066, #FFB800 40%, #E89400 70%, #CC7700 100%)',
              boxShadow: impactFlash
                ? `0 0 40px ${accentColor}, 0 0 80px ${accentColor}60, inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.35)`
                : `0 0 20px ${glowColor}, 0 0 40px ${accentColor}30, inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.3)`,
              transition: impactFlash ? 'none' : 'box-shadow 0.2s',
            }}
          >
            <div className="absolute" style={{
              width: 16,
              height: 10,
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, transparent 70%)',
              top: 8,
              left: 8,
              borderRadius: '50%',
            }} />
          </div>

          {/* Effects overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: 14, overflow: 'visible' }}>
            {(effect === 'ripple' || effect === 'pulse') && ripples.map(r => {
              const progress = r.age / r.maxAge;
              const size = progress * (height + 20);
              return (
                <div key={r.key} style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  border: `1.5px solid ${effect === 'pulse' ? accentColor : 'rgba(255,255,255,0.4)'}`,
                  opacity: 1 - progress,
                }} />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
