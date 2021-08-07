const { customAlphabet } = require('nanoid');

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const uniqueRefGenerator = customAlphabet(alphabet, 6);
module.exports = uniqueRefGenerator;
