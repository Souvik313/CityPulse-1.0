export const formatTimeAgo = (date) => {
  if (!date) return "—";

  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 10) return "just now";
  if (diffSeconds < 60) return "less than a minute ago";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes === 1) return "1 minute ago";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  // fallback to formatted date (no seconds)
  return then.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};
