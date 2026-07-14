import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://wpjehsjzeuxdtoovkocp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwamVoc2p6ZXV4ZHRvb3Zrb2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjkxMTAsImV4cCI6MjA4NDM0NTExMH0.XuoSR8DoILZFXBFoHOBgoNrnNDnxYLjk6bPUzVug258');

async function test() {
  const tables = ['users', 'transactions', 'cost_centers', 'proposals', 'proposal_requirements', 'payment_lots'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) console.log(`Error on ${table}:`, error);
  }
}
test();
