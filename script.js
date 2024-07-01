function doThaThing() {
  var groupData = fetch(
    "https://corsproxy.io/?" +
      encodeURIComponent(
        "https://1001albumsgenerator.com/api/v1/groups/ewii-musik-norderi"
      )
  ).then((resp) => {
    var data = resp.json().then((data) => {
      var currentAlbum = data.currentAlbum;

      document.getElementById(
        "today-album-art"
      ).style.backgroundImage = `url(${currentAlbum.images[0].url})`;
      document.getElementById("today-title").innerHTML = currentAlbum.name;
      document.getElementById("today-artist").innerHTML = currentAlbum.artist;

      var spotifyQR = new QRCode("spotifyQR", {
        width: 150,
        height: 150,
        text: `https://open.spotify.com/album/${currentAlbum.spotifyId}`,
      });
      var youtubeMusicQR = new QRCode("youtubeMusicQR", {
        width: 150,
        height: 150,
        text: `https://music.youtube.com/playlist?list=${currentAlbum.youtubeMusicId}`,
      });
      var appleMusicQR = new QRCode("appleMusicQR", {
        width: 150,
        height: 150,
        text: `https://music.apple.com/album/${currentAlbum.appleMusicId}`,
      });
      var tidalQR = new QRCode("tidalQR", {
        width: 150,
        height: 150,
        text: `https://tidal.com/browse/album/${currentAlbum.tidalId}`,
      });
    });
  });
}

// definition
function loadScript(scriptUrl) {
  const script = document.createElement("script");
  script.src = scriptUrl;
  document.body.appendChild(script);

  return new Promise((res, rej) => {
    script.onload = function () {
      res();
    };
    script.onerror = function () {
      rej();
    };
  });
}

// use
loadScript("https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js")
  .then(doThaThing)
  .catch(() => {
    console.error("Script loading failed! Handle this error");
  });
