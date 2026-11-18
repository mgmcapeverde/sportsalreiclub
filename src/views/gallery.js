// Public photo galleries: list of match albums, and one album with a lightbox.
import { html } from '../lib/html.js';
import { url, longDate } from '../lib/i18n.js';
import { page } from './layout.js';
import { teamName, compName } from './parts.js';

const score = (t, m) => (m.status === 'played' ? `${m.home_score} - ${m.away_score}` : t.match.vs);
const count = (g, n) => (n === 1 ? g.one : g.many(n));

export function galleryPage({ t, teams, albums, partners }) {
  const g = t.gallery;
  const body = html`
<section class="gal-hero"><div class="wrap">
  <span class="kicker">${g.kicker}</span>
  <h1>${g.title}</h1>
  <p>${g.sub}</p>
</div></section>
<section class="section gal-sec"><div class="wrap">
  ${albums.length ? html`<div class="albums">${albums.map((a) => html`<a class="album" href="${url(t.lang, `/gallery/${a.id}`)}">
    <span class="ph"><img src="${a.cover}" alt="" loading="lazy"></span>
    <span class="meta"><span class="c">${compName(t, a)} · ${longDate(t, a.date)}</span>
      <span class="m">${teamName(teams, a.home_id)} <b>${score(t, a)}</b> ${teamName(teams, a.away_id)}</span>
      <span class="n">${count(g, a.photos)}</span></span>
  </a>`)}</div>` : html`<p class="gal-empty">${g.empty}</p>`}
</div></section>`;
  return page({ t, title: g.title, css: ['site', 'sponsor', 'gallery'], active: 'gallery', path: '/gallery', body, partners, description: g.sub });
}

export function albumPage({ t, teams, album, partners }) {
  const g = t.gallery, m = album.match;
  const title = `${teamName(teams, m.home_id)} ${score(t, m)} ${teamName(teams, m.away_id)}`;
  const body = html`
<section class="gal-hero"><div class="wrap">
  <a class="back" href="${url(t.lang, '/gallery')}"><i class="ti ti-arrow-left"></i>${g.all}</a>
  <span class="kicker">${compName(t, m)} · ${longDate(t, m.date)}</span>
  <h1>${title}</h1>
  <p>${count(g, album.photos.length)}${m.venue ? ` · ${m.venue}` : ''}</p>
</div></section>
<section class="section gal-sec"><div class="wrap">
  <div class="photos" id="photos">${album.photos.map((p, i) => html`<a href="${p.key}" data-w="${p.w}" data-h="${p.h}" aria-label="${g.photo} ${i + 1}">
    <img src="${p.thumb}" alt="${title} — ${g.photo} ${i + 1}" loading="${i < 8 ? 'eager' : 'lazy'}" width="${p.w}" height="${p.h}"></a>`)}</div>
</div></section>
<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="${title}">
  <img alt="">
  <button class="lb-x" type="button" aria-label="${g.close}">×</button>
  <button class="lb-p" type="button" aria-label="${g.prev}"><i class="ti ti-arrow-left"></i></button>
  <button class="lb-n" type="button" aria-label="${g.next}"><i class="ti ti-arrow-right"></i></button>
  <span class="lb-c"></span>
</div>`;
  return page({ t, title, css: ['site', 'sponsor', 'gallery'], active: 'gallery', path: `/gallery/${m.id}`, body, partners, description: `${g.title}: ${title}` });
}
