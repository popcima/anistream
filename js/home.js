/* HEBiANiME homepage — Miruro-inspired catalog */
var heroItems = [];
var heroIdx = 0;
var heroTimer = null;
var currentTab = 'trending';
var currentPage = 1;
var heroColors = ['#e49350','#e49343','#aec9e4','#e4a150','#e49335','#1abbd6','#e4c928','#1ae4f1','#43aef1','#e4d6ae'];

function escH(value) {
  return (value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripHtml(value) {
  return (value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function dotClass(status) {
  if (status === 'RELEASING') return 'ongoing';
  if (status === 'NOT_YET_RELEASED') return 'upcoming';
  return 'finished';
}

function mediaEpisodes(media) {
  if (media.nextAiringEpisode) return Math.max(0, media.nextAiringEpisode.episode - 1) + (media.episodes ? ' / ' + media.episodes : '');
  return media.episodes || '';
}

function formatCountdown(seconds) {
  if (!seconds || seconds <= 0) return '';
  var days = Math.floor(seconds / 86400);
  var hours = Math.floor((seconds % 86400) / 3600);
  return (days ? days + 'D ' : '') + hours + 'H';
}

function heroSlide(media, index) {
  var title = getTitle(media);
  var image = media.bannerImage || media.coverImage.extraLarge || media.coverImage.large;
  var description = stripHtml(media.description).slice(0, 260);
  var genres = (media.genres || []).slice(0, 3);
  var studio = media.studios && media.studios.nodes[0] ? media.studios.nodes[0].name : '';
  var episodes = mediaEpisodes(media);
  var score = media.averageScore || '';
  var countdown = media.nextAiringEpisode ? formatCountdown(media.nextAiringEpisode.timeUntilAiring) : '';
  var color = heroColors[index % heroColors.length];

  return (
    '<article class="home-hero-slide' + (index === 0 ? ' active' : '') + '" style="--hero-accent:' + color + '">' +
      '<img src="' + escH(image) + '" alt="' + escH(title) + '" loading="' + (index === 0 ? 'eager' : 'lazy') + '">' +
      '<div class="home-hero-overlay"></div>' +
      (media.nextAiringEpisode ? '<div class="home-hero-countdown"><i class="fa-regular fa-clock"></i> EP ' + media.nextAiringEpisode.episode + (countdown ? ' ' + countdown : '') + '</div>' : '') +
      '<div class="home-hero-copy">' +
        '<div class="home-hero-meta">' +
          '<span>' + escH((media.format || 'TV').replace(/_/g, ' ')) + '</span>' +
          (episodes ? '<span><i class="fa-solid fa-closed-captioning"></i> ' + episodes + '</span>' : '') +
          (score ? '<span><i class="fa-regular fa-star"></i> ' + score + '</span>' : '') +
          (media.duration ? '<span><i class="fa-regular fa-clock"></i> ' + media.duration + ' mins</span>' : '') +
        '</div>' +
        '<h2>' + escH(title) + '</h2>' +
        '<div class="home-hero-tags">' +
          (genres.length ? '<span>' + genres.map(escH).join(' · ') + '</span>' : '') +
          (studio ? '<span>' + escH(studio) + '</span>' : '') +
        '</div>' +
        (description ? '<p>' + escH(description) + (description.length >= 260 ? '…' : '') + '</p>' : '') +
      '</div>' +
      '<div class="home-hero-actions">' +
        '<a href="watch.html?id=' + media.id + '&ep=1&lang=sub"><i class="fa-solid fa-circle-info"></i> DETAILS</a>' +
        '<a href="watch.html?id=' + media.id + '&ep=1&lang=sub"><i class="fa-solid fa-circle-play"></i> WATCH NOW</a>' +
      '</div>' +
    '</article>'
  );
}

function showHeroSlide(index) {
  if (!heroItems.length) return;
  heroIdx = ((index % heroItems.length) + heroItems.length) % heroItems.length;
  document.querySelectorAll('.home-hero-slide').forEach(function (slide, slideIndex) {
    slide.classList.toggle('active', slideIndex === heroIdx);
  });
  document.getElementById('heroIndex').textContent = heroIdx + 1;
}

function startHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = setInterval(function () { showHeroSlide(heroIdx + 1); }, 8000);
}

function initHero(items) {
  heroItems = items.filter(function (media) {
    return media.bannerImage || media.coverImage.extraLarge;
  }).slice(0, 12);
  if (!heroItems.length) return;

  document.getElementById('heroSlides').innerHTML = heroItems.map(heroSlide).join('');
  document.getElementById('heroTotal').textContent = heroItems.length;
  document.getElementById('heroPrev').addEventListener('click', function () {
    showHeroSlide(heroIdx - 1);
    startHeroTimer();
  });
  document.getElementById('heroNext').addEventListener('click', function () {
    showHeroSlide(heroIdx + 1);
    startHeroTimer();
  });
  startHeroTimer();
}

function initGenres() {
  var row = document.getElementById('genreRow');
  row.innerHTML = GENRES.map(function (genre) {
    return '<button type="button" data-genre="' + escH(genre) + '">' + escH(genre) + '</button>';
  }).join('');
  row.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-genre]');
    if (button) location.href = 'search.html?genre=' + encodeURIComponent(button.dataset.genre);
  });
  document.getElementById('genreL').addEventListener('click', function () {
    row.scrollBy({ left: -440, behavior: 'smooth' });
  });
  document.getElementById('genreR').addEventListener('click', function () {
    row.scrollBy({ left: 440, behavior: 'smooth' });
  });
}

function cardSkeletons(count) {
  var html = '';
  for (var index = 0; index < count; index++) {
    html += '<div class="home-anime-card"><div class="skel home-card-skeleton"></div><div class="skel skel-line"></div></div>';
  }
  return html;
}

function catalogCard(media) {
  var title = getTitle(media);
  var image = media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium;
  var episodes = mediaEpisodes(media);
  return (
    '<a class="home-anime-card fade-in" href="watch.html?id=' + media.id + '&ep=1&lang=sub" style="--card-accent:' + escH(media.coverImage.color || '#b5a8ff') + '">' +
      '<span class="home-card-image"><img src="' + escH(image) + '" alt="' + escH(title) + '" loading="lazy"><i class="fa-solid fa-play"></i><b>+</b></span>' +
      '<h3><i class="' + dotClass(media.status) + '"></i>' + escH(title) + '</h3>' +
      '<div class="home-card-meta">' +
        '<span>' + escH((media.format || 'TV').replace(/_/g, ' ')) + '</span>' +
        (media.seasonYear ? '<span><i class="fa-solid fa-calendar-days"></i> ' + media.seasonYear + '</span>' : '') +
        (episodes ? '<span><i class="fa-solid fa-closed-captioning"></i> ' + episodes + '</span>' : '') +
        (media.averageScore ? '<span><i class="fa-regular fa-star"></i> ' + media.averageScore + '</span>' : '') +
      '</div>' +
    '</a>'
  );
}

async function loadCatalog(tab, page) {
  var grid = document.getElementById('mainGrid');
  grid.innerHTML = cardSkeletons(20);
  currentTab = tab || 'newest';
  currentPage = page || 1;
  var fetcher = { trending: getTrending, popular: getPopular, toprated: getTopRated }[currentTab];
  var items = (await fetcher(currentPage, 20)).filter(function (media) { return media.type === 'ANIME'; });
  grid.innerHTML = items.map(catalogCard).join('');
  document.getElementById('pageNum').textContent = currentPage;
  document.getElementById('pagePrev').disabled = currentPage <= 1;
  document.getElementById('pageNext').disabled = items.length < 20;
}

function initCatalogControls() {
  document.querySelector('.home-tabs').addEventListener('click', function (event) {
    var button = event.target.closest('button[data-tab]');
    if (!button) return;
    document.querySelectorAll('.home-tabs button').forEach(function (item) { item.classList.remove('active'); });
    button.classList.add('active');
    loadCatalog(button.dataset.tab, 1);
  });
  document.getElementById('pagePrev').addEventListener('click', function () {
    if (currentPage > 1) loadCatalog(currentTab, currentPage - 1);
  });
  document.getElementById('pageNext').addEventListener('click', function () {
    loadCatalog(currentTab, currentPage + 1);
  });
}

function listCard(media, dot) {
  var title = getTitle(media);
  var cover = media.coverImage.large || media.coverImage.medium;
  var banner = media.bannerImage || cover;
  var episodes = mediaEpisodes(media);
  return (
    '<a class="home-list-card" href="watch.html?id=' + media.id + '&ep=1&lang=sub">' +
      '<span class="home-list-backdrop" style="background-image:url(\'' + escH(banner) + '\')"></span>' +
      '<img src="' + escH(cover) + '" alt="' + escH(title) + '">' +
      '<span class="home-list-copy">' +
        '<strong><i class="' + (dot || dotClass(media.status)) + '"></i>' + escH(title) + '</strong>' +
        '<small>' +
          '<b>' + escH((media.format || 'TV').replace(/_/g, ' ')) + '</b>' +
          (media.seasonYear ? '<b><i class="fa-solid fa-calendar-days"></i> ' + media.seasonYear + '</b>' : '') +
          (episodes ? '<b><i class="fa-solid fa-closed-captioning"></i> ' + episodes + '</b>' : '') +
          (media.averageScore ? '<b><i class="fa-regular fa-star"></i> ' + media.averageScore + '</b>' : '') +
        '</small>' +
      '</span>' +
    '</a>'
  );
}

async function loadLists() {
  var results = await Promise.all([
    getAiring(1, 5),
    getUpcoming(1, 5),
    getFinished(1, 6),
    getMovies(1, 6)
  ]);
  document.getElementById('topAiringList').innerHTML = results[0].map(function (media) { return listCard(media, 'ongoing'); }).join('');
  document.getElementById('upcomingList').innerHTML = results[1].map(function (media) { return listCard(media, 'upcoming'); }).join('');
  document.getElementById('finishedList').innerHTML = results[2].map(function (media) { return listCard(media, 'finished'); }).join('');
  document.getElementById('moviesList').innerHTML = results[3].map(function (media) { return listCard(media, 'finished'); }).join('');
}

var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function initScheduleDays() {
  var now = new Date();
  var current = now.getDay();
  var container = document.getElementById('schedDays');
  container.innerHTML = DAYS.map(function (day, index) {
    var date = new Date(now);
    date.setDate(date.getDate() + index - current);
    return (
      '<button type="button" data-offset="' + (index - current) + '"' + (index === current ? ' class="active"' : '') + '>' +
        day + (index === current ? '<small>' + date.toLocaleString('default', { month:'short' }) + ' ' + date.getDate() + '</small>' : '') +
      '</button>' + (index < DAYS.length - 1 ? '<i>/</i>' : '')
    );
  }).join('');

  container.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-offset]');
    if (!button) return;
    container.querySelectorAll('button').forEach(function (item) {
      item.classList.remove('active');
      item.querySelector('small') && item.querySelector('small').remove();
    });
    button.classList.add('active');
    var selected = new Date();
    selected.setDate(selected.getDate() + parseInt(button.dataset.offset, 10));
    button.insertAdjacentHTML('beforeend', '<small>' + selected.toLocaleString('default', { month:'short' }) + ' ' + selected.getDate() + '</small>');
    loadSchedule(parseInt(button.dataset.offset, 10));
  });
}

async function loadSchedule(offset) {
  var list = document.getElementById('schedList');
  list.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';
  try {
    var schedule = await getDaySchedule(offset || 0);
    if (!schedule.length) {
      list.innerHTML = '<p class="home-empty">No schedule data</p>';
      return;
    }
    list.innerHTML = schedule.slice(0, 11).map(function (item, index) {
      var date = new Date(item.airingAt * 1000);
      var title = item.media ? (item.media.title.english || item.media.title.romaji) : 'Unknown';
      return (
        '<a class="home-schedule-item' + (index < 2 ? ' aired' : '') + '" href="watch.html?id=' + item.media.id + '&ep=' + item.episode + '&lang=sub">' +
          '<time>' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0') + '</time>' +
          '<strong>' + escH(title) + '</strong>' +
          '<span>EP ' + item.episode + '</span>' +
        '</a>'
      );
    }).join('');
  } catch (error) {
    list.innerHTML = '<p class="home-empty">Schedule unavailable</p>';
  }
}

async function initHome() {
  initGenres();
  initCatalogControls();
  initScheduleDays();

  var trendingPromise = getTrending(1, 12);
  loadCatalog('trending', 1);
  loadLists();
  loadSchedule(0);

  var trending = await trendingPromise;
  initHero(trending);

  if (trending && trending.length) {
    var ldList = document.createElement('script');
    ldList.type = 'application/ld+json';
    ldList.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Trending Anime on HEBiANiME',
      'url': 'https://hebianime.com/',
      'itemListElement': trending.slice(0, 10).map(function(m, i) {
        return {
          '@type': 'ListItem',
          'position': i + 1,
          'name': (m.title && (m.title.english || m.title.romaji)) || 'Anime',
          'url': 'https://hebianime.com/anime.html?id=' + m.id,
          'image': (m.coverImage && (m.coverImage.extraLarge || m.coverImage.large)) || ''
        };
      })
    });
    document.head.appendChild(ldList);
  }
}

initHome().catch(function (error) {
  console.error(error);
  var grid = document.getElementById('mainGrid');
  if (grid) grid.innerHTML = '<div class="error-wrap" style="grid-column:1/-1"><h3>Failed to load</h3><p>' + escH(error.message) + '</p></div>';
});
