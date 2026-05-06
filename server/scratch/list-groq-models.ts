
import Groq from "groq-sdk";
import 'dotenv/config';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function listModels() {
    try {
        const list = await groq.models.list();
        console.log(JSON.stringify(list.data.map(m => m.id), null, 2));
    } catch (err) {
        console.error(err);
    }
}

listModels();
