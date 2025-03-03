var urlParams = new URLSearchParams(window.location.search);
var groupSlug = urlParams.get("group");
var refreshTimerString = urlParams.get("refreshTimer");

if (!groupSlug) {
  alert("Please add a ?group=<your-group-name> to the url");
}

function doThaThing() {
  var timer = parseInt(refreshTimerString, 10);
  var bigReload = setTimeout(window.location.reload, 12*60*60*1000);
  updateData();
  if (timer) {
    setInterval(updateData, timer * 1000);
  }
}

function updateData() {
  var groupData = fetch(
        `https://1001albumsgenerator.com/api/v1/groups/${groupSlug}?${Math.floor(
          new Date().getTime() / 1000 / 60
        )}`
  ).then((resp) => {
    var data = resp.json().then((data) => {
      var prevAlbum = data.latestAlbum;
      var currentAlbum = data.currentAlbum;

      document.getElementById(
        "previous-album-art"
      ).style.backgroundImage = `url(${prevAlbum.images[1].url})`;
      document.getElementById("previous-title").innerHTML = prevAlbum.name;
      document.getElementById(
        "previous-artist"
      ).innerHTML = `${prevAlbum.artist} (${prevAlbum.releaseDate})`;

      document.getElementById(
        "today-album-art"
      ).style.backgroundImage = `url(${currentAlbum.images[0].url})`;
      document.getElementById("today-title").innerHTML = currentAlbum.name;
      document.getElementById(
        "today-artist"
      ).innerHTML = `${currentAlbum.artist} (${currentAlbum.releaseDate})`;

      makeQRCodes(currentAlbum);

      getWikiData(currentAlbum.wikipediaUrl).then((wikiData) => {
        document.getElementById("wiki-data").innerHTML = wikiData.extract;
      });

      document.getElementById("previous-rating-container").innerHTML =
        generateStars(prevAlbum.averageRating);
      document.getElementById("previous-rating-numerical").innerHTML =
        prevAlbum.averageRating || "";
    });
  });
}

function makeQRCodes(currentAlbum) {
  document.getElementById("spotifyQR").innerHTML = "";
  var spotifyQR = new QRCode("spotifyQR", {
    width: 150,
    height: 150,
    text: `https://open.spotify.com/album/${currentAlbum.spotifyId}`,
  });
  document.getElementById("youtubeMusicQR").innerHTML = "";
  var youtubeMusicQR = new QRCode("youtubeMusicQR", {
    width: 150,
    height: 150,
    text: `https://music.youtube.com/playlist?list=${currentAlbum.youtubeMusicId}`,
  });
  document.getElementById("appleMusicQR").innerHTML = "";
  var appleMusicQR = new QRCode("appleMusicQR", {
    width: 150,
    height: 150,
    text: `https://music.apple.com/album/${currentAlbum.appleMusicId}`,
  });
  document.getElementById("tidalQR").innerHTML = "";
  var tidalQR = new QRCode("tidalQR", {
    width: 150,
    height: 150,
    text: `https://tidal.com/browse/album/${currentAlbum.tidalId}`,
  });
}

function getWikiData(wikiUrl) {
  var wikiTitle = wikiUrl.split("/wiki/")[1];
  return fetch(
    `https://en.wikipedia.org/w/api.php?format=json&origin=*&action=query&prop=extracts&explaintext=false&exintro&titles=${wikiTitle}&redirects`
  )
    .then((resp) => resp.json())
    .then((data) => data.query.pages[Object.keys(data.query.pages)[0]]);
}

function generateStars(rating) {
  if (!rating) return "";
  var workingRating = rating;

  var starContent = "";

  for (var i = 0; i < 5; i++) {
    var currentRating = workingRating >= 1 ? 1 : workingRating;
    var percent = currentRating * 100;

    starContent += `
    <div class="star-container">
        <svg class="star-svg" style="fill: url('#gradient${i}')">
        <polygon id="stars-polygon" points="${getStarPoints()}" style="fill-rule: nonzero" />
        <defs>
          <!--
			id has to be unique to each star fullness(dynamic offset) - it indicates fullness above
		    -->
          <linearGradient id="gradient${i}">
            <stop
              id="stop1"
              offset="${percent}%"
              stop-opacity="1"
              stop-color="#ed8a19"
            ></stop>
            <stop
              id="stop2"
              offset="${percent}%"
              stop-opacity="0"
              stop-color="#ed8a19"
            ></stop>
            <stop
              id="stop3"
              offset="${percent}%"
              stop-opacity="1"
              stop-color="#737373"
            ></stop>
            <stop
              id="stop4"
              offset="100%"
              stop-opacity="1"
              stop-color="#737373"
            ></stop>
          </linearGradient>
        </defs>
      </svg>
    </div>`;
    workingRating = Math.max(workingRating - 1, 0);
  }
  return starContent;
}

function getStarPoints() {
  var starWidth = 30;
  var starHeight = 30;
  var centerX = starWidth / 2;
  var centerY = starHeight / 2;

  var innerCirclePoints = 5; // a 5 point star

  // this.style.starWidth --> this is the beam length of each
  // side of the SVG square that holds the star
  var innerRadius = starWidth / innerCirclePoints;
  var innerOuterRadiusRatio = 2.5; // outter circle is x2 the inner
  var outerRadius = innerRadius * innerOuterRadiusRatio;

  return calcStarPoints(
    centerX,
    centerY,
    innerCirclePoints,
    innerRadius,
    outerRadius
  );
}

function calcStarPoints(
  centerX,
  centerY,
  innerCirclePoints,
  innerRadius,
  outerRadius
) {
  const angle = Math.PI / innerCirclePoints;
  var angleOffsetToCenterStar = 60;

  var totalPoints = innerCirclePoints * 2; // 10 in a 5-points star
  var points = "";
  for (let i = 0; i < totalPoints; i++) {
    var isEvenIndex = i % 2 == 0;
    var r = isEvenIndex ? outerRadius : innerRadius;
    var currX = centerX + Math.cos(i * angle + angleOffsetToCenterStar) * r;
    var currY = centerY + Math.sin(i * angle + angleOffsetToCenterStar) * r;
    points += currX + "," + currY + " ";
  }
  return points;
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
