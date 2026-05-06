
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
    console.error('❌ Credenciais ausentes');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkLatestJob() {
    console.log('📡 Consultando Supabase...');
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('❌ Erro:', error.message);
    } else if (data && data.length > 0) {
        console.log('✅ Último Job encontrado no Supabase:');
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log('⚠️ Nenhum job encontrado.');
    }
}

checkLatestJob();
