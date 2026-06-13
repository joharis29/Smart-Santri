const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function listUnits() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  let url = '';
  let key = '';

  envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1].trim();
      if(url.startsWith('"') && url.endsWith('"')) url = url.slice(1, -1);
    } else if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      key = line.split('=')[1].trim();
      if(key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
    }
  });

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('program_kegiatan')
    .select('unit');

  if (error) {
    console.error('Error fetching units:', error);
    return;
  }

  const uniqueUnits = [...new Set(data.map(item => item.unit))];
  console.log('Unique units in program_kegiatan:', uniqueUnits);
}

listUnits();
