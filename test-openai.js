// Test OpenAI API for voice prescription
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API...\n");

    // Test 1: Simple completion
    console.log("1. Testing basic completion...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello in one word" }
      ],
    });
    console.log("✅ Response:", completion.choices[0].message.content);

    // Test 2: Hindi translation
    console.log("\n2. Testing Hindi support...");
    const hindiTest = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a medical translator." },
        { role: "user", content: "Translate to English: 'मुझे बुखार है और सिर दर्द है'" }
      ],
    });
    console.log("✅ Hindi translation:", hindiTest.choices[0].message.content);

    // Test 3: Marathi translation
    console.log("\n3. Testing Marathi support...");
    const marathiTest = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a medical translator." },
        { role: "user", content: "Translate to English: 'मला ताप आहे आणि डोकेदुखी आहे'" }
      ],
    });
    console.log("✅ Marathi translation:", marathiTest.choices[0].message.content);

    // Test 4: Medical extraction with JSON
    console.log("\n4. Testing medical data extraction...");
    const medicalTest = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a medical AI that extracts structured data from consultations." },
        { role: "user", content: `Extract medical information from this conversation:
Doctor: "What brings you here today?"
Patient: "I have fever of 101 degrees and headache for 3 days."
Doctor: "Let me check. Your BP is 120/80, pulse is 85."
Doctor: "I'm prescribing Paracetamol 500mg twice daily for 5 days after food."

Return JSON with: chiefComplaint, diagnosis, vitals, medications` }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    console.log("✅ Medical extraction:", medicalTest.choices[0].message.content);

    console.log("\n✅ All tests passed!");
    console.log("\n📋 Summary:");
    console.log("- OpenAI API: Working");
    console.log("- Model: gpt-4o-mini");
    console.log("- Multi-language: Supported (Hindi, Marathi, etc.)");
    console.log("- Medical extraction: Working");
    console.log("- JSON output: Working");
    console.log("\n🎉 Voice assistant is ready to use!");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    if (error.message.includes("API key")) {
      console.log("\n🔑 API Key Issue:");
      console.log("1. Get API key from: https://platform.openai.com/api-keys");
      console.log("2. Add to .env file: OPENAI_API_KEY=sk-proj-...");
      console.log("3. Restart the server");
    } else if (error.message.includes("quota")) {
      console.log("\n💳 Quota Issue:");
      console.log("1. Add payment method: https://platform.openai.com/account/billing");
      console.log("2. Add $5-10 credit");
      console.log("3. Wait 5 minutes for activation");
    } else {
      console.log("\n⚠️ Other issue - check error message above");
    }
  }
}

testOpenAI();
