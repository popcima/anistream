/* HEBiANiME watch page — Miruro-inspired player workspace */
var params = new URLSearchParams(location.search);
var watchId = params.get('id');
var watchEp = parseInt(params.get('ep'), 10) || 1;
var watchLang = params.get('lang') || 'sub';
var watchData = null;
var main = document.getElementById('mainContent');
var epDates = {};
var epImages = {};
var currentRangeStart = 1;
var EP_CHUNK = 50;

function escH(value) {
  return (value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripHtml(value) {
  return (value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function updateUrl() {
  history.replaceState({}, '', 'watch.html?id=' + watchId + '&ep=' + watchEp + '&lang=' + watchLang);
}

function titleCase(value) {
  if (!value) return '—';
  value = value.replace(/_/g, ' ').toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function fmtDate(date, shortMonth) {
  if (!date || !date.year) return '—';
  var short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var full = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var months = shortMonth ? short : full;
  return months[(date.month || 1) - 1] + (date.day ? ' ' + date.day + ', ' : ' ') + date.year;
}

function unixDate(timestamp) {
  if (!timestamp) return '';
  var date = new Date(timestamp * 1000);
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()] + ' ' + String(date.getDate()).padStart(2, '0') + ', ' + date.getFullYear();
}

function buildEpisodeMaps(media) {
  epDates = {};
  epImages = {};

  if (media.airingSchedule && media.airingSchedule.nodes) {
    media.airingSchedule.nodes.forEach(function (item) {
      epDates[item.episode] = unixDate(item.airingAt);
    });
  }

  (media.streamingEpisodes || []).forEach(function (episode, index) {
    var raw = (episode.title || '').trim();
    var match = raw.match(/(?:episode|ep\.?)\s*(\d+)[\s:·\-–—]*(.*)/i) ||
      raw.match(/^(\d+)[\s:·\-–—]*(.*)/);
    var number = match ? parseInt(match[1], 10) : index + 1;
    var episodeTitle = match && match[2] ? match[2].trim() : raw;
    if (!epImages[number]) {
      epImages[number] = {
        thumb: episode.thumbnail || '',
        title: episodeTitle.replace(/^episode\s*\d+[\s:·\-–—]*/i, '')
      };
    }
  });
}

function episodeTitle(number, mediaTitle) {
  var item = epImages[number] || {};
  return item.title ? 'Episode ' + number + ': ' + item.title : 'Episode ' + number + ': ' + mediaTitle;
}

function episodeDescription(number, mediaTitle) {
  var item = epImages[number] || {};
  if (item.title) return 'Watch ' + item.title + ' from ' + mediaTitle + '.';
  return 'Continue ' + mediaTitle + ' with episode ' + number + '.';
}

function totalEpisodes(media) {
  return media.episodes || (media.nextAiringEpisode ? Math.max(1, media.nextAiringEpisode.episode - 1) : 50);
}

function availableEpisodes(media) {
  var total = totalEpisodes(media);
  return media.nextAiringEpisode ? Math.min(total, Math.max(1, media.nextAiringEpisode.episode - 1)) : total;
}

function rangeEnd(total) {
  return Math.min(currentRangeStart + EP_CHUNK - 1, total);
}

function buildRangeControl(total) {
  if (total <= EP_CHUNK) {
    return '<div class="mw-range-static">1 - ' + total + '</div>';
  }

  var options = '';
  for (var start = 1; start <= total; start += EP_CHUNK) {
    var end = Math.min(start + EP_CHUNK - 1, total);
    options += '<option value="' + start + '"' + (start === currentRangeStart ? ' selected' : '') + '>' + start + ' - ' + end + '</option>';
  }
  return '<select class="mw-range-select" id="rangeSelect" aria-label="Episode range">' + options + '</select>';
}

function buildEpisodeCard(number, poster, mediaTitle) {
  var item = epImages[number] || {};
  var image = item.thumb || poster;
  var title = episodeTitle(number, mediaTitle);
  var description = episodeDescription(number, mediaTitle);
  var date = epDates[number] || '';
  return (
    '<button class="mw-episode-item' + (number === watchEp ? ' active' : '') + '" id="episode-' + number + '" data-ep="' + number + '" type="button">' +
      '<span class="mw-episode-thumb">' +
        '<img src="' + escH(image) + '" alt="' + escH(mediaTitle) + ' Episode ' + number + '" loading="lazy">' +
        '<strong>EP ' + number + '</strong>' +
      '</span>' +
      '<span class="mw-episode-copy">' +
        '<span class="mw-episode-title">' + escH(title) + '</span>' +
        '<span class="mw-episode-description">' + escH(description) + '</span>' +
        '<span class="mw-episode-meta"><i class="fa-solid fa-closed-captioning"></i><time>' + escH(date) + '</time></span>' +
      '</span>' +
    '</button>'
  );
}

function buildEpisodeList(total, poster, mediaTitle) {
  var html = '';
  var end = rangeEnd(total);
  for (var number = currentRangeStart; number <= end; number++) {
    html += buildEpisodeCard(number, poster, mediaTitle);
  }
  return html;
}

function buildRecommendations(recommendations) {
  if (!recommendations || !recommendations.nodes) return '';
  var items = recommendations.nodes.map(function (item) {
    return item.mediaRecommendation;
  }).filter(function (media) {
    return media && media.type === 'ANIME';
  }).slice(0, 8);

  if (!items.length) return '';

  return (
    '<section class="mw-recommendations">' +
      '<h2><i class="fa-solid fa-chevron-right"></i> RECOMMENDATIONS</h2>' +
      '<div class="mw-rec-list">' +
        items.map(function (media) {
          var title = getTitle(media);
          var cover = media.coverImage && media.coverImage.large;
          var banner = media.bannerImage || cover;
          var format = (media.format || 'TV').replace(/_/g, ' ');
          var score = media.averageScore ? Math.round(media.averageScore) : '';
          return (
            '<a class="mw-rec-card" href="watch.html?id=' + media.id + '&ep=1&lang=sub">' +
              '<span class="mw-rec-backdrop" style="background-image:url(\'' + escH(banner) + '\')"></span>' +
              '<img src="' + escH(cover) + '" alt="' + escH(title) + '">' +
              '<span class="mw-rec-copy">' +
                '<span class="mw-rec-title"><i></i>' + escH(title) + '</span>' +
                '<span class="mw-rec-meta"><b>' + escH(format) + '</b>' +
                  (media.episodes ? '<b><i class="fa-solid fa-closed-captioning"></i> ' + media.episodes + '</b>' : '') +
                  (score ? '<b><i class="fa-regular fa-star"></i> ' + score + '</b>' : '') +
                '</span>' +
              '</span>' +
            '</a>'
          );
        }).join('') +
      '</div>' +
      '<button class="mw-rec-more" type="button" aria-label="Show more recommendations"><i class="fa-solid fa-chevron-down"></i></button>' +
    '</section>'
  );
}

function buildNextAiring(nextAiringEpisode) {
  if (!nextAiringEpisode || nextAiringEpisode.timeUntilAiring <= 0) return '';
  var seconds = nextAiringEpisode.timeUntilAiring;
  var days = Math.floor(seconds / 86400);
  var hours = Math.floor((seconds % 86400) / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);
  var countdown = (days ? days + 'd ' : '') + (hours ? hours + 'h ' : '') + (!days ? minutes + 'm' : '');
  return (
    '<div class="mw-next-airing">' +
      '<i class="fa-solid fa-bell"></i>' +
      '<strong>Episode ' + nextAiringEpisode.episode + ' in ' + countdown.trim() + '</strong>' +
      '<span>· ' + unixDate(nextAiringEpisode.airingAt) + '</span>' +
    '</div>'
  );
}

function buildPromo() {
  return (
    '<div class="mw-promo" aria-label="HEBiANiME promotion">' +
      '<span class="mw-promo-plane"><i class="fa-solid fa-paper-plane"></i></span>' +
      '<span><small>ONLY ON</small><strong>HEBiANiME</strong></span>' +
      '<b>STREAM<br>THE BEST</b>' +
      '<em>WATCH NOW</em>' +
    '</div>'
  );
}


var SEASON_FORMATS = ['TV', 'TV_SHORT', 'OVA', 'ONA', 'MOVIE', 'SPECIAL'];

function seasonPrequel(edges) {
  return (edges || []).find(function(e) {
    return e.relationType === 'PREQUEL' && e.node && e.node.type === 'ANIME' &&
      SEASON_FORMATS.indexOf(e.node.format) !== -1;
  });
}

function seasonSequel(edges, seen) {
  return (edges || []).find(function(e) {
    return e.relationType === 'SEQUEL' && e.node && e.node.type === 'ANIME' &&
      SEASON_FORMATS.indexOf(e.node.format) !== -1 && !seen[e.node.id];
  });
}

async function buildSeasonChain(media) {
  var root = media;
  for (var b = 0; b < 6; b++) {
    var pq = seasonPrequel((root.relations && root.relations.edges) || []);
    if (!pq) break;
    try { root = await getAnimeRelations(pq.node.id); } catch(e) { break; }
  }

  var chain = [];
  var seen = {};
  var cur = root;
  for (var f = 0; f < 10; f++) {
    if (!cur || seen[cur.id]) break;
    seen[cur.id] = true;
    chain.push({
      id: cur.id,
      title: cur.title ? (cur.title.english || cur.title.romaji || '') : '',
      isCurrent: cur.id === parseInt(watchId, 10)
    });
    var sq = seasonSequel((cur.relations && cur.relations.edges) || [], seen);
    if (!sq) break;
    try { cur = await getAnimeRelations(sq.node.id); } catch(e) { break; }
  }

  return chain.length > 1 ? chain : null;
}

function renderSeasonBar(chain) {
  var bar = document.getElementById('seasonBar');
  if (!bar || !chain) return;
  bar.innerHTML = chain.map(function(s, i) {
    return '<a class="mw-season-btn' + (s.isCurrent ? ' active' : '') + '" href="watch.html?id=' + s.id + '&ep=1&lang=' + escH(watchLang) + '" title="' + escH(s.title) + '">S' + (i + 1) + '</a>';
  }).join('');
}

function renderWatch(media) {
  var title = getTitle(media);
  var poster = media.coverImage.extraLarge || media.coverImage.large;
  var seriesTotal = totalEpisodes(media);
  var total = availableEpisodes(media);
  var description = stripHtml(media.description);
  var episodeData = epImages[watchEp] || {};
  var currentTitle = episodeData.title || title;
  var status = formatStatus(media.status);
  var studios = media.studios && media.studios.nodes && media.studios.nodes.length
    ? media.studios.nodes.map(function (studio) { return studio.name; }).join(', ')
    : '—';
  var aired = media.nextAiringEpisode ? Math.max(0, media.nextAiringEpisode.episode - 1) : total;
  var season = media.season ? titleCase(media.season) : '—';
  var romaji = media.title && media.title.romaji && media.title.romaji !== title ? media.title.romaji : '';
  var genres = (media.genres || []).slice(0, 3);
  var episodeDate = epDates[watchEp] || fmtDate(media.startDate, true);
  var officialSite = '';

  if (media.externalLinks) {
    var official = media.externalLinks.filter(function (link) { return link.site === 'Official Site'; })[0];
    if (official) officialSite = official.url;
  }

  currentRangeStart = Math.floor((watchEp - 1) / EP_CHUNK) * EP_CHUNK + 1;
  document.title = 'Ep ' + watchEp + ' — ' + title + ' — HEBiANiME';

  var watchCanon = 'https://hebianime.com/watch.html?id=' + watchId + '&ep=' + watchEp + '&lang=' + watchLang;
  var watchDesc = 'Watch ' + title + ' Episode ' + watchEp + ' in HD on HEBiANiME. Stream subbed and dubbed anime free.';
  var watchCover = (media.coverImage && (media.coverImage.extraLarge || media.coverImage.large)) || '';
  function setWM(id, attr, val) { var e = document.getElementById(id); if (e) e.setAttribute(attr, val); }
  setWM('meta-desc', 'content', watchDesc);
  setWM('canonical', 'href', watchCanon);
  setWM('og-title', 'content', title + ' Ep ' + watchEp + ' — HEBiANiME');
  setWM('og-desc', 'content', watchDesc);
  setWM('og-image', 'content', watchCover);
  setWM('og-url', 'content', watchCanon);
  setWM('tw-title', 'content', title + ' Ep ' + watchEp + ' — HEBiANiME');
  setWM('tw-desc', 'content', watchDesc);
  setWM('tw-image', 'content', watchCover);

  (function injectWatchSchemas() {
    ['ld-video', 'ld-breadcrumb'].forEach(function(id) {
      var old = document.getElementById(id);
      if (old) old.remove();
    });

    var videoScript = document.createElement('script');
    videoScript.type = 'application/ld+json';
    videoScript.id = 'ld-video';
    var videoObj = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      'name': title + ' Episode ' + watchEp,
      'description': watchDesc,
      'thumbnailUrl': watchCover,
      'uploadDate': episodeDate || fmtDate(media.startDate, true),
      'embedUrl': 'https://hebianime.com/watch.html?id=' + watchId + '&ep=' + watchEp,
      'publisher': {
        '@type': 'Organization',
        'name': 'HEBiANiME',
        'url': 'https://hebianime.com',
        'logo': { '@type': 'ImageObject', 'url': 'https://hebianime.com/logo.svg' }
      }
    };
    videoScript.text = JSON.stringify(videoObj);
    document.head.appendChild(videoScript);

    var bcScript = document.createElement('script');
    bcScript.type = 'application/ld+json';
    bcScript.id = 'ld-breadcrumb';
    bcScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://hebianime.com/' },
        { '@type': 'ListItem', 'position': 2, 'name': title, 'item': 'https://hebianime.com/anime.html?id=' + watchId },
        { '@type': 'ListItem', 'position': 3, 'name': 'Episode ' + watchEp, 'item': watchCanon }
      ]
    });
    document.head.appendChild(bcScript);
  })();

  main.innerHTML =
    '<div class="mw-shell">' +
      '<div class="mw-bookmark" id="bookmarkNotice">' +
        '<i class="fa-solid fa-bookmark"></i>' +
        '<span>Bookmark <strong>HEBiANiME</strong> so you never lose us.</span>' +
        '<button id="bookmarkClose" type="button" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>' +

      '<div class="mw-top-grid">' +
        '<div class="mw-player">' +
          '<iframe id="playerIframe" src="' + escH(getStreamUrl(watchId, watchEp, watchLang)) + '" title="' + escH(title) + ' episode ' + watchEp + '" allowfullscreen scrolling="no" allow="autoplay; fullscreen"></iframe>' +
        '</div>' +
        '<aside class="mw-episodes">' +
          '<div class="mw-season-bar" id="seasonBar"></div>' +
          '<div class="mw-episode-controls">' +
            buildRangeControl(total) +
            '<label class="mw-episode-filter"><i class="fa-solid fa-magnifying-glass"></i><input id="epFilter" type="search" placeholder="Filter episodes..." autocomplete="off"></label>' +
            '<button id="spoilerToggle" type="button" aria-label="Toggle spoilers" title="Toggle spoilers"><i class="fa-solid fa-eye"></i></button>' +
            '<button id="imageToggle" type="button" aria-label="Toggle episode images" title="Toggle episode images"><i class="fa-solid fa-image"></i></button>' +
          '</div>' +
          '<div class="mw-episode-list" id="epList">' + buildEpisodeList(total, poster, title) + '</div>' +
          buildNextAiring(media.nextAiringEpisode) +
        '</aside>' +
      '</div>' +

      '<div class="mw-content-grid">' +
        '<div class="mw-primary">' +
          '<section class="mw-current-episode">' +
            '<div class="mw-current-top">' +
              '<h1 id="currentEpHeading">' + watchEp + '. ' + escH(currentTitle) + '</h1>' +
              '<div class="mw-source-controls">' +
                '<button class="mw-source-btn" id="subBtn" type="button"><i class="fa-solid fa-closed-captioning"></i><span id="langLabel">' + (watchLang === 'dub' ? 'Dub' : 'Sub') + '</span><i class="fa-solid fa-sort"></i></button>' +
                '<button class="mw-source-btn" type="button"><i class="fa-solid fa-bolt"></i> mega <i class="fa-solid fa-sort"></i></button>' +
              '</div>' +
            '</div>' +
            '<div class="mw-episode-actions">' +
              '<div class="mw-episode-pills">' +
                '<span id="currentEpDate">' + escH(episodeDate) + '</span>' +
                '<span><i class="fa-solid fa-closed-captioning"></i> <b id="currentEpCount">' + watchEp + '</b></span>' +
                '<span><i class="fa-solid fa-microphone"></i> 0</span>' +
              '</div>' +
              '<div class="mw-action-buttons">' +
                '<button id="prevEpBtn" type="button"' + (watchEp <= 1 ? ' disabled' : '') + ' aria-label="Previous episode"><i class="fa-solid fa-backward-step"></i></button>' +
                '<button id="nextEpBtn" type="button"' + (watchEp >= total ? ' disabled' : '') + ' aria-label="Next episode"><i class="fa-solid fa-forward-step"></i></button>' +
                '<button type="button"><i class="fa-solid fa-bug"></i> Report</button>' +
                '<button id="downloadBtn" type="button"><i class="fa-solid fa-download"></i> Download</button>' +
                '<button id="shareBtn" type="button"><i class="fa-solid fa-share-nodes"></i> Share</button>' +
              '</div>' +
            '</div>' +
            '<p id="currentEpDescription">' + escH(episodeDescription(watchEp, title)) + '</p>' +
          '</section>' +

          '<section class="mw-anime-card">' +
            '<div class="mw-anime-poster-col">' +
              '<img class="mw-anime-poster" src="' + escH(poster) + '" alt="' + escH(title) + '">' +
              '<div class="mw-poster-actions">' +
                (media.trailer && media.trailer.id
                  ? '<a href="https://www.youtube.com/watch?v=' + escH(media.trailer.id) + '" target="_blank" rel="noopener">TRAILER</a>'
                  : '<span>NO TRAILER</span>') +
                '' +
              '</div>' +
              '<div class="mw-list-links">' +
                '<a href="https://anilist.co/anime/' + watchId + '" target="_blank" rel="noopener">AL</a>' +
                (media.idMal ? '<a href="https://myanimelist.net/anime/' + media.idMal + '" target="_blank" rel="noopener">MAL</a>' : '') +
              '</div>' +
            '</div>' +
            '<div class="mw-anime-copy">' +
              '<span class="mw-anime-title">' + escH(title) + '</span>' +
              (romaji ? '<em>' + escH(romaji) + '</em>' : '') +
              '<div class="mw-genres">' + genres.map(function (genre) { return '<span>' + escH(genre) + '</span>'; }).join('') + '</div>' +
              (description ? '<p class="mw-anime-description">' + escH(description) + '</p>' : '') +
              '<div class="mw-anime-facts">' +
                '<div><span>Format:</span><strong>' + escH((media.format || 'TV').replace(/_/g, ' ')) + '</strong></div>' +
                '<div><span>Start Date:</span><strong>' + fmtDate(media.startDate, false) + '</strong></div>' +
                '<div><span>Status:</span><strong>' + escH(status) + '</strong></div>' +
                '<div><span>End Date:</span><strong>' + fmtDate(media.endDate, false) + '</strong></div>' +
                '<div><span>Episodes:</span><strong>' + aired + ' / ' + seriesTotal + '</strong></div>' +
                '<div><span>Country:</span><strong>' + escH(media.countryOfOrigin || '—') + '</strong></div>' +
                '<div><span>Rating:</span><strong>' + (media.averageScore || '—') + ' <small>/100</small></strong></div>' +
                '<div><span>Adult:</span><strong>' + (media.isAdult ? 'Yes' : 'No') + '</strong></div>' +
                '<div><span>Duration:</span><strong>' + (media.duration ? media.duration + ' min' : '—') + '</strong></div>' +
                '<div><span>Studios:</span><strong>' + escH(studios) + '</strong></div>' +
                '<div><span>Season:</span><strong>' + escH(season) + '</strong></div>' +
                (officialSite ? '<div><span>Official Site:</span><strong><a href="' + escH(officialSite) + '" target="_blank" rel="noopener">' + escH(officialSite.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')) + '</a></strong></div>' : '') +
              '</div>' +
            '</div>' +
          '</section>' +

        '</div>' +

        '<aside class="mw-secondary">' +
          buildPromo() +
          buildRecommendations(media.recommendations) +
        '</aside>' +
      '</div>' +
    '</div>';

  attachEvents(total, poster, title);
}

function attachEvents(total, poster, mediaTitle) {
  var bookmarkClose = document.getElementById('bookmarkClose');
  if (bookmarkClose) {
    bookmarkClose.addEventListener('click', function () {
      document.getElementById('bookmarkNotice').remove();
    });
  }

  document.getElementById('subBtn').addEventListener('click', function () {
    watchLang = watchLang === 'sub' ? 'dub' : 'sub';
    updateCurrentEpisode(total, mediaTitle);
  });

  document.getElementById('prevEpBtn').addEventListener('click', function () {
    if (watchEp > 1) setEpisode(watchEp - 1, total, poster, mediaTitle);
  });

  document.getElementById('nextEpBtn').addEventListener('click', function () {
    if (watchEp < total) setEpisode(watchEp + 1, total, poster, mediaTitle);
  });

  document.getElementById('epList').addEventListener('click', function (event) {
    var card = event.target.closest('.mw-episode-item');
    if (card) setEpisode(parseInt(card.dataset.ep, 10), total, poster, mediaTitle);
  });

  var rangeSelect = document.getElementById('rangeSelect');
  if (rangeSelect) {
    rangeSelect.addEventListener('change', function () {
      currentRangeStart = parseInt(rangeSelect.value, 10);
      document.getElementById('epList').innerHTML = buildEpisodeList(total, poster, mediaTitle);
    });
  }

  document.getElementById('epFilter').addEventListener('input', function (event) {
    var query = event.target.value.toLowerCase().trim();
    document.querySelectorAll('.mw-episode-item').forEach(function (card) {
      card.hidden = query && !card.textContent.toLowerCase().includes(query);
    });
  });

  document.getElementById('spoilerToggle').addEventListener('click', function (event) {
    document.querySelector('.mw-episodes').classList.toggle('spoilers-hidden');
    event.currentTarget.classList.toggle('active');
  });

  document.getElementById('imageToggle').addEventListener('click', function (event) {
    document.querySelector('.mw-episodes').classList.toggle('images-hidden');
    event.currentTarget.classList.toggle('active');
  });

  document.getElementById('downloadBtn').addEventListener('click', function () {
    window.open(getStreamUrl(watchId, watchEp, watchLang), '_blank', 'noopener');
  });

  document.getElementById('shareBtn').addEventListener('click', function () {
    var shareData = { title: document.title, url: location.href };
    if (navigator.share) navigator.share(shareData).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(location.href);
  });
}

function setEpisode(number, total, poster, mediaTitle) {
  watchEp = number;
  var neededRange = Math.floor((watchEp - 1) / EP_CHUNK) * EP_CHUNK + 1;
  if (neededRange !== currentRangeStart) {
    currentRangeStart = neededRange;
    var select = document.getElementById('rangeSelect');
    if (select) select.value = String(currentRangeStart);
    document.getElementById('epList').innerHTML = buildEpisodeList(total, poster, mediaTitle);
  }
  updateCurrentEpisode(total, mediaTitle);
}

function updateCurrentEpisode(total, mediaTitle) {
  var current = epImages[watchEp] || {};
  var currentTitle = current.title || mediaTitle;
  var iframe = document.getElementById('playerIframe');
  if (iframe) iframe.src = getStreamUrl(watchId, watchEp, watchLang);

  document.title = 'Ep ' + watchEp + ' — ' + mediaTitle + ' — HEBiANiME';
  var epCanon = 'https://hebianime.com/watch.html?id=' + watchId + '&ep=' + watchEp + '&lang=' + watchLang;
  var epDesc = 'Watch ' + mediaTitle + ' Episode ' + watchEp + ' in HD on HEBiANiME. Stream subbed and dubbed anime free.';
  function setWMep(id, attr, val) { var e = document.getElementById(id); if (e) e.setAttribute(attr, val); }
  setWMep('meta-desc', 'content', epDesc);
  setWMep('canonical', 'href', epCanon);
  setWMep('og-url', 'content', epCanon);
  var epVideo = document.getElementById('ld-video');
  if (epVideo) { try { var vo = JSON.parse(epVideo.text); vo.name = mediaTitle + ' Episode ' + watchEp; vo.description = epDesc; vo.embedUrl = epCanon; epVideo.text = JSON.stringify(vo); } catch(e){} }
  var epBc = document.getElementById('ld-breadcrumb');
  if (epBc) { try { var bc = JSON.parse(epBc.text); bc.itemListElement[2].name = 'Episode ' + watchEp; bc.itemListElement[2].item = epCanon; epBc.text = JSON.stringify(bc); } catch(e){} }
  document.getElementById('currentEpHeading').textContent = watchEp + '. ' + currentTitle;
  document.getElementById('currentEpDate').textContent = epDates[watchEp] || fmtDate(watchData.startDate, true);
  document.getElementById('currentEpCount').textContent = watchEp;
  document.getElementById('currentEpDescription').textContent = episodeDescription(watchEp, mediaTitle);
  document.getElementById('langLabel').textContent = watchLang === 'dub' ? 'Dub' : 'Sub';
  var previous = document.getElementById('prevEpBtn');
  var next = document.getElementById('nextEpBtn');
  previous.disabled = watchEp <= 1;
  next.disabled = watchEp >= total;

  document.querySelectorAll('.mw-episode-item').forEach(function (card) {
    card.classList.toggle('active', parseInt(card.dataset.ep, 10) === watchEp);
  });

  updateUrl();
  scrollEpisodeIntoView(true);
}

function scrollEpisodeIntoView(smooth) {
  var episode = document.getElementById('episode-' + watchEp);
  var list = document.getElementById('epList');
  if (episode && list) {
    list.scrollTo({
      top: episode.offsetTop - list.clientHeight / 2 + episode.clientHeight / 2,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }
}

document.addEventListener('keydown', function (event) {
  if (!watchData || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
  var total = availableEpisodes(watchData);
  var poster = watchData.coverImage.extraLarge || watchData.coverImage.large;
  var title = getTitle(watchData);
  if (event.key === 'ArrowRight' && watchEp < total) setEpisode(watchEp + 1, total, poster, title);
  if (event.key === 'ArrowLeft' && watchEp > 1) setEpisode(watchEp - 1, total, poster, title);
});

if (!watchId) {
  main.innerHTML = '<div class="error-wrap" style="padding-top:120px"><h3>No anime selected</h3><a href="index.html" class="btn btn-primary" style="margin-top:14px">Go Home</a></div>';
} else {
  getAnimeById(watchId).then(function (media) {
    watchData = media;
    buildEpisodeMaps(media);
    renderWatch(media);
    buildSeasonChain(media).then(renderSeasonBar).catch(function() {});
  }).catch(function (error) {
    main.innerHTML = '<div class="error-wrap" style="padding-top:120px"><h3>Failed to load</h3><p>' + escH(error.message) + '</p><a class="btn btn-primary" href="index.html" style="margin-top:14px">Go Home</a></div>';
  });
}
