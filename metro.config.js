const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper web support
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

module.exports = config;