export type EasingCurve = 'linear' | 'sine' | 'ease-in-out' | 'bounce' | 'elastic';

function easeLinear(t: number): number {
  return t < 0.5 ? t * 2 : 2 - t * 2;
}

function easeSine(t: number): number {
  return (Math.sin(t * 2 * Math.PI - Math.PI / 2) + 1) / 2;
}

function easeInOut(t: number): number {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

function easeElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * 2 * Math.PI / 3) + 1;
}

export function getEasedPosition(t: number, curve: EasingCurve): number {
  switch (curve) {
    case 'linear': return easeLinear(t);
    case 'sine': return easeSine(t);
    case 'ease-in-out': return easeInOut(t);
    case 'bounce': return easeBounce(t);
    case 'elastic': return easeElastic(t);
  }
}
