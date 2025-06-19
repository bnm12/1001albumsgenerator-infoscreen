var albumStats = null;
var urlParams = new URLSearchParams(window.location.search);
var groupSlug = urlParams.get("group");
var refreshTimerString = urlParams.get("refreshTimer");

if (!groupSlug) {
  alert("Please add a ?group=<your-group-name> to the url");
}

function doThaThing() {
  var timer = parseInt(refreshTimerString, 10);
  var bigReload = setTimeout(window.location.reload, 12 * 60 * 60 * 1000);

  fetchAlbumStats()
    .catch(error => {
        // This catch is primarily to prevent an "Uncaught (in promise)" error message in the console
        // from the very first attempt if fetchAlbumStats fails and propagates the error.
        // Retries are handled by fetchAlbumStats itself.
        console.warn("Initial attempt by fetchAlbumStats failed (retries will continue internally):", error.message ? error.message : error);
    })
    .finally(() => {
      setTimeout(updateData, 5000);
      if (timer) {
        setInterval(updateData, timer * 1000);
      }
    });
}

function fetchAlbumStats() {
  console.log("Attempting to fetch album stats...");
  return fetch(`https://1001albumsgenerator.com/api/v1/albums/stats?cacheBuster=${new Date().getTime()}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok for album stats: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(statsData => {
      albumStats = statsData;
      console.log("Album stats populated successfully.");
    })
    .catch(error => {
      console.error("fetchAlbumStats failed, scheduling retry:", error);
      setTimeout(fetchAlbumStats, 60000);
      // Propagate error for external .catch handlers after scheduling retry.
      return Promise.reject(error);
    });
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

      const wikiLink = document.getElementById("wiki-link");
      if (wikiLink) {
        wikiLink.setAttribute("href", currentAlbum.wikipediaUrl);
        wikiLink.setAttribute("target", "_blank");
      }

      document.getElementById("previous-rating-container").innerHTML =
        generateStars(prevAlbum.averageRating);
      document.getElementById("previous-rating-numerical").innerHTML =
        prevAlbum.averageRating || "";

      // Update progress display if albumStats is available
      if (albumStats) {
        updateProgressDisplay(data, albumStats);
      }
    });
  });
}

function updateProgressDisplay(groupData, albumStatsData) {
  const progressBarFilled = document.getElementById('progress-bar-filled');
  const progressText = document.getElementById('progress-text');

  if (!progressBarFilled || !progressText) {
    console.error("Progress bar elements not found");
    return;
  }

  if (!groupData || !albumStatsData || !albumStatsData.albums) {
    console.warn("Missing data for progress display. Clearing progress.");
    progressBarFilled.style.width = '0%';
    progressText.textContent = 'N/A';
    return;
  }

  const generatedAlbumsCount = groupData.numberOfGeneratedAlbums + 1;
  const totalAlbumsCount = albumStatsData.albums.length;

  let progressPercentage = 0;
  if (totalAlbumsCount > 0) {
    progressPercentage = (generatedAlbumsCount / totalAlbumsCount) * 100;
  }

  progressBarFilled.style.width = progressPercentage + '%';

  progressText.textContent = generatedAlbumsCount + '/' + totalAlbumsCount + ' (' + progressPercentage.toFixed(2) + '%)';
}

function makeQRCodes(currentAlbum) {
  document.getElementById("spotifyQR").innerHTML = "";
  var spotifyQR = new QRCode("spotifyQR", {
    width: 150,
    height: 150,
    text: `https://open.spotify.com/album/${currentAlbum.spotifyId}`,
  });
  var spotifyElement = document.getElementById("spotifyQR");
  var spotifyCodeItem = spotifyElement.closest('.code-item');
  var spotifyUrl = `https://open.spotify.com/album/${currentAlbum.spotifyId}`;
  if (spotifyCodeItem) {
    spotifyCodeItem.addEventListener('click', function() {
      window.open(spotifyUrl, '_blank');
    });
  }

  document.getElementById("youtubeMusicQR").innerHTML = "";
  var youtubeMusicQR = new QRCode("youtubeMusicQR", {
    width: 150,
    height: 150,
    text: `https://music.youtube.com/playlist?list=${currentAlbum.youtubeMusicId}`,
  });
  var youtubeMusicElement = document.getElementById("youtubeMusicQR");
  var youtubeMusicCodeItem = youtubeMusicElement.closest('.code-item');
  var youtubeMusicUrl = `https://music.youtube.com/playlist?list=${currentAlbum.youtubeMusicId}`;
  if (youtubeMusicCodeItem) {
    youtubeMusicCodeItem.addEventListener('click', function() {
      window.open(youtubeMusicUrl, '_blank');
    });
  }

  document.getElementById("appleMusicQR").innerHTML = "";
  var appleMusicQR = new QRCode("appleMusicQR", {
    width: 150,
    height: 150,
    text: `https://music.apple.com/album/${currentAlbum.appleMusicId}`,
  });
  var appleMusicElement = document.getElementById("appleMusicQR");
  var appleMusicCodeItem = appleMusicElement.closest('.code-item');
  var appleMusicUrl = `https://music.apple.com/album/${currentAlbum.appleMusicId}`;
  if (appleMusicCodeItem) {
    appleMusicCodeItem.addEventListener('click', function() {
      window.open(appleMusicUrl, '_blank');
    });
  }

  document.getElementById("tidalQR").innerHTML = "";
  var tidalQR = new QRCode("tidalQR", {
    width: 150,
    height: 150,
    text: `https://tidal.com/browse/album/${currentAlbum.tidalId}`,
  });
  var tidalElement = document.getElementById("tidalQR");
  var tidalCodeItem = tidalElement.closest('.code-item');
  var tidalUrl = `https://tidal.com/browse/album/${currentAlbum.tidalId}`;
  if (tidalCodeItem) {
    tidalCodeItem.addEventListener('click', function() {
      window.open(tidalUrl, '_blank');
    });
  }
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

  var innerCirclePoints = 5;
  var innerRadius = starWidth / innerCirclePoints;
  var innerOuterRadiusRatio = 2.5;
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
  var totalPoints = innerCirclePoints * 2;
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

loadScript("https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js")
  .then(doThaThing)
  .catch(() => {
    console.error("Script loading failed! Handle this error");
  });
