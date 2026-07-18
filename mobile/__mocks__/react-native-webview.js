// react-native-webview reaches into a native TurboModule at import time,
// which doesn't exist under Jest. This manual mock (auto-picked up by Jest
// for node_modules packages) stands in so screens that import it can still
// be smoke-tested.
const WebView = () => null;

module.exports = WebView;
module.exports.default = WebView;
module.exports.WebView = WebView;
