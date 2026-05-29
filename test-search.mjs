import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'gemini-embedding-001',
});
const testSearch = async () => {
    let query = "Bisakah kamu jelaskan ketentuan apa saja yang ada di PAP?";
    query = query.replace(/\bPAP\b/g, 'Pedoman Akuntansi Pesantren (PAP)');
    console.log("Expanded query:", query);
    const queryVector = await embeddings.embedQuery(query);
    const { data: chunks, error } = await supabase.rpc('match_documents', {
        query_embedding: queryVector,
        match_count: 5,
        filter_source: null
    });
    console.log(chunks);
}
testSearch();
