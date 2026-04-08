import "dotenv/config";
export {};

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY não encontrada");
    process.exit(1);
  }
  
  console.log("🔍 Buscando modelos disponíveis para a sua API Key...");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Erro da API:", JSON.stringify(data, null, 2));
      return;
    }
    
    console.log("✅ Modelos disponíveis:");
    const models = data.models || [];
    for (const m of models) {
      console.log(` - ${m.name.replace("models/", "")} (Métodos suportados: ${m.supportedGenerationMethods?.join(", ")})`);
    }
  } catch (error) {
    console.error("❌ Erro de requisição:", error);
  }
}

listModels();
