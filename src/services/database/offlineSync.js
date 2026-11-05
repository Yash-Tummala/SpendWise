// src/services/database/offlineSync.js
const QUEUE_KEY = 'offlineQueue';

export const enqueue = (op) => {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  queue.push(op);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const flushQueue = async () => {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (!queue.length) return;

  const { supabase } = await import('./supabaseClient');
  for (const op of queue) {
    try {
      if (op.type === 'upsert') {
        const { error } = await supabase.from(op.table).upsert(op.item);
        if (error) throw error;
      } else if (op.type === 'remove') {
        const { error } = await supabase.from(op.table).delete().eq('id', op.item.id);
        if (error) throw error;
      }
    } catch (e) {
      console.error('Failed to flush offline op', e);
      return; // stop processing, keep remaining ops
    }
  }
  localStorage.removeItem(QUEUE_KEY);
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushQueue().catch(console.error);
  });
}
