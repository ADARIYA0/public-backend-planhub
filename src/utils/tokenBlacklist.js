let blacklist = [];

function addToBlacklist(token) {
    blacklist.push(token);
}

function isBlacklisted(token) {
    return blacklist.includes(token);
}

module.exports = { addToBlacklist, isBlacklisted };