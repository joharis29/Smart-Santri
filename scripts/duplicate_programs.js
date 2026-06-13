const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function duplicatePrograms() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  let url = '';
  let key = '';

  envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1].trim();
      if(url.startsWith('"') && url.endsWith('"')) url = url.slice(1, -1);
    } else if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      key = line.split('=')[1].trim();
      if(key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
    }
  });

  const supabase = createClient(url, key);

  console.log('Fetching programs for Dapur Asrama Putra...');
  const { data: sourcePrograms, error: fetchError } = await supabase
    .from('program_kegiatan')
    .select('*')
    .eq('unit', 'Dapur Asrama Putra');

  if (fetchError) {
    console.error('Error fetching source programs:', fetchError);
    return;
  }

  if (!sourcePrograms || sourcePrograms.length === 0) {
    console.log('No programs found for Dapur Asrama Putra. Try Dapur Asrama Putri.');
    const { data: sourcePrograms2, error: fetchError2 } = await supabase
        .from('program_kegiatan')
        .select('*')
        .eq('unit', 'Dapur Asrama Putri');
    
    if (fetchError2) {
        console.error('Error fetching source programs 2:', fetchError2);
        return;
    }
    
    if (!sourcePrograms2 || sourcePrograms2.length === 0) {
        console.log('No programs found in both source units.');
        return;
    }
    await processAndInsert(supabase, sourcePrograms2);
  } else {
    await processAndInsert(supabase, sourcePrograms);
  }
}

async function processAndInsert(supabase, sourcePrograms) {
    console.log(`Found ${sourcePrograms.length} programs. Duplicating to Dapur Umum...`);
    
    const newPrograms = sourcePrograms.map(p => {
        const { id, created_at, ...rest } = p;
        return {
            ...rest,
            unit: 'Dapur Umum'
        };
    });

    const { data: insertedData, error: insertError } = await supabase
        .from('program_kegiatan')
        .insert(newPrograms);

    if (insertError) {
        console.error('Error inserting programs:', insertError);
    } else {
        console.log('Successfully duplicated programs!');
    }
}

duplicatePrograms();
