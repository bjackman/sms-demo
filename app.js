'use strict';

const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');

const app = express();

const LOCALE = 'GB';

// If we don't have the env vars we need, crash now instead of later.
if (!process.env.TWILIO_SOURCE_NUMBER)
    throw 'TWILIO_SOURCE_NUMBER not defined in environment'

console.log('Setting up Twilio client.');
const twilioClient = new twilio(
  process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN
);
console.log('Twilio client setup done.');

function sendSms(number, body) {
  twilioClient.messages.create({
    to: number,
    // TODO: Using a fixed source number won't scale, because apparently if
    // too many texts come from a single number, carriers will filter them.
    // https://www.twilio.com/docs/api/rest/sending-messages-copilot
    from: process.env.TWILIO_SOURCE_NUMBER,
    body: body
  }).then((message) => console.log(message.sid));
}

app.use(bodyParser.json());

app.post('/api', (req, res) => {
  console.log('request!');
  const params = req.body;
  sendSms(params.phoneNumber, 'Thanks for subscribing to cat facts!');
  res.status(200).send('Hello, world!').end();
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
