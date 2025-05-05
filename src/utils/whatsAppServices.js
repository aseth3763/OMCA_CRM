require("dotenv").config()
const twilio = require("twilio")
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsAppMessage(toNumber, message) {
    try {
        const response = await client.messages.create({
            from : process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:+91${toNumber}`,  // Ensure toNumber is just digits, no `+91`
            body: message,
        })
        return response
    } catch (error) {
        throw new Error(`Twilio Error : ${error.message}`)
    }
}

module.exports = sendWhatsAppMessage