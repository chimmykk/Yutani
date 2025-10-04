// create a function that will send a text message to a phone number

const twilio = require('twilio');

const accountSid = 'AC00000000000000000000000000000000';
const authToken = '00000000000000000000000000000000';

const client = twilio(accountSid, authToken);

client.messages.create({
  body: 'Hello, world!',
  from: '+12345678901',
  to: '+12345678901'
});