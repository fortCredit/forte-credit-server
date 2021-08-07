const { request } = require('./httpRequest');

exports.sendsms = async (textcontent, phone) => {
  try {
    const data = {
      to: phone,
      from: 'Umobile.NG',
      sms: textcontent,
      type: 'plain',
      api_key: process.env.TERMIIAPIKEY,
      channel: 'dnd',
    };
    const url = 'https://termii.com/api/sms/send';
    const options = {
      method: 'POST',
      json: data,
      responseType: 'json',
      retry: 0,
      headers: {
        'Content-Type': 'application/json',
      },

    };
    request(url, options);
  } catch (err) {
    throw new Error(err);
  }
};
