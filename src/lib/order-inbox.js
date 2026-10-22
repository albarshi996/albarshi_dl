// صندوق الطلبات للإدارة: جرس في الشريط العلوي فيه كل الطلبات المفتوحة (من «استلمنا طلبك» لين «في الطريق»)،
// مع تتبّع شن انبعت لكل طلب: للقروب، للزبون (لحالته الحالية)، وللمندوب — وكل شي ينسجّل في سجل الطلب نفسه.
// تنبيه فوري (صوت وبطاقة) أول ما يوصل طلب جديد، وإرسال عدة طلبات للقروب في رسالة وحدة.
// مصمم ما يكسرش اللوحة: أي فشل هنا يتسجّل في الكونسول بس، وRealtime لو تعطّل فيه تحديث دوري احتياطي.
import * as wa from './wa-templates.js';

const OPEN = ['received', 'searching', 'quoted', 'purchasing', 'shipping'];
const SELECT = 'id,code,status,delegate_id,customer_name,customer_phone,city,category,details,quantity,urgency,car_model,part_condition,part_description,quoted_price,service_fee,total,cancel_reason,created_at,delegate:profiles!orders_delegate_id_fkey(full_name,phone)';
const PREFIX = { customer: '📤 واتساب للزبون', group: '📤 واتساب لقروب المندوبين', delegate: '📤 واتساب للمندوب' };
const POLL_MS = 90_000;

/**
 * يسجّل إرسال رسالة واتساب في سجل الطلب كملاحظة داخلية (ما تظهرش للزبون)، بحالة الطلب وقت الإرسال.
 * للإدارة فقط — حارس الأحداث يجبر ملاحظات المندوب تكون ظاهرة للزبون، فما نسجّلوش من بوابة المندوب.
 */
export async function logWaSend(sb, profile, order, note) {
  if (!sb || !profile || profile.role !== 'admin' || !order) return;
  const { error } = await sb.from('order_events').insert({
    order_id: order.id, kind: 'note', status: order.status, note: String(note).slice(0, 300),
    visible_to_customer: false, actor_id: profile.id,
  });
  if (error) console.warn('logWaSend:', error.message);
}

export const waNotes = {
  customer: label => `${PREFIX.customer}: «${label}»`,
  group: extra => PREFIX.group + (extra ? ` (${extra})` : ''),
  delegate: name => `${PREFIX.delegate} ${name || ''}`.trim(),
};

const firstName = s => String(s || '').trim().split(/\s+/)[0] || '';
const RELEASE_PREFIX = 'المندوب رجّع الطلب';

/** أسباب الإلغاء الجاهزة للإدارة (والنص الحر متاح دايماً). */
export const CANCEL_REASONS = [
  'المطلوب مش متوفر في ليبيا حالياً',
  'الزبون ألغى الطلب',
  'الزبون ما ردّش علينا',
  'الزبون رفض عرض السعر',
  'طلب مكرر',
  'خارج نطاق خدمتنا',
];

/**
 * إلغاء سريع للإدارة: سبب جاهز أو مكتوب → الحالة «ملغي» (السبب يظهر للزبون في التتبع)،
 * وبعدها رسالة «ملغي» جاهزة للزبون على واتساب (تتعدّل قبل الإرسال، والإرسال ينسجّل في سجل الطلب).
 * يُرجع الطلب بعد الإلغاء، أو null لو تراجع المدير.
 */
export async function quickCancel({ db, ui, sb, profile }, o) {
  const reason = await ui.reasonPrompt({
    title: `إلغاء الطلب ${o.code}`,
    intro: 'الزبون يشوف «ملغي» مع السبب في صفحة التتبع، وبعدها نجهّزولك رسالة الإلغاء له على واتساب.',
    reasons: CANCEL_REASONS, okText: 'إلغاء الطلب', danger: true,
  });
  if (!reason) return null;
  const res = await db.setOrderStatus(o.id, 'cancelled', { cancel_reason: reason });
  const row = Array.isArray(res) ? res[0] : res;
  const done = { ...o, ...(row || {}), status: 'cancelled', cancel_reason: reason };
  const T = ((await wa.loadTemplates(sb).catch(() => null)) || {}).bodies || wa.DEFAULTS;
  const label = (wa.TEMPLATES.find(t => t.key === 'customer_cancelled') || {}).label || 'ملغي';
  const m = ui.modal({
    title: `تم إلغاء الطلب ${o.code} ✓`,
    body: `<p class="confirm-text">بلّغ الزبون بالرسالة الجاهزة (تقدر تعدّلها قبل الإرسال):</p>
      <textarea rows="6" dir="auto" aria-label="رسالة الإلغاء">${db.esc(wa.fill(T.customer_cancelled, wa.orderVars(done)))}</textarea>`,
    footer: `<button type="button" class="btn btn-ghost" data-close>بعدين</button>
      <a class="btn btn-wa" data-send target="_blank" rel="noopener" href="#"><i class="fab fa-whatsapp"></i> ابعت للزبون</a>`,
  });
  const ta = m.querySelector('textarea');
  const send = m.querySelector('[data-send]');
  const sync = () => { send.href = wa.waUrl(done.customer_phone, ta.value.trim()); };
  ta.addEventListener('input', sync);
  sync();
  send.addEventListener('click', () => { logWaSend(sb, profile, done, waNotes.customer(label)); setTimeout(m.close, 300); });
  return done;
}

export function startInbox({ db, ui, sb, profile }) {
  if (!sb || !profile || profile.role !== 'admin') return;
  const esc = db.esc;
  const btn = document.getElementById('inboxBtn');
  const countEl = btn && btn.querySelector('.inbox-count');
  const pop = document.getElementById('inboxPop');
  if (!btn || !pop) return;
  btn.hidden = false;

  const baseTitle = document.title;
  let orders = [];
  let sends = new Map();          // order_id → { group: [iso], customer: Set(status), delegate: [iso] }
  let known = null;               // معرّفات معروفة — null قبل أول تحميل (ما ننبّهوش على القديم)
  let tpls = null;
  let modal = null;
  let filter = 'todo';
  let reloadTimer = null;
  let seenReleases = null;        // أحداث إرجاع شفناها — null قبل أول تحميل (ما ننبّهوش على القديم)

  btn.addEventListener('click', openInbox);
  load();
  setInterval(load, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });

  try {
    sb.channel('admin-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, scheduleLoad)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, scheduleLoad)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_events' }, scheduleLoad)
      .subscribe();
  } catch (e) { console.warn('inbox realtime:', e); }

  function scheduleLoad() {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(load, 700);
  }

  async function load() {
    try {
      if (!tpls) tpls = await wa.loadTemplates(sb).catch(() => null);
      const { data, error } = await sb.from('orders').select(SELECT)
        .in('status', OPEN).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      const list = data || [];
      const ids = list.map(o => o.id);
      const map = new Map(ids.map(id => [id, { group: [], customer: new Set(), delegate: [], lastAssign: null, lastUnassign: null, release: null }]));
      const newReleases = [];
      if (ids.length) {
        const [ev, asg] = await Promise.all([
          sb.from('order_events').select('order_id,status,note,created_at')
            .in('order_id', ids).eq('kind', 'note').eq('visible_to_customer', false).like('note', '📤 واتساب%')
            .order('created_at', { ascending: true }),
          sb.from('order_events').select('id,order_id,kind,note,created_at')
            .in('order_id', ids).in('kind', ['assign', 'unassign']).order('created_at', { ascending: true }),
        ]);
        // تعيين/إرجاع: إرسال القروب قبل آخر إرجاع ما يتحسبش (الطلب رجع متاح ويحتاج يتبعت من جديد)،
        // وإرسال المندوب قبل آخر تعيين ما يتحسبش (مندوب جديد ما وصلته التفاصيل)
        const releaseIds = [];
        for (const e of (asg.error ? [] : asg.data || [])) {
          const s = map.get(e.order_id);
          if (!s) continue;
          if (e.kind === 'assign') { s.lastAssign = e.created_at; s.release = null; continue; }
          s.lastUnassign = e.created_at;
          const isRelease = String(e.note || '').startsWith(RELEASE_PREFIX);
          s.release = isRelease ? String(e.note).slice(RELEASE_PREFIX.length).replace(/^\s*:\s*/, '') : null;
          if (isRelease) {
            releaseIds.push(e.id);
            if (seenReleases && !seenReleases.has(e.id)) newReleases.push(e.order_id);
          }
        }
        seenReleases = new Set([...(seenReleases || []), ...releaseIds]);
        for (const e of (ev.error ? [] : ev.data || [])) {
          const s = map.get(e.order_id);
          if (!s) continue;
          if (e.note.startsWith(PREFIX.group)) { if (!s.lastUnassign || e.created_at > s.lastUnassign) s.group.push(e.created_at); }
          else if (e.note.startsWith(PREFIX.customer)) s.customer.add(e.status);
          else if (e.note.startsWith(PREFIX.delegate)) { if (!s.lastAssign || e.created_at > s.lastAssign) s.delegate.push(e.created_at); }
        }
      }
      if (!seenReleases) seenReleases = new Set();
      // تنبيه فقط على الطلبات الجديدة فعلاً (مش طلب رجع مفتوح بعد إلغاء)
      const recent = o => o.status === 'received' && Date.now() - new Date(o.created_at).getTime() < 6 * 3600e3;
      const fresh = known ? list.filter(o => !known.has(o.id) && recent(o)) : [];
      known = new Set([...(known || []), ...ids]);
      orders = list;
      sends = map;
      paint();
      if (fresh.length) {
        beep();
        fresh.slice(0, 3).reverse().forEach(o => showPop(o));
        notifyBrowser(fresh[0], fresh.length);
        window.dispatchEvent(new CustomEvent('dawerli:new-order', { detail: { ids: fresh.map(o => o.id) } }));
      }
      const released = [...new Set(newReleases)].map(id => list.find(o => o.id === id)).filter(o => o && !o.delegate_id);
      if (released.length) {
        beep();
        released.slice(0, 3).forEach(o => showPop(o, '<i class="fas fa-rotate-left"></i> مندوب رجّع طلب — يحتاج مندوب ثاني'));
        window.dispatchEvent(new CustomEvent('dawerli:new-order', { detail: { ids: released.map(o => o.id) } }));
      }
    } catch (e) {
      console.warn('inbox:', e && e.message ? e.message : e);
    }
  }

  // ── شن ناقص كل طلب؟ ──
  const S = o => sends.get(o.id) || { group: [], customer: new Set(), delegate: [], lastAssign: null, lastUnassign: null, release: null };
  const needsGroup = o => !o.delegate_id && ['received', 'searching'].includes(o.status) && !S(o).group.length;
  const needsReply = o => !S(o).customer.has(o.status);
  const needsDelegate = o => !!(o.delegate_id && o.delegate && o.delegate.phone) && !S(o).delegate.length;
  const needsAny = o => needsGroup(o) || needsReply(o) || needsDelegate(o);
  const FILTERS = [
    { key: 'todo',     label: 'تحتاج إرسال', match: needsAny },
    { key: 'group',    label: 'للقروب',      match: needsGroup },
    { key: 'customer', label: 'رد للزبون',   match: needsReply },
    { key: 'all',      label: 'كل المفتوحة', match: () => true },
  ];

  function paint() {
    const n = orders.filter(needsAny).length;
    countEl.textContent = n > 99 ? '99+' : String(n);
    countEl.hidden = !n;
    btn.classList.toggle('has-new', n > 0);
    btn.title = n ? `${n} طلب يحتاج إرسال` : 'صندوق الطلبات';
    document.title = (n ? `(${n}) ` : '') + baseTitle;
    if (modal && modal.isConnected) modal.querySelector('.modal-body').innerHTML = listHtml();
  }

  // ── الرسائل والروابط ──
  const bodies = () => (tpls && tpls.bodies) || wa.DEFAULTS;
  const statusTpl = o => wa.TEMPLATES.find(t => t.key === wa.statusKey(o.status)) || { label: db.STATUS_LABELS[o.status] || o.status };
  const replyUrl = o => wa.waUrl(o.customer_phone, wa.fill(bodies()[wa.statusKey(o.status)], wa.orderVars(o)));
  const groupUrl = o => wa.waUrl('', wa.fill(bodies().delegates_group, wa.orderVars(o)));
  const delegateUrl = o => wa.waUrl(o.delegate.phone, wa.fill(bodies().delegate_assigned, wa.orderVars(o)));
  const digestList = () => orders.filter(needsGroup);
  const digestUrl = list => wa.waUrl('', wa.fill(bodies().delegates_digest, { ...wa.orderVars({}), ...wa.digestVars(list) }));

  function flagsHtml(o) {
    const s = S(o);
    const f = [];
    if (!o.delegate_id && s.release) f.push(`<span class="ib-flag todo"><i class="fas fa-rotate-left"></i> رجّعه المندوب: ${esc(s.release)}</span>`);
    if (o.delegate_id) {
      const nm = esc(firstName(o.delegate && o.delegate.full_name) || 'معيّن');
      f.push(s.delegate.length ? `<span class="ib-flag ok"><i class="fas fa-check"></i> المندوب ${nm}</span>`
        : `<span class="ib-flag ${o.delegate && o.delegate.phone ? 'todo' : ''}"><i class="fas fa-id-badge"></i> المندوب ${nm}${o.delegate && o.delegate.phone ? ' — ما وصلته التفاصيل' : ''}</span>`);
    } else if (s.group.length) {
      f.push(`<span class="ib-flag ok"><i class="fas fa-check"></i> القروب${s.group.length > 1 ? ` ×${s.group.length}` : ''} · ${esc(ago(s.group[s.group.length - 1]))}</span>`);
    } else if (needsGroup(o)) {
      f.push('<span class="ib-flag todo"><i class="fas fa-users"></i> لسّا ما انبعتش للقروب</span>');
    }
    f.push(s.customer.has(o.status)
      ? `<span class="ib-flag ok"><i class="fas fa-check"></i> الزبون: ${esc(statusTpl(o).label)}</span>`
      : `<span class="ib-flag todo"><i class="fas fa-user"></i> الزبون ما وصله «${esc(statusTpl(o).label)}»</span>`);
    return `<div class="ib-flags">${f.join('')}</div>`;
  }

  function itemHtml(o, { compact = false } = {}) {
    const urgent = o.urgency === 'عاجل';
    const replied = !needsReply(o);
    return `
      <div class="ib-item${needsAny(o) ? '' : ' is-done'}${urgent ? ' is-urgent' : ''}" data-id="${esc(o.id)}">
        <div class="ib-top">
          <span class="mono ltr ib-code">${esc(o.code)}</span>
          ${ui.statusBadge(o.status)}
          ${urgent ? '<span class="badge badge-urgent"><i class="fas fa-bolt"></i> عاجل</span>' : ''}
          <span class="muted ib-ago">${esc(ago(o.created_at))}</span>
          ${compact ? '<button type="button" class="icon-btn ib-x" data-act="dismiss" aria-label="إخفاء"><i class="fas fa-xmark"></i></button>' : ''}
        </div>
        <div class="ib-who"><i class="fas fa-user"></i> ${esc(o.customer_name)} <span class="muted">· ${esc(o.city)} · ${esc(o.category)}</span></div>
        ${o.details ? `<div class="ib-det muted">${esc(String(o.details).slice(0, 140))}</div>` : ''}
        ${compact ? '' : flagsHtml(o)}
        <div class="ib-btns">
          <a class="btn ${replied ? 'btn-ghost' : 'btn-wa'} btn-sm" data-act="reply" target="_blank" rel="noopener" href="${esc(replyUrl(o))}"><i class="fab fa-whatsapp"></i> ${replied ? 'رد ثاني' : 'رد'}: ${esc(statusTpl(o).label)}</a>
          ${o.delegate_id
            ? (o.delegate && o.delegate.phone ? `<a class="btn ${needsDelegate(o) ? 'btn-wa' : 'btn-ghost'} btn-sm" data-act="delegate" target="_blank" rel="noopener" href="${esc(delegateUrl(o))}"><i class="fas fa-id-badge"></i> للمندوب ${esc(firstName(o.delegate.full_name))}</a>` : '')
            : `<a class="btn ${needsGroup(o) ? 'btn-wa' : 'btn-ghost'} btn-sm" data-act="group" target="_blank" rel="noopener" href="${esc(groupUrl(o))}"><i class="fas fa-users"></i> ${S(o).group.length ? 'للقروب مرة ثانية' : 'للقروب'}</a>`}
          <a class="btn btn-ghost btn-sm" href="/admin/orders/?id=${esc(o.id)}"><i class="fas fa-up-right-from-square"></i> افتح</a>
          ${compact ? '' : '<button type="button" class="btn btn-ghost btn-sm ib-cancel" data-act="cancel"><i class="fas fa-ban"></i> إلغاء</button>'}
        </div>
      </div>`;
  }

  function listHtml() {
    const perm = ('Notification' in window) ? Notification.permission : 'denied';
    const notifBtn = perm === 'default'
      ? '<button type="button" class="btn btn-ghost btn-sm" data-act="notify"><i class="fas fa-bell"></i> فعّل تنبيهات المتصفح (حتى لو الصفحة في الخلفية)</button>' : '';
    if (!orders.length) return `${notifBtn}<div class="empty"><i class="fas fa-inbox"></i>ما فيش طلبات مفتوحة توا — أول ما يوصل طلب يطلع هنا مع تنبيه.</div>`;
    const f = FILTERS.find(x => x.key === filter) || FILTERS[0];
    const shown = orders.filter(f.match);
    const dg = digestList();
    const chips = FILTERS.map(x => `<button type="button" class="chip${x.key === f.key ? ' active' : ''}" data-filter="${x.key}">${esc(x.label)} <span class="cnt">${orders.filter(x.match).length}</span></button>`).join('');
    const digest = dg.length > 1
      ? `<div class="ib-digest"><a class="btn btn-wa btn-sm" data-act="digest" target="_blank" rel="noopener" href="${esc(digestUrl(dg))}"><i class="fas fa-users"></i> ابعت ${dg.length} طلبات للقروب في رسالة وحدة</a>
         <small class="muted">الطلبات اللي بدون مندوب ولسّا ما انبعتتش — بدون أسماء وأرقام الزبائن.</small></div>` : '';
    return `<div class="chips ib-filters">${chips}</div>
      ${digest}
      ${notifBtn}
      ${shown.length ? `<div class="ib-list">${shown.map(o => itemHtml(o)).join('')}</div>`
        : `<div class="empty"><i class="fas fa-circle-check"></i>${f.key === 'all' ? 'ما فيش طلبات مفتوحة.' : 'كل شي منبعت ✓ — ما فيش حاجة ناقصة هنا.'}</div>`}`;
  }

  function openInbox() {
    if (modal && modal.isConnected) { load(); return; }   // مفتوح أصلاً — نحدّثه بس
    filter = orders.some(needsAny) ? 'todo' : 'all';
    modal = ui.modal({ title: 'صندوق الطلبات', body: listHtml(), wide: true, footer: '<button type="button" class="btn btn-ghost" data-close>إغلاق</button>' });
    modal.addEventListener('click', onAction);
    load();
  }

  function showPop(o, head = '<i class="fas fa-bell"></i> طلب جديد وصل') {
    const el = document.createElement('div');
    el.className = 'ib-pop';
    el.innerHTML = `<div class="ib-pop-head">${head}</div>${itemHtml(o, { compact: true })}`;
    el.addEventListener('click', onAction);
    pop.prepend(el);
    while (pop.children.length > 3) pop.lastElementChild.remove();
    requestAnimationFrame(() => el.classList.add('show'));
  }

  // نقرة على رابط واتساب: الرابط يفتح واتساب (سلوكه الطبيعي) وإحنا نسجّل الإرسال في سجل الطلب ونحدّث العلامات
  function onAction(e) {
    const fb = e.target.closest('[data-filter]');
    if (fb) { filter = fb.dataset.filter; paint(); return; }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'notify') { Notification.requestPermission().then(paint); return; }
    if (act === 'dismiss') { const p = a.closest('.ib-pop'); if (p) p.remove(); return; }
    if (act === 'digest') {
      const list = digestList().slice(0, 15);
      list.forEach(o => { S(o).group.push(new Date().toISOString()); logWaSend(sb, profile, o, waNotes.group('رسالة مجمّعة')); });
      setTimeout(paint, 50);
      return;
    }
    const item = a.closest('[data-id]');
    const o = item && orders.find(x => x.id === item.dataset.id);
    if (!o) return;
    if (act === 'cancel') {
      quickCancel({ db, ui, sb, profile }, o)
        .then(done => { if (done) { ui.toast(`تم إلغاء الطلب ${o.code}`, 'ok'); load(); window.dispatchEvent(new CustomEvent('dawerli:new-order', { detail: { ids: [o.id] } })); } })
        .catch(err => ui.toast(db.friendlyError(err), 'err'));
      return;
    }
    const s = S(o);
    if (!sends.has(o.id)) sends.set(o.id, s);
    if (act === 'reply') { s.customer.add(o.status); logWaSend(sb, profile, o, waNotes.customer(statusTpl(o).label)); }
    else if (act === 'group') { s.group.push(new Date().toISOString()); logWaSend(sb, profile, o, waNotes.group()); }
    else if (act === 'delegate') { s.delegate.push(new Date().toISOString()); logWaSend(sb, profile, o, waNotes.delegate(firstName(o.delegate && o.delegate.full_name))); }
    setTimeout(paint, 50);
    const p = a.closest('.ib-pop');
    if (p && act === 'reply') setTimeout(() => p.remove(), 400);
  }

  function notifyBrowser(o, n) {
    try {
      if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
      const note = new Notification(n > 1 ? `${n} طلبات جديدة — دورلي` : `طلب جديد ${o.code} — دورلي`, {
        body: `${o.customer_name} · ${o.city} · ${o.category}`, icon: '/favicon.svg', tag: 'dawerli-new-order',
      });
      note.onclick = () => { window.focus(); openInbox(); note.close(); };
    } catch (_) { /* بعض المتصفحات ترفض الإشعار بدون تفاعل — نكتفي بالجرس */ }
  }
}

// صوت تنبيه قصير (نغمتين) بدون ملفات — لو المتصفح منع الصوت قبل أي تفاعل، نكتفي بالجرس والبطاقة
let actx = null;
function beep() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime;
    [[880, 0], [1320, 0.18]].forEach(([f, dt]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + dt);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.3);
      o.connect(g).connect(actx.destination);
      o.start(t0 + dt); o.stop(t0 + dt + 0.32);
    });
  } catch (_) { /* بدون صوت */ }
}

function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'توا';
  if (s < 3600) return `قبل ${Math.round(s / 60)} دقيقة`;
  if (s < 86400) return `قبل ${Math.round(s / 3600)} ساعة`;
  return `قبل ${Math.round(s / 86400)} يوم`;
}
