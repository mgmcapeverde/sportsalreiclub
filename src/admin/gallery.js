// Match photo galleries: list, upload (already compressed in the browser), cover, delete.
import { html, raw } from '../lib/html.js';
import { adminPage, htmlResponse, redirect } from './ui.js';
import { adminT, adminDate } from './i18n.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const TYPES = { 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const keyOf = (u) => String(u || '').replace(/^\/media\//, '');

async function getMatch(db, id) {
  return db.prepare(`SELECT m.*, h.name AS home, a.name AS away, c.name_pt AS comp FROM matches m
    JOIN teams h ON h.id = m.home_id JOIN teams a ON a.id = m.away_id JOIN competitions c ON c.id = m.competition_id
    WHERE m.id = ?`).bind(id).first();
}

export async function photoCounts(db) {
  const { results } = await db.prepare('SELECT match_id, COUNT(*) AS n FROM match_photos GROUP BY match_id').all();
  return new Map(results.map((r) => [r.match_id, r.n]));
}

export async function galleryPage({ db, user, url, id }) {
  const L = adminT(user.lang), G = L.gallery;
  const m = await getMatch(db, id);
  if (!m) return redirect('/admin/partite');
  const { results: photos } = await db.prepare('SELECT * FROM match_photos WHERE match_id = ? ORDER BY sort, id').bind(id).all();
  const msg = url.searchParams.get('msg');
  const score = m.status === 'played' ? ` ${m.home_score}–${m.away_score} ` : ' – ';
  const body = html`<a class="crumb" href="/admin/partite?c=${m.competition_id}">← ${L.matches.title}</a>
<div class="head"><div><h1>${G.title}: ${m.home}${score}${m.away}</h1>
  <p>${m.comp} · ${adminDate(L, m.date, true)} · ${G.count(photos.length)}</p></div>
  ${photos.length ? html`<a class="btn" href="/gallery/${m.id}" target="_blank" rel="noopener">${G.view}</a>` : ''}</div>
${msg === 'deleted' ? html`<div class="flash ok">${G.deleted}</div>` : msg === 'cover' ? html`<div class="flash ok">${G.coverSet}</div>` : ''}
<section class="panel">
  <h2>${G.add}</h2>
  <p class="hint">${G.addHint}</p>
  <div class="actions mt">
    <label class="btn primary" for="gal-files" style="margin:0">${G.choose}</label>
    <input class="sr" type="file" id="gal-files" multiple accept="image/*" data-match="${m.id}">
  </div>
  <p class="hint mt" id="gal-status" aria-live="polite"></p>
  <ul class="gal-errors" id="gal-errors"></ul>
</section>
${photos.length ? html`<section class="panel mt"><h2>${G.photos}</h2>
  <div class="gal-grid">${photos.map((p, i) => html`<figure class="gal-item">
    <a href="${p.key}" target="_blank" rel="noopener"><img src="${p.thumb}" alt="" loading="lazy" width="${p.w}" height="${p.h}"></a>
    <figcaption>${i === 0 ? html`<span class="tag-cover">${G.cover}</span>` : html`<form method="post" action="/admin/partite/${m.id}/foto"><input type="hidden" name="pid" value="${p.id}"><button class="btn small ghost" name="action" value="cover">${G.makeCover}</button></form>`}
      <form method="post" action="/admin/partite/${m.id}/foto"><input type="hidden" name="pid" value="${p.id}"><button class="btn small danger" name="action" value="delete" data-confirm="${G.confirmDelete}">${G.delete}</button></form>
    </figcaption></figure>`)}</div>
</section>` : html`<p class="muted mt">${G.none}</p>`}`;
  return htmlResponse(adminPage({ user, active: 'matches', title: G.title, body, url }));
}

// Upload of one photo: the browser sends the large version and the thumbnail, both already resized.
export async function uploadPhoto({ db, env, request, id }) {
  if (!env.MEDIA) return json({ error: 'storage-missing' }, 500);
  if (!(await db.prepare('SELECT id FROM matches WHERE id = ?').bind(id).first())) return json({ error: 'no-match' }, 404);
  const form = await request.formData().catch(() => new FormData());
  const file = form.get('file'), thumb = form.get('thumb');
  const ok = (f, max) => f && typeof f !== 'string' && TYPES[f.type] && f.size > 0 && f.size <= max;
  if (!ok(file, 6 * 1024 * 1024) || !ok(thumb, 1024 * 1024)) return json({ error: 'bad-file' }, 400);
  const w = Math.min(10000, Math.max(1, Number(form.get('w')) || 0)), h = Math.min(10000, Math.max(1, Number(form.get('h')) || 0));
  const d = new Date();
  const base = `gallery/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID().slice(0, 12)}`;
  const big = `${base}.${TYPES[file.type]}`, small = `${base}-t.${TYPES[thumb.type]}`;
  const meta = (f) => ({ httpMetadata: { contentType: f.type, cacheControl: 'public, max-age=31536000, immutable' } });
  await env.MEDIA.put(big, file.stream(), meta(file));
  await env.MEDIA.put(small, thumb.stream(), meta(thumb));
  const next = await db.prepare('SELECT COALESCE(MAX(sort), 0) + 1 AS s FROM match_photos WHERE match_id = ?').bind(id).first();
  await db.batch([
    db.prepare('INSERT INTO match_photos (match_id, key, thumb, w, h, size, sort) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, `/media/${big}`, `/media/${small}`, w, h, file.size, next.s),
    db.prepare('INSERT INTO media (key, type, size) VALUES (?, ?, ?)').bind(big, file.type, file.size),
    db.prepare('INSERT INTO media (key, type, size) VALUES (?, ?, ?)').bind(small, thumb.type, thumb.size),
  ]);
  return json({ ok: true });
}

export async function deletePhotos(db, env, photos) {
  if (!photos.length) return;
  const keys = photos.flatMap((p) => [keyOf(p.key), keyOf(p.thumb)]);
  if (env.MEDIA) await env.MEDIA.delete(keys);
  await db.batch([
    ...photos.map((p) => db.prepare('DELETE FROM match_photos WHERE id = ?').bind(p.id)),
    ...keys.map((k) => db.prepare('DELETE FROM media WHERE key = ?').bind(k)),
  ]);
}

export async function saveGallery({ db, env, id, form }) {
  const pid = Number(form.get('pid'));
  const p = await db.prepare('SELECT * FROM match_photos WHERE id = ? AND match_id = ?').bind(pid, id).first();
  if (!p) return redirect(`/admin/partite/${id}/foto`);
  if (form.get('action') === 'delete') {
    await deletePhotos(db, env, [p]);
    return redirect(`/admin/partite/${id}/foto?msg=deleted`);
  }
  if (form.get('action') === 'cover') {
    await db.prepare('UPDATE match_photos SET sort = (SELECT MIN(sort) - 1 FROM match_photos WHERE match_id = ?) WHERE id = ?').bind(id, pid).run();
    return redirect(`/admin/partite/${id}/foto?msg=cover`);
  }
  return redirect(`/admin/partite/${id}/foto`);
}

export const photoLink = (G, m, n) => html`<a class="ph-link${n ? ' has' : ''}" href="/admin/partite/${m.id}/foto" title="${G.title}">${raw('&#128247;')} ${n || '+'}</a>`;
