const tokenBlacklist = new Set();

const blacklist_Token = (token) => tokenBlacklist.add(token);
const isTokenBlacklisted = (token) => tokenBlacklist.has(token);

module.exports = { blacklist_Token, isTokenBlacklisted };