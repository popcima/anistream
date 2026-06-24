/* Search page */
var params = new URLSearchParams(location.search);
var currentQuery  = params.get('q')     || '';
var currentGenre  = params.get('genre') || '';
var currentPage   = 1;
var searchLoading = false;

var searchInput  = document.getElementById('searchInput');
var resultsGrid  = document.getElementById('resultsGrid');
var resultsHeader = document.getElementById('resultsHeader');
var loadMoreWrap = document.getElementById('loadMoreWrap');
var loadMoreBtn  = document.getElementById('loadMoreBtn');

searchInput.value = currentQuery;
document.title = currentQuery ? '"' + currentQuery + '" — HEBiANiME' : 'Browse Anime — HEBiANiME';
(function() {
  var desc = currentQuery
    ? 'Search results for "' + currentQuery + '" on HEBiANiME. Watch anime online free in HD.'
    : 'Browse thousands of anime on HEBiANiME. Search by title, genre, season, and year.';
  var canon = currentQuery
    ? 'https://hebianime.com/search.html?q=' + encodeURIComponent(currentQuery)
    : 'https://hebianime.com/search.html';
  var ogTitle = currentQuery ? '"' + currentQuery + '" — HEBiANiME' : 'Browse Anime — HEBiANiME';
  function setS(id, attr, val) { var e = document.getElementById(id); if (e) e.setAttribute(attr, val); }
  setS('meta-desc', 'content', desc);
  setS('canonical', 'href', canon);
  setS('og-title', 'content', ogTitle);
  setS('og-desc', 'content', desc);
})();

function escH(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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

function searchCard(media) {
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

function cardSkeletons(count) {
  var html = '';
  for (var i = 0; i < count; i++) {
    html += '<div class="home-anime-card"><div class="skel home-card-skeleton"></div><div class="skel skel-line"></div></div>';
  }
  return html;
}

function buildGenreRow() {
  var row = document.getElementById('genreRow');
  row.innerHTML = GENRES.map(function(g) {
    return '<button type="button" data-genre="' + escH(g) + '"' + (g === currentGenre ? ' class="active"' : '') + '>' + escH(g) + '</button>';
  }).join('');
  row.addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-genre]');
    if (!btn) return;
    currentGenre = btn.dataset.genre === currentGenre ? '' : btn.dataset.genre;
    row.querySelectorAll('button').forEach(function(b) {
      b.classList.toggle('active', b.dataset.genre === currentGenre);
    });
    var qs = new URLSearchParams();
    if (currentQuery) qs.set('q', currentQuery);
    if (currentGenre) qs.set('genre', currentGenre);
    history.replaceState({}, '', '?' + qs.toString());
    currentPage = 1;
    doSearch(true);
  });
  document.getElementById('genreL').addEventListener('click', function() {
    row.scrollBy({ left: -440, behavior: 'smooth' });
  });
  document.getElementById('genreR').addEventListener('click', function() {
    row.scrollBy({ left: 440, behavior: 'smooth' });
  });
}

function setHeader(total, query, genre) {
  var text = '';
  if (total !== null && total !== undefined) {
    text = 'Found <span>' + (total || 0).toLocaleString() + '</span> results';
    if (query) text += ' for &ldquo;<span>' + escH(query) + '</span>&rdquo;';
    if (genre)  text += ' in <span>' + escH(genre) + '</span>';
  }
  resultsHeader.innerHTML = text;
}

async function doSearch(reset) {
  if (searchLoading) return;
  searchLoading = true;
  if (reset) {
    currentPage = 1;
    resultsGrid.innerHTML = cardSkeletons(24);
    loadMoreWrap.hidden = true;
  } else {
    loadMoreBtn.textContent = 'Loading...';
    loadMoreBtn.disabled = true;
  }

  try {
    var page;
    if (!currentQuery && currentGenre) {
      page = await getByGenre(currentGenre, currentPage, 24);
    } else {
      page = await searchAnime(currentQuery || null, currentGenre ? [currentGenre] : [], currentPage, 24);
    }

    var items = (page.media || []).filter(function(m) { return m.type === 'ANIME'; });
    var hasNext = page.pageInfo && page.pageInfo.hasNextPage;

    if (reset) {
      setHeader(page.pageInfo && page.pageInfo.total, currentQuery, currentGenre);
      resultsGrid.innerHTML = items.length
        ? items.map(searchCard).join('')
        : '<div class="error-wrap" style="grid-column:1/-1"><h3>No results found</h3><p>Try a different title or genre.</p></div>';
    } else {
      resultsGrid.insertAdjacentHTML('beforeend', items.map(searchCard).join(''));
    }

    loadMoreWrap.hidden = !hasNext;
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.disabled = false;
    currentPage++;
  } catch(err) {
    console.error(err);
    if (reset) resultsGrid.innerHTML = '<div class="error-wrap" style="grid-column:1/-1"><h3>Error loading</h3><p>' + escH(err.message) + '</p></div>';
  } finally {
    searchLoading = false;
  }
}

var debounceTimer;
searchInput.addEventListener('input', function() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function() {
    currentQuery = searchInput.value.trim();
    var qs = new URLSearchParams();
    if (currentQuery) qs.set('q', currentQuery);
    if (currentGenre) qs.set('genre', currentGenre);
    history.replaceState({}, '', '?' + qs.toString());
    currentPage = 1;
    doSearch(true);
  }, 400);
});

loadMoreBtn && loadMoreBtn.addEventListener('click', function() { doSearch(false); });

buildGenreRow();
doSearch(true);
