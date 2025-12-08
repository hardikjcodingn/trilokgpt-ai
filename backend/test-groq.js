// Test Groq Integration
import GroqModule from './src/modules/groq.js';

const apiKey = process.env.GROQ_API_KEY;
console.log('Groq API Key:', apiKey ? '✅ Set' : '❌ Not set');

if (apiKey) {
  const groq = new GroqModule(apiKey);
  groq.generate('Hello, what is 2+2?', 100)
    .then(response => {
      console.log('✅ Groq Response:', response);
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
    });
} else {
  console.log('⚠️  Please set GROQ_API_KEY environment variable');
}
