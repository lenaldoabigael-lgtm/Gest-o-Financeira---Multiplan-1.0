import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://wpjehsjzeuxdtoovkocp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwamVoc2p6ZXV4ZHRvb3Zrb2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjkxMTAsImV4cCI6MjA4NDM0NTExMH0.XuoSR8DoILZFXBFoHOBgoNrnNDnxYLjk6bPUzVug258', { db: { schema: 'public' } });
async function run() {
  const { data, error } = await supabase.from('users').select('*');
  console.log(error);
}
run();
