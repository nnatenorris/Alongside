export function buildPlayerHtml(videoId: string, startSeconds: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>html,body{margin:0;padding:0;background:#000;height:100%;} #player{width:100%;height:100%;}</style>
</head>
<body>
  <div id="player"></div>
  <script src="https://www.youtube.com/iframe_api"></script>
  <script>
    var player;
    var captureStarted = false;

    function post(msg) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }

    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        videoId: '${videoId}',
        playerVars: { start: ${startSeconds}, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: function () { post({ type: 'READY' }); },
          onStateChange: onStateChange,
          onError: function (e) { post({ type: 'ERROR', data: e.data }); }
        }
      });
    }

    function onStateChange(e) {
      if (e.data === YT.PlayerState.PLAYING && !captureStarted) {
        captureStarted = true;
        post({ type: 'START_CAPTURE', atSeconds: player.getCurrentTime() });
      }
      if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
        post({ type: 'STOP_CAPTURE' });
      }
    }
  </script>
</body>
</html>`;
}
