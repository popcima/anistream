/* Watch page — Miruro-style layout */
var params   = new URLSearchParams(location.search);
var watchId  = params.get('id');
var main     = document.getElementById('mainContent');
var watchEp  = parseInt(params.get('ep'))  || 1;
var watchLang= params.get('lang') || 'sub';
var watchData= null;

function escH(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

if (!watchId) {
  main.innerHTML = '<div class="error-wrap" style="padding-top:120px"><h3>No anime selected</h3><a href="index.html" class="btn btn-primary" style="margin-top:14px">Go Home</a></div>';
}

function updateUrl() {
  history.replaceState({}, '', 'watch.html?id='+watchId+'&ep='+watchEp+'&lang='+watchLang);
}

function fmtDate(d) {
  if (!d || !d.year) return '—';
  var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return M[(d.month||1)-1] + ' ' + (d.day ? String(d.day).padStart(2,'0')+', ' : '') + d.year;
}

/* ── Episode list helpers ── */
function buildEpCard(n, total, active, poster) {
  return (
    '<div class="wep-card'+(active?' active':'')+'" id="sep-'+n+'" data-ep="'+n+'">' +
      '<div class="wep-thumb">' +
        '<img src="'+escH(poster)+'" alt="Ep '+n+'" loading="lazy"/>' +
        '<span class="wep-badge">EP '+n+'</span>' +
      '</div>' +
      '<div class="wep-body">' +
        '<div class="wep-title">Episode '+n+'</div>' +
        (total ? '<div class="wep-meta"><i class="fa-solid fa-film"></i> '+n+' / '+total+'</div>' : '') +
      '</div>' +
    '</div>'
  );
}

function buildRangeBtns(total, chunkSize) {
  var html = '';
  chunkSize = chunkSize || 20;
  for (var s = 1; s <= total; s += chunkSize) {
    var e   = Math.min(s + chunkSize - 1, total);
    var cur = watchEp >= s && watchEp <= e;
    html += '<button class="wep-range'+(cur?' active':'')+'" data-start="'+s+'" data-end="'+e+'">'+s+'–'+e+'</button>';
  }
  return html;
}

function buildEpListHtml(total, poster, start, end) {
  var count = total || 50;
  start = start || 1;
  end   = end   || count;
  var html = '';
  for (var i = start; i <= end; i++) {
    html += buildEpCard(i, total, i === watchEp, poster);
  }
  return html;
}

/* ── Main render ── */
function renderWatch(media) {
  var title   = getTitle(media);
  document.title = 'Ep '+watchEp+' — '+title+' — AniStream';

  var poster  = media.coverImage.extraLarge || media.coverImage.large;
  var total   = media.episodes || (media.nextAiringEpisode ? media.nextAiringEpisode.episode-1 : null);
  var score   = formatScore(media.averageScore);
  var status  = formatStatus(media.status);
  var format  = (media.format||'TV').replace(/_/g,' ');
  var studio  = media.studios&&media.studios.nodes[0] ? media.studios.nodes[0].name : '—';
  var genres  = (media.genres||[]).slice(0,3);
  var desc    = (media.description||'').replace(/<[^>]*>/g,'');
  var startD  = fmtDate(media.startDate);
  var endD    = fmtDate(media.endDate);
  var season  = media.season ? media.season[0]+media.season.slice(1).toLowerCase()+(media.seasonYear?' '+media.seasonYear:'') : '—';
  var useRange= total && total > 20;
  var chunk   = 20;
  var rStart  = useRange ? Math.floor((watchEp-1)/chunk)*chunk+1 : 1;
  var rEnd    = useRange ? Math.min(rStart+chunk-1, total) : (total||50);

  main.innerHTML =
  '<div class="wp-wrap">'+

    /* ── LEFT: main column ── */
    '<div class="wp-main">'+

      /* title bar */
      '<div class="wp-bar">'+
        '<div class="wp-bar-left">'+
          '<span class="wp-ep-num">Ep '+watchEp+'</span>'+
          '<span class="wp-ep-name">'+escH(title)+'</span>'+
        '</div>'+
        '<div class="wp-bar-right">'+
          '<div class="wp-lang-seg">'+
            '<button class="wp-lbtn'+(watchLang==='sub'?' on':'')+'" id="subBtn">SUB</button>'+
            '<button class="wp-lbtn'+(watchLang==='dub'?' on':'')+'" id="dubBtn">DUB</button>'+
          '</div>'+
        '</div>'+
      '</div>'+

      /* player */
      '<div class="wp-player">'+
        '<iframe id="playerIframe" src="'+escH(getStreamUrl(watchId,watchEp,watchLang))+'" allowfullscreen scrolling="no" allow="autoplay; fullscreen"></iframe>'+
      '</div>'+

      /* info row */
      '<div class="wp-info">'+
        '<div class="wp-pills">'+
          '<span class="wp-pill"><i class="fa-solid fa-calendar-days"></i> '+startD+'</span>'+
          (total?'<span class="wp-pill"><i class="fa-solid fa-tv"></i> '+total+' eps</span>':'')+
          (score!=='N/A'?'<span class="wp-pill"><i class="fa-solid fa-star" style="color:#fbbf24"></i> '+score+'</span>':'')+
        '</div>'+
        '<div class="wp-acts">'+
          (watchEp>1?'<button class="wp-act" id="prevEpBtn"><i class="fa-solid fa-backward-step"></i> Prev</button>':'')+
          (total===null||watchEp<total?'<button class="wp-act" id="nextEpBtn">Next <i class="fa-solid fa-forward-step"></i></button>':'')+
          '<a class="wp-act" href="anime.html?id='+watchId+'"><i class="fa-solid fa-circle-info"></i> Details</a>'+
        '</div>'+
      '</div>'+

      /* description */
      (desc?'<div class="wp-desc">'+escH(desc.slice(0,320))+(desc.length>320?'…':'')+'</div>':'')+

      /* anime info card */
      '<div class="wp-card">'+
        '<img class="wp-poster" src="'+escH(poster)+'" alt="'+escH(title)+'" onclick="location.href=\'anime.html?id='+watchId+'\'">'+
        '<div class="wp-card-info">'+
          '<div class="wp-card-title" onclick="location.href=\'anime.html?id='+watchId+'\'">'+escH(title)+'</div>'+
          (media.title&&media.title.native?'<div class="wp-card-native">'+escH(media.title.native)+'</div>':'')+
          (genres.length?'<div class="wp-card-genres">'+genres.map(function(g){return'<span class="wp-genre">'+escH(g)+'</span>';}).join('')+'</div>':'')+
          (desc?'<div class="wp-card-desc">'+escH(desc.slice(0,260))+(desc.length>260?'…':'')+'</div>':'')+
          '<div class="wp-dg">'+
            '<div class="wp-dr"><span>Format</span><strong>'+format+'</strong></div>'+
            '<div class="wp-dr"><span>Start Date</span><strong>'+startD+'</strong></div>'+
            '<div class="wp-dr"><span>Status</span><strong>'+status+'</strong></div>'+
            '<div class="wp-dr"><span>End Date</span><strong>'+endD+'</strong></div>'+
            (total?'<div class="wp-dr"><span>Episodes</span><strong>'+(media.nextAiringEpisode?(media.nextAiringEpisode.episode-1)+'/'+total:total)+'</strong></div>':'')+
            '<div class="wp-dr"><span>Adult</span><strong>'+(media.isAdult?'Yes':'No')+'</strong></div>'+
            (score!=='N/A'?'<div class="wp-dr"><span>Score</span><strong>'+score+' / 100</strong></div>':'')+
            '<div class="wp-dr"><span>Studio</span><strong>'+escH(studio)+'</strong></div>'+
            (media.duration?'<div class="wp-dr"><span>Duration</span><strong>'+media.duration+' min</strong></div>':'')+
            (media.season?'<div class="wp-dr"><span>Season</span><strong>'+escH(season)+'</strong></div>':'')+
          '</div>'+
        '</div>'+
      '</div>'+

    '</div>'+/* /wp-main */

    /* ── RIGHT: episode sidebar ── */
    '<div class="wp-sidebar">'+
      '<div class="wp-sb-hd">'+
        '<span class="wp-sb-label"><i class="fa-solid fa-list"></i> Episodes</span>'+
        (total?'<span class="wp-sb-count">'+total+'</span>':'')+
      '</div>'+
      (useRange?'<div class="wp-ranges" id="rangeBar">'+buildRangeBtns(total,chunk)+'</div>':'')+
      '<div class="wp-filter-wrap">'+
        '<i class="fa-solid fa-magnifying-glass wp-fi"></i>'+
        '<input class="wp-filter" id="epFilter" placeholder="Filter episodes…" autocomplete="off">'+
      '</div>'+
      '<div class="wp-eplist" id="epList">'+
        buildEpListHtml(total, poster, rStart, rEnd)+
      '</div>'+
    '</div>'+

  '</div>';/* /wp-wrap */

  attachEvents(total, poster, chunk);
  scrollToEp();
}

/* ── Event wiring ── */
function attachEvents(total, poster, chunk) {
  /* lang */
  var s = document.getElementById('subBtn');
  var d = document.getElementById('dubBtn');
  if (s) s.addEventListener('click', function(){ watchLang='sub'; reloadPlayer(total); });
  if (d) d.addEventListener('click', function(){ watchLang='dub'; reloadPlayer(total); });

  /* prev/next */
  var p = document.getElementById('prevEpBtn');
  var n = document.getElementById('nextEpBtn');
  if (p) p.addEventListener('click', function(){ if(watchEp>1){watchEp--;reloadPlayer(total);} });
  if (n) n.addEventListener('click', function(){ if(!total||watchEp<total){watchEp++;reloadPlayer(total);} });

  /* episode cards */
  var list = document.getElementById('epList');
  if (list) list.addEventListener('click', function(e) {
    var card = e.target.closest('.wep-card');
    if (card) { watchEp=parseInt(card.dataset.ep); reloadPlayer(total); }
  });

  /* range buttons */
  var rb = document.getElementById('rangeBar');
  if (rb) rb.addEventListener('click', function(e) {
    var btn = e.target.closest('.wep-range');
    if (!btn) return;
    rb.querySelectorAll('.wep-range').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    var s2 = parseInt(btn.dataset.start);
    var e2 = parseInt(btn.dataset.end);
    var epList = document.getElementById('epList');
    if (epList) epList.innerHTML = buildEpListHtml(total, poster, s2, e2);
    reattachEpList(total, poster);
    scrollToEp();
  });

  /* filter */
  var flt = document.getElementById('epFilter');
  if (flt) flt.addEventListener('input', function() {
    var val = flt.value.toLowerCase();
    document.querySelectorAll('.wep-card').forEach(function(card) {
      var n2 = card.dataset.ep;
      card.style.display = (val===''||('episode '+n2).includes(val)||n2.includes(val)) ? '' : 'none';
    });
  });
}

function reattachEpList(total, poster) {
  var list = document.getElementById('epList');
  if (list) list.addEventListener('click', function(e) {
    var card = e.target.closest('.wep-card');
    if (card) { watchEp=parseInt(card.dataset.ep); reloadPlayer(total); }
  });
}

/* ── Reload after ep/lang change ── */
function reloadPlayer(total) {
  var iframe = document.getElementById('playerIframe');
  if (iframe) iframe.src = getStreamUrl(watchId, watchEp, watchLang);

  document.title = 'Ep '+watchEp+' — '+getTitle(watchData)+' — AniStream';

  var epNum = document.querySelector('.wp-ep-num');
  if (epNum) epNum.textContent = 'Ep '+watchEp;

  document.querySelectorAll('.wp-lbtn').forEach(function(b){
    b.classList.toggle('on', b.id===(watchLang+'Btn'));
  });
  document.querySelectorAll('.wep-card').forEach(function(el){
    el.classList.toggle('active', parseInt(el.dataset.ep)===watchEp);
  });

  /* rebuild prev/next */
  var acts = document.querySelector('.wp-acts');
  if (acts) {
    acts.innerHTML =
      (watchEp>1?'<button class="wp-act" id="prevEpBtn"><i class="fa-solid fa-backward-step"></i> Prev</button>':'')+
      (total===null||watchEp<total?'<button class="wp-act" id="nextEpBtn">Next <i class="fa-solid fa-forward-step"></i></button>':'')+
      '<a class="wp-act" href="anime.html?id='+watchId+'"><i class="fa-solid fa-circle-info"></i> Details</a>';
    var p = document.getElementById('prevEpBtn');
    var n = document.getElementById('nextEpBtn');
    if (p) p.addEventListener('click', function(){ if(watchEp>1){watchEp--;reloadPlayer(total);} });
    if (n) n.addEventListener('click', function(){ if(!total||watchEp<total){watchEp++;reloadPlayer(total);} });
  }

  scrollToEp();
  updateUrl();
}

function scrollToEp() {
  var el = document.getElementById('sep-'+watchEp);
  if (el) el.scrollIntoView({ block:'center', behavior:'smooth' });
}

/* ── Keyboard nav ── */
document.addEventListener('keydown', function(e) {
  if (!watchData) return;
  var total = watchData.episodes;
  if (e.key==='ArrowRight'&&(!total||watchEp<total)){ watchEp++; reloadPlayer(total); }
  if (e.key==='ArrowLeft'&&watchEp>1){ watchEp--; reloadPlayer(total); }
});

/* ── Boot ── */
if (watchId) {
  getAnimeById(watchId).then(function(media) {
    watchData = media;
    renderWatch(media);
  }).catch(function(err) {
    main.innerHTML = '<div class="error-wrap" style="padding-top:120px"><h3>Failed to load</h3><p>'+err.message+'</p><a class="btn btn-primary" href="index.html" style="margin-top:14px">Go Home</a></div>';
  });
}
