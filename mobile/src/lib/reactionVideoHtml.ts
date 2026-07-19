export function buildReactionVideoHtml(videoUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden;}
    video{width:100%;height:100%;object-fit:cover;}
  </style>
</head>
<body>
  <video id="v" src="${videoUrl}" playsinline muted="false"></video>
  <script>
    var video = document.getElementById('v');

    function post(msg) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }

    video.addEventListener('ended', function () { post({ type: 'ENDED' }); });
    video.addEventListener('error', function () {
      post({ type: 'ERROR', message: video.error ? video.error.message : 'unknown' });
    });

    window.__cmd = function (action, value) {
      if (action === 'play') video.play().catch(function () {});
      if (action === 'pause') video.pause();
      if (action === 'seek') video.currentTime = value;
    };
  </script>
</body>
</html>`;
}
