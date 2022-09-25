const axios = require('axios');

exports.sendSMS = async (phone, message) => {
  let phoneNo;
  if (phone.startsWith('0')) {
    phoneNo = (` 234${phone.slice(1, 11)} `);
  }
  const payload = {
    to: phoneNo,
    from: 'MyFortvestNG',
    sms: message,
    type: 'plain',
    channel: 'generic',
    api_key: process.env.TERMII_API_KEY,
  };

  try {
    const res = await axios({
      method: 'POST',
      headers: {
        'Content-Type': ['application/json', 'application/json'],
      },
      url: process.env.TERMII_BASE_URL,
      data: payload,
    });
    console.log(res.data);
  } catch (err) {
    throw new Error(err.message);
  }
};
