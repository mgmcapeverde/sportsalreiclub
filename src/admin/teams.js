import { html } from '../lib/html.js';
import { adminPage, htmlResponse, redirect } from './ui.js';
import { adminT } from './i18n.js';

function crest(t) {
  return t.logo ? html`<span class="plogo" style="background:#fff;width:64px"><img src="${t.logo}" alt=""></span>` : html`<span class="plogo" style="width:64px">${t.short}</span>`;
}

export async function teamsPage({ db, user, url }) {
  const T = adminT(user.lang).teams;
  const { results } = await db.prepare('SELECT * FROM teams ORDER BY is_us DESC, name').all();
  const body = html`<a class="crumb" href="/admin/partite">← ${adminT(user.lang).matches.title}</a>
<div class="head"><div><h1>${T.title}</h1><p>${T.intro}</p></div></div>
<div class="list">${results.map((t) => html`<a class="row" href="/admin/squadre/${t.id}">${crest(t)}
  <span class="grow"><span class="t">${t.name}</span><span class="s">${t.short} · ${t.logo ? T.withLogo : T.withoutLogo}</span></span></a>`)}</div>`;
  return htmlResponse(adminPage({ user, active: 'matches', title: T.title, body, url }));
}

export async function editTeam({ db, user, url, id }) {
  const T = adminT(user.lang).teams;
  const t = await db.prepare('SELECT * FROM teams WHERE id = ?').bind(id).first();
  if (!t) return redirect('/admin/squadre');
  const body = html`<a class="crumb" href="/admin/squadre">${T.all}</a>
<div class="head"><h1>${t.name}</h1></div>
<form class="panel" method="post" action="/admin/squadre/${t.id}">
  <div class="grid2">
    <div class="field"><label for="name">${T.name}</label><input id="name" name="name" type="text" required maxlength="40" value="${t.name}"></div>
    <div class="field"><label for="short">${T.short} <span class="hint">${T.shortHint}</span></label><input id="short" name="short" type="text" required maxlength="4" value="${t.short}"></div>
  </div>
  <label>${T.logo}</label>
  <div class="imgbox">
    <div class="preview" id="img-preview" style="width:160px;aspect-ratio:1;background-color:#fff;background-size:contain;background-origin:content-box;padding:14px;${t.logo ? `background-image:url('${t.logo}')` : ''}">${t.logo ? '' : T.noLogo}</div>
    <div>
      <input type="hidden" name="logo" id="image" value="${t.logo || ''}">
      <div class="actions">
        <label class="btn" for="img-file" style="margin:0">${T.upload}</label>
        <input class="sr" type="file" id="img-file" accept="image/png,image/svg+xml,image/webp,image/jpeg" data-kind="logo">
        ${t.logo ? html`<button class="btn ghost" type="button" id="img-remove">${T.remove}</button>` : ''}
      </div>
      <p class="hint mt" id="img-status">${T.logoHint}</p>
    </div>
  </div>
  <div class="bar"><button class="btn primary" type="submit">${T.save}</button></div>
</form>`;
  return htmlResponse(adminPage({ user, active: 'matches', title: t.name, body, url }));
}

export async function saveTeam({ db, id, form }) {
  const name = String(form.get('name') || '').trim().slice(0, 40);
  const short = String(form.get('short') || '').trim().toUpperCase().slice(0, 4);
  const logo = /^\/(media|assets)\//.test(form.get('logo') || '') ? form.get('logo') : null;
  if (!name || !short) return redirect(`/admin/squadre/${id}?msg=invalid`);
  await db.prepare('UPDATE teams SET name = ?, short = ?, logo = ? WHERE id = ?').bind(name, short, logo, id).run();
  return redirect(`/admin/squadre/${id}?msg=saved`);
}
