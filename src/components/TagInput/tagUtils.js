export function splitTags(value) {
  return String(value || '')
    .split(/[,،;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mergeUniqueTags(current, incoming, maxTags = 12) {
  const next = [...current];
  const seen = new Set(current.map((item) => item.toLocaleLowerCase()));
  splitTags(incoming).forEach((item) => {
    const key = item.toLocaleLowerCase();
    if (!seen.has(key) && next.length < maxTags) {
      seen.add(key);
      next.push(item);
    }
  });
  return next;
}
