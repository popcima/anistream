/* Shared nav drawer — injected into every page */
(function () {
  var GENRE_LIST = typeof GENRES !== 'undefined' ? GENRES : [
    'Action','Adventure','Comedy','Drama','Fantasy',
    'Horror','Mecha','Music','Mystery','Psychological',
    'Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller',
  ];

  var drawerHtml =
    '<div class="nav-drawer-overlay" id="navOverlay"></div>' +
    '<aside class="nav-drawer" id="navDrawer" aria-label="Navigation menu">' +
      '<div class="nav-drawer-header">' +
        '<span class="nav-drawer-brand">HEBiANiME</span>' +
        '<button class="nav-drawer-close" id="navDrawerClose" type="button" aria-label="Close menu">' +
          '<i class="fa-solid fa-xmark"></i>' +
        '</button>' +
      '</div>' +
      '<nav class="nav-drawer-links">' +
        '<a href="index.html"><i class="fa-solid fa-house"></i>Home</a>' +
        '<a href="search.html"><i class="fa-solid fa-border-all"></i>Browse All</a>' +
        '<a href="search.html?sort=TRENDING_DESC"><i class="fa-solid fa-fire"></i>Trending</a>' +
        '<a href="search.html?status=RELEASING"><i class="fa-solid fa-circle-play"></i>Now Airing</a>' +
        '<a href="search.html?format=MOVIE"><i class="fa-solid fa-film"></i>Movies</a>' +
        '<a href="search.html?status=FINISHED"><i class="fa-solid fa-flag-checkered"></i>Finished</a>' +
      '</nav>' +
      '<div class="nav-drawer-divider"></div>' +
      '<p class="nav-drawer-section-title">Genres</p>' +
      '<div class="nav-drawer-genres">' +
        GENRE_LIST.map(function (g) {
          return '<a href="search.html?genre=' + encodeURIComponent(g) + '">' + g + '</a>';
        }).join('') +
      '</div>' +
    '</aside>';

  document.body.insertAdjacentHTML('beforeend', drawerHtml);

  var drawer  = document.getElementById('navDrawer');
  var overlay = document.getElementById('navOverlay');
  var menuBtn = document.querySelector('.watch-menu-btn');
  var closeBtn = document.getElementById('navDrawerClose');

  /* highlight active page link */
  var path = location.pathname.split('/').pop() || 'index.html';
  drawer.querySelectorAll('.nav-drawer-links a').forEach(function (a) {
    if (a.getAttribute('href').split('?')[0] === path) a.classList.add('active');
  });

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  menuBtn  && menuBtn.addEventListener('click', openDrawer);
  closeBtn && closeBtn.addEventListener('click', closeDrawer);
  overlay  && overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });
}());
