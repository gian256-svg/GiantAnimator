const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
genAI.listModels()
  .then(r => r.models.forEach(m => console.log(m.name)))
  .catch(console.error);
