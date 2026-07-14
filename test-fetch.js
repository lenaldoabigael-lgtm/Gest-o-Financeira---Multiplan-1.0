import { supabase } from './lib/supabase.ts';
async function run() {
  const { data, error } = await supabase.from('users').select('*');
  console.log(error);
}
run();
