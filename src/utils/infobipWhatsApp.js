require('dotenv').config();
const axios = require('axios');

async function sendWhatsAppMessage(to, messageText) {
  const baseURL = process.env.INFOBIP_BASE_URL;
  const apiKey = process.env.INFOBIP_API_KEY;
  const sender = process.env.WHATSAPP_SENDER;

  const url = `${baseURL}/whatsapp/1/message/text`;

  const payload = {
    from: sender,
    to: to,
    content: {
      text: messageText
    }
  };

  console.log("➡️ Sending to:", url);
  console.log("📦 Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `App ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    console.log('✅ Message sent. Response:', response.data);

    // Make sure to return data safely
    return response.data;
  } catch (error) {
    // throw new Error(`Infobip Error: ${error.message}`);
  }
}

module.exports = sendWhatsAppMessage;
