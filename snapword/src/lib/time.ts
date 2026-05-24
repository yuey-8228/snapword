export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  const d = new Date(timestamp);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return sameYear ? `${month}月${day}日` : `${d.getFullYear()}年${month}月${day}日`;
}
