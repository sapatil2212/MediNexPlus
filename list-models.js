// List available Gemini models
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBT5GWGKsbb0-DiaSlDWe5en4q6yG4s2eo");

async function listModels() {
  try {
    console.log("Fetching available models...\n");
    
    // Try different model names that might work
    const modelsToTry = [
      "gemini-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "models/gemini-pro",
      "models/gemini-1.5-pro",
      "models/gemini-1.5-flash"
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hi");
        const response = await result.response;
        console.log(`✅ ${modelName} WORKS!`);
        console.log(`   Response: ${response.text()}\n`);
        break; // Stop after first working model
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message.substring(0, 100)}...\n`);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
