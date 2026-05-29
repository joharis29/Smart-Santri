import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.5-flash',
  temperature: 0.3,
});

const res = await llm.invoke('Ceritakan kisah si kancil mencuri ketimun dengan detail.');
console.log(res.content);
