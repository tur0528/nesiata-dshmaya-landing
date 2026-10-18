(function(){
  'use strict';
  var PHONE = '972546354446';
  var DEFAULT_MSG = 'שלום, הגעתי מהאתר ואשמח לפרטים על ליווי בקניית רכב';

  /* WhatsApp links with a prefilled message */
  document.querySelectorAll('.js-wa').forEach(function(a){
    var msg = a.getAttribute('data-msg') || DEFAULT_MSG;
    a.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(msg);
  });

  /* Reveal on scroll, with stagger inside groups */
  window.__rvReady = true;
  var rv = document.querySelectorAll('.rv');
  rv.forEach(function(el){
    var sib = Array.prototype.filter.call(el.parentElement.children, function(c){ return c.classList.contains('rv'); });
    var i = sib.indexOf(el);
    if (sib.length > 1 && i > 0) el.style.setProperty('--rd', Math.min(i, 5) * 0.09 + 's');
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {rootMargin:'0px 0px -8% 0px', threshold:0.05});
    rv.forEach(function(el){ io.observe(el); });
  } else { rv.forEach(function(el){ el.classList.add('in'); }); }

  /* Header: shadow + shrink on scroll */
  var header = document.getElementById('siteHeader');
  var onScroll = function(){ header.classList.toggle('scrolled', window.scrollY > 12); };
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* Mobile menu */
  var burger = document.getElementById('burger'), mnav = document.getElementById('mnav');
  function setMenu(open){
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
    mnav.hidden = !open;
  }
  burger.addEventListener('click', function(){ setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  mnav.addEventListener('click', function(e){ if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !mnav.hidden){ setMenu(false); burger.focus(); } });
  document.addEventListener('click', function(e){ if (!mnav.hidden && !header.contains(e.target)) setMenu(false); });

  /* Active nav link */
  var navLinks = document.querySelectorAll('.nav a');
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        navLinks.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, {rootMargin:'-45% 0px -50% 0px'});
    ['service','leasing','form','faq'].forEach(function(id){ var el = document.getElementById(id); if (el) so.observe(el); });
  }

  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* Tabs (keyboard accessible) */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role=tab]'));
  function select(tab){
    tabs.forEach(function(t){
      var on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){ select(t); });
    t.addEventListener('keydown', function(e){
      var d = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0; // RTL
      if (!d) return;
      var n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus(); e.preventDefault();
    });
  });

  /* Helpers */
  function validPhone(v){ var d = (v || '').replace(/\D/g, ''); return /^(0\d{8,9}|972\d{8,9})$/.test(d); }
  function setInvalid(el, bad){ el.classList.toggle('invalid', bad); var i = el.querySelector('input,textarea'); if (i) i.setAttribute('aria-invalid', bad); }
  function esc(s){ var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function fmtMoney(v){ var n = (v || '').replace(/[^\d]/g, ''); return n ? Number(n).toLocaleString('he-IL') : ''; }

  var budget = document.getElementById('f-budget');
  budget.addEventListener('input', function(){ var p = budget.value; budget.value = fmtMoney(p); });

  /* ---- New customer form ---- */
  var nf = document.getElementById('newForm');
  nf.addEventListener('submit', function(e){
    e.preventDefault();
    var f = nf.elements, first = null, bad;
    function check(wrap, ok, focusEl){ setInvalid(wrap, !ok); if (!ok && !first) first = focusEl; }
    check(f.name.closest('.field'), f.name.value.trim().length > 1, f.name);
    check(f.phone.closest('.field'), validPhone(f.phone.value), f.phone);
    check(document.getElementById('fs-type'), !!nf.querySelector('[name=type]:checked'), nf.querySelector('[name=type]'));
    check(document.getElementById('fs-gear'), !!nf.querySelector('[name=gear]:checked'), nf.querySelector('[name=gear]'));
    check(f.budget.closest('.field'), f.budget.value.replace(/\D/g,'').length > 0, f.budget);
    if (first){ first.focus(); return; }

    var lead = {
      source: 'landing-page',
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      area: f.area.value.trim(),
      type: nf.querySelector('[name=type]:checked').value,
      gear: nf.querySelector('[name=gear]:checked').value,
      budget: f.budget.value.replace(/\D/g, ''),
      notes: f.notes.value.trim(),
      createdAt: new Date().toISOString()
    };

    /* ====== CRM HOOK ======
       In production, send the lead to the CRM here, e.g.:
       fetch('https://YOUR-CRM-ENDPOINT/leads', {
         method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(lead)
       }).then(showThanks).catch(showError);
       (Base44 / Make / n8n webhook URL goes in place of YOUR-CRM-ENDPOINT.)
       Demo only: nothing is sent. */
    window.__lastLead = lead;

    var rows = [['שם', lead.name], ['טלפון', lead.phone], ['מחפשים', lead.type], ['תיבת הילוכים', lead.gear], ['תקציב גג', Number(lead.budget).toLocaleString('he-IL') + ' ₪']];
    if (lead.area) rows.splice(2, 0, ['אזור', lead.area]);
    document.getElementById('newSummary').innerHTML = rows.map(function(r){
      return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
    }).join('');
    nf.hidden = true;
    var done = document.getElementById('newDone'); done.hidden = false; done.focus();
    done.scrollIntoView({behavior:'smooth', block:'center'});
  });

  /* ---- Existing customer ---- */
  var of = document.getElementById('oldForm');
  var msgWrap = document.getElementById('o-msg-wrap');
  var oldBtn = document.getElementById('oldBtn');
  of.querySelectorAll('[name=act]').forEach(function(r){
    r.addEventListener('change', function(){
      var upd = of.querySelector('[name=act]:checked').value === 'update';
      msgWrap.hidden = !upd; oldBtn.textContent = upd ? 'שליחת עדכון' : 'בדיקת סטטוס';
    });
  });
  of.addEventListener('submit', function(e){
    e.preventDefault();
    var ph = of.elements.phone, ok = validPhone(ph.value);
    setInvalid(ph.closest('.field'), !ok);
    if (!ok){ ph.focus(); return; }
    var act = of.querySelector('[name=act]:checked').value;
    /* ====== CRM HOOK ======
       status → GET  https://YOUR-CRM-ENDPOINT/status?phone=...
       update → POST https://YOUR-CRM-ENDPOINT/updates {phone, msg}
       Demo only: sample response below. */
    var out = document.getElementById('oldResult');
    if (act === 'status') {
      out.innerHTML =
        '<div class="status-card"><div class="sh"><b>סטטוס הפנייה שלך</b><small>תצוגה לדוגמה</small></div>' +
        '<ol class="track">' +
        '<li class="ok"><span class="dot"><svg class="i"><use href="#i-ok"/></svg></span><div><b>הפרטים התקבלו</b><span>השאלון נקלט במערכת</span></div></li>' +
        '<li class="now"><span class="dot"></span><div><b>חיפוש ואיתור רכבים</b><span>בודקים התאמות מול הסוכנויות</span></div></li>' +
        '<li class="todo"><span class="dot"></span><div><b>בדיקת רכב ומשא ומתן</b></div></li>' +
        '<li class="todo"><span class="dot"></span><div><b>סיום העסקה</b></div></li>' +
        '</ol></div><div style="text-align:center"><span class="demo-note">גרסת הדגמה · בגרסה החיה יוצג הסטטוס האמיתי</span></div>';
    } else {
      out.innerHTML = '<div class="done"><div class="tick"><svg class="i"><use href="#i-ok"/></svg></div><h3>העדכון התקבל</h3><p>אחזור אליכם בהקדם האפשרי.</p><span class="demo-note">גרסת הדגמה · העדכון לא נשלח בפועל</span></div>';
    }
    out.hidden = false; out.focus();
  });
})();
