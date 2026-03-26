import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ROOM_NAME = process.env.DAILY_ROOM_NAME;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = req.body?.type ?? req.body?.action;
  const room   = req.body?.payload?.room;

  console.log('Daily webhook received:', JSON.stringify({ action, room }));

  const isJoin  = action === 'participant.joined';
  const isLeave = action === 'participant.left';

  if (!isJoin && !isLeave) {
    return res.status(200).json({ ok: true, ignored: true });
  }
  if (room !== ROOM_NAME) {
    console.log(`Room mismatch: got "${room}", expected "${ROOM_NAME}"`);
    return res.status(200).json({ ok: true, ignored: true });
  }

  try {
    if (isJoin) {
      await supabase.rpc('increment_participants');
      console.log('Incremented participants');
    } else {
      await supabase.rpc('decrement_participants');
      console.log('Decremented participants');
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Supabase update failed:', err);
    return res.status(500).json({ error: 'Supabase update failed' });
  }
}