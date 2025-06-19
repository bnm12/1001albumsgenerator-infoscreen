let globalGroupData = null;
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

  updateData()
    .then(() => {
      setTimeout(fetchAlbumStats, 11 * 1000);
    })
    .catch(error => {
      console.error("Error during initial data load or scheduling:", error);
    });

  // The setInterval for periodic updates will be moved to updateData itself.
  // The initial fetchAlbumStats call and its finally block are removed.
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
      updateProgressDisplay();
    })
    .catch(error => {
      console.error("fetchAlbumStats failed, scheduling retry:", error.message ? error.message : error);
      setTimeout(fetchAlbumStats, 60000);
      return Promise.reject(error);
    });
}

function updateData() {
  return fetch(
        `https://1001albumsgenerator.com/api/v1/groups/${groupSlug}?cacheBuster=${Math.floor(
          new Date().getTime() / 1000 / 60
        )}`
  )
  .then(resp => {
    if (!resp.ok) {
      throw new Error(`Network response was not ok for group data: ${resp.status} ${resp.statusText}`);
    }
    return resp.json();
  })
  .then(data => {
    globalGroupData = data;

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

    getWikiData(currentAlbum.wikipediaUrl).then(wikiData => {
      if (wikiData && wikiData.extract) {
        document.getElementById("wiki-data").innerHTML = wikiData.extract;
      } else {
        document.getElementById("wiki-data").innerHTML = "Could not load Wikipedia data.";
        console.warn("Wikipedia data extract was missing:", wikiData);
      }
    }).catch(error => {
        document.getElementById("wiki-data").innerHTML = "Error loading Wikipedia data.";
        console.error("Error fetching Wikipedia data:", error);
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

    updateProgressDisplay();

    // Set up the interval timer for subsequent updates, only once.
    // Check if a timer value is provided and if an interval hasn't been set yet.
    // A simple way to check if interval is set is to have a flag.
    if (typeof updateData.intervalId === 'undefined') {
        var timer = parseInt(refreshTimerString, 10);
        if (timer) {
            updateData.intervalId = setInterval(updateData, timer * 1000);
        }
    }
  })
  .catch(error => {
    console.error("Error in updateData:", error);
    throw error; // Re-throw to allow .catch in doThaThing if needed
  });
}

function updateProgressDisplay() {
  const progressTitleElement = document.getElementById('progress-title-text');
  const progressBarContainer = document.querySelector('.progress-bar-container');
  const progressBarFilled = document.getElementById('progress-bar-filled');
  const progressText = document.getElementById('progress-text');
  const loadingSpinner = document.getElementById('loading-spinner');

  if (!progressTitleElement || !progressBarContainer || !progressBarFilled || !progressText || !loadingSpinner) {
    console.error("One or more progress display elements are missing from the DOM.");
    return;
  }

  if (!globalGroupData || !albumStats || !albumStats.albums || albumStats.albums.length === 0) {
    progressTitleElement.textContent = 'Progress loading';
    if(progressBarContainer) progressBarContainer.style.display = 'none';
    progressText.textContent = '';
    loadingSpinner.style.display = 'inline-block';
  } else {
    progressTitleElement.textContent = 'Total progress';
    if(progressBarContainer) progressBarContainer.style.display = 'block';
    loadingSpinner.style.display = 'none';

    const generatedAlbumsCount = globalGroupData.numberOfGeneratedAlbums + 1;
    const totalAlbumsCount = albumStats.albums.length;

    let progressPercentage = 0;
    if (totalAlbumsCount > 0) {
      progressPercentage = (generatedAlbumsCount / totalAlbumsCount) * 100;
    }

    progressBarFilled.style.width = progressPercentage + '%';
    progressText.textContent = generatedAlbumsCount + '/' + totalAlbumsCount + ' (' + progressPercentage.toFixed(2) + '%)';
  }
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
