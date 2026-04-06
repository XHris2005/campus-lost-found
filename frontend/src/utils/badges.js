export const BADGES = [
  {
    id: 'legend',
    label: 'Legend',
    icon: '🏆',
    minReturns: 21,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    description: 'An extraordinary contributor to the campus community',
  },
  {
    id: 'champion',
    label: 'Champion',
    icon: '💎',
    minReturns: 11,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    description: 'A dedicated champion of lost item recovery',
  },
  {
    id: 'guardian',
    label: 'Guardian',
    icon: '🥇',
    minReturns: 6,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    description: 'A trusted guardian of the campus community',
  },
  {
    id: 'contributor',
    label: 'Contributor',
    icon: '🥈',
    minReturns: 3,
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
    description: 'A valued contributor to campus life',
  },
  {
    id: 'helper',
    label: 'Helper',
    icon: '🥉',
    minReturns: 1,
    color: '#cd7f32',
    bg: 'rgba(205, 127, 50, 0.12)',
    description: 'Someone who helps reunite lost items',
  },
  {
    id: 'newcomer',
    label: 'Newcomer',
    icon: '🌱',
    minReturns: 0,
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.12)',
    description: 'Just getting started on CampusFind',
  },
];

export function getBadge(recoveredCount = 0) {
  return BADGES.find(b => recoveredCount >= b.minReturns) || BADGES[BADGES.length - 1];
}

export function getNextBadge(recoveredCount = 0) {
  const current = getBadge(recoveredCount);
  const currentIndex = BADGES.findIndex(b => b.id === current.id);
  return currentIndex > 0 ? BADGES[currentIndex - 1] : null;
}

export function getProgressToNext(recoveredCount = 0) {
  const next = getNextBadge(recoveredCount);
  if (!next) return 100;
  const current = getBadge(recoveredCount);
  const from = current.minReturns;
  const to = next.minReturns;
  return Math.round(((recoveredCount - from) / (to - from)) * 100);
}