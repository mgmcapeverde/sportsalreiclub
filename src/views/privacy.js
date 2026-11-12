import { html } from '../lib/html.js';
import { page } from './layout.js';

// Privacy & cookies page. Texts live in i18n-*.js (t.privacy).
export function privacyPage({ t, partners }) {
  const p = t.privacy;
  const body = html`
<section class="art-hero"><div class="bg"><div class="gfx"><img src="/assets/img/crest-large.png" alt="" style="width:min(320px,60%);height:auto;opacity:.18"></div></div><div class="veil"></div>
<div class="wrap"><div class="inner"><span class="tag">${p.tag}</span><h1>${p.title}</h1><div class="sub-meta"><span>${p.updated}</span></div></div></div></section>
<section class="section"><div class="wrap"><div class="article">
  <p class="lead">${p.lead}</p>
  ${p.sections.map(([h, paras]) => html`<h2>${h}</h2>${paras.map((x) => html`<p>${x}</p>`)}`)}
</div></div></section>`;
  return page({ t, title: p.title, css: ['site', 'article', 'sponsor'], path: '/privacy', body, partners, description: p.lead });
}
