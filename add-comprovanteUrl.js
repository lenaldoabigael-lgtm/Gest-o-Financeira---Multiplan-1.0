import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vjylbopbtyfcczryolwq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseKey) {
  console.log('Missing VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('transactions').select('id, comprovanteUrl').limit(1);
  if (error) {
    console.error('Error selecting comprovanteUrl:', error.message);
  } else {
    console.log('comprovanteUrl exists');
  }
}
check();
