import { type ReactNode } from 'react';
import { Player } from '../types';

const RECIPIENT_PATTERNS: [RegExp, (r: Player) => string][] = [
  [/睾丸\/阴唇/g, r => r.role === 'male' ? '睾丸' : '阴唇'],
  [/精液\/爱液/g, r => r.role === 'male' ? '精液' : '爱液'],
  [/阴蒂\/龟头/g, r => r.role === 'female' ? '阴蒂' : '龟头'],
  [/龟头\/阴蒂/g, r => r.role === 'male' ? '龟头' : '阴蒂'],
  [/后穴\/阴道/g, r => r.role === 'female' ? '后穴/阴道' : '后穴'],
  [/阴唇\/包皮系带/g, r => r.role === 'female' ? '阴唇' : '包皮系带'],
  [/他\/她/g, r => r.role === 'male' ? '他' : '她'],
];

const EXECUTOR_PATTERNS: [RegExp, (e: Player) => string][] = [
  [/爱液\/前液/g, e => e.role === 'female' ? '爱液' : '前液'],
  [/唾液\/汗\/爱液/g, e => e.role === 'female' ? '唾液/汗/爱液' : '唾液/汗/前液'],
];

export function personalizeTask(task: string, executor: Player, recipient: Player): string {
  let text = task.replace(/^\[(?:M|F|both)\]\s*/, '');

  for (const [pattern, resolve] of RECIPIENT_PATTERNS) {
    text = text.replace(pattern, resolve(recipient));
  }
  for (const [pattern, resolve] of EXECUTOR_PATTERNS) {
    text = text.replace(pattern, resolve(executor));
  }

  text = text.replace(/男生/g, executor.role === 'male' ? executor.name : recipient.name);
  text = text.replace(/女生/g, executor.role === 'female' ? executor.name : recipient.name);
  text = text.replace(/对方/g, recipient.name);

  text = text.replace(/你自己的/g, `${executor.name}自己的`);
  text = text.replace(/你自己/g, `${executor.name}自己`);
  text = text.replace(/自己的/g, `${executor.name}自己的`);
  text = text.replace(/你的/g, `${executor.name}的`);

  text = text.replace(/你/g, executor.name);

  return text;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function renderColoredTaskText(text: string, players: Player[]): ReactNode[] {
  const colorMap = new Map<string, string>();
  for (const p of players) {
    colorMap.set(p.name, p.color);
  }

  const names = players.map(p => p.name);
  if (names.length === 0) return [text];

  const pattern = new RegExp(`(${names.map(n => escapeRegex(n)).join('|')})`, 'g');
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const color = colorMap.get(part);
    if (color) {
      return <span key={i} style={{ color }}>{part}</span>;
    }
    return part;
  });
}
