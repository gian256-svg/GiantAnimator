import 'dotenv/config';
import Groq from 'groq-sdk';

const key = process.env.GROQ_API_KEY;
console.log('Key defined:', !!key);
if (key) {
  console.log('Key starts with:', key.slice(0, 5));
}

const groq = new Groq({ apiKey: key });

async function test() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello' }],
      model: 'llama-3.3-70b-versatile',
    });
    console.log('Success:', chatCompletion.choices[0].message.content);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
