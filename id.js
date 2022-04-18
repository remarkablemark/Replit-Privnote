const { customAlphabet } = require('nanoid');

const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const size = 7;

exports.nanoid = customAlphabet(alphabet, size);;
exports.idRegex = new RegExp(`^[${alphabet}]{${size}}$`);
