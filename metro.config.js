// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.resolver.blockList = [/add_internships\.js$/];

module.exports = config;