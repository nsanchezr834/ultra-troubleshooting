import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent("Hello world");
    console.log("Success");
  } catch (e: any) {
    console.error("Error with gemini-embedding-001:", e.message);
  }
}
run();
