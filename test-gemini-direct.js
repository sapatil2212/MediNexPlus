// Test Gemini API directly with REST
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBT5GWGKsbb0-DiaSlDWe5en4q6yG4s2eo";

async function testGeminiDirect() {
  const data = JSON.stringify({
    contents: [{
      parts: [{
        text: "Say hello"
      }]
    }]
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', body);
        
        if (res.statusCode === 200) {
          const result = JSON.parse(body);
          console.log('\n✅ SUCCESS! Gemini API is working!');
          console.log('Response text:', result.candidates[0].content.parts[0].text);
        } else {
          console.log('\n❌ FAILED! Status:', res.statusCode);
          console.log('This API key may be invalid or expired.');
          console.log('\nPlease check:');
          console.log('1. API key is correct in .env file');
          console.log('2. Gemini API is enabled in Google Cloud Console');
          console.log('3. Billing is set up (Gemini API requires billing)');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

testGeminiDirect();
