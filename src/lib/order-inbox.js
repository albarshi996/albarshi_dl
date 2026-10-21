// صندوق الطلبات الجديدة للإدارة: جرس في الشريط العلوي + تنبيه فوري (صوت وبطاقة) أول ما يوصل طلب،
// وكل بطاقة فيها الرد الموحد جاهز وزر قروب المندوبين. كل رسالة تنبعت تنسجّل في سجل الطلب (داخلي)،
// فالطلب نفسه هو مصدر الردود وسجلّها.
// مصمم ما يكسرش اللوحة: أي فشل هنا يتسجّل في الكونسول بس، وRealtime لو تعطّل فيه تحديث دوري احتياطي.
import * as wa from './wa-templates.js';

const SELECT = 'id,code,status,customer_name,customer_phone,city,category,details,quantity,urgency,car_model,part_condition,part_description,created_at';
const REPLIED_PREFIX = '📤 واتساب للزبون';
const POLL_MS = 90_000;

/**
 * يسجّل إرسال رسالة واتساب في سجل الطلب كملاحظة داخلية (ما تظهرش للزبون).
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
  customer: label => `${REPLIED_PREFIX}: «${label}»`,
  group: () => '📤 واتساب لقروب المندوبين',
  delegate: name => `📤 واتساب للمندوب ${name || ''}`.trim(),
};

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
  let replied = new Set();
  let known = null;              // معرّفات الطلبات المعروفة — null قبل أول تحميل (ما ننبّهوش على القديم)
  let tpls = null;
  let modal = null;
  let reloadTimer = null;

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
        .eq('status', 'received').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      const list = data || [];
      const ids = list.map(o => o.id);
      let rep = new Set();
      if (ids.length) {
        const ev = await sb.from('order_events').select('order_id')
          .in('order_id', ids).eq('kind', 'note').eq('visible_to_customer', false).like('note', REPLIED_PREFIX + '%');
        if (!ev.error) rep = new Set((ev.data || []).map(e => e.order_id));
      }
      const fresh = known ? list.filter(o => !known.has(o.id)) : [];
      known = new Set([...(known || []), ...ids]);
      orders = list;
      replied = rep;
      paint();
      if (fresh.length) {
        beep();
        fresh.slice(0, 3).reverse().forEach(showPop);
        notifyBrowser(fresh[0], fresh.length);
        window.dispatchEvent(new CustomEvent('dawerli:new-order', { detail: { ids: fresh.map(o => o.id) } }));
      }
    } catch (e) {
      console.warn('inbox:', e && e.message ? e.message : e);
    }
  }

  function unrepliedCount() { return orders.filter(o => !replied.has(o.id)).length; }

  function paint() {
    const n = unrepliedCount();
    countEl.textContent = n > 99 ? '99+' : String(n);
    countEl.hidden = !n;
    btn.classList.toggle('has-new', n > 0);
    btn.title = n ? `${n} طلب جديد بدون رد` : 'صندوق الطلبات الجديدة';
    document.title = (n ? `(${n}) ` : '') + baseTitle;
    if (modal && modal.isConnected) modal.querySelector('.modal-body').innerHTML = listHtml();
  }

  // ── الروابط والرسائل ──
  const bodies = () => (tpls && tpls.bodies) || wa.DEFAULTS;
  const replyUrl = o => wa.waUrl(o.customer_phone, wa.fill(bodies().customer_received, wa.orderVars(o)));
  const groupUrl = o => wa.waUrl('', wa.fill(bodies().delegates_group, wa.orderVars(o)));
  const receivedLabel = (wa.TEMPLATES.find(t => t.key === 'customer_received') || {}).label || 'استلام الطلب';

  function itemHtml(o, { compact = false } = {}) {
    const done = replied.has(o.id);
    const urgent = o.urgency === 'عاجل';
    return `
      <div class="ib-item${done ? ' is-done' : ''}${urgent ? ' is-urgent' : ''}" data-id="${esc(o.id)}">
        <div class="ib-top">
          <span class="mono ltr ib-code">${esc(o.code)}</span>
          ${urgent ? '<span class="badge badge-urgent"><i class="fas fa-bolt"></i> عاجل</span>' : ''}
          ${done ? '<span class="badge st-delivered"><i class="fas fa-check"></i> تم الرد</span>' : ''}
          <span class="muted ib-ago">${esc(ago(o.created_at))}</span>
          ${compact ? '<button type="button" class="icon-btn ib-x" data-act="dismiss" aria-label="إخفاء"><i class="fas fa-xmark"></i></button>' : ''}
        </div>
        <div class="ib-who"><i class="fas fa-user"></i> ${esc(o.customer_name)} <span class="muted">· ${esc(o.city)} · ${esc(o.category)}</span></div>
        ${o.details ? `<div class="ib-det muted">${esc(String(o.details).slice(0, 140))}</div>` : ''}
        <div class="ib-btns">
          <a class="btn btn-wa btn-sm" data-act="reply" target="_blank" rel="noopener" href="${esc(replyUrl(o))}"><i class="fab fa-whatsapp"></i> ${done ? 'رد ثاني' : 'رد موحد'}</a>
          <a class="btn btn-ghost btn-sm" data-act="group" target="_blank" rel="noopener" href="${esc(groupUrl(o))}"><i class="fas fa-users"></i> للقروب</a>
          <a class="btn btn-ghost btn-sm" href="/admin/orders/?id=${esc(o.id)}"><i class="fas fa-up-right-from-square"></i> افتح</a>
        </div>
      </div>`;
  }

  function listHtml() {
    const perm = ('Notification' in window) ? Notification.permission : 'denied';
    const notifBtn = perm === 'default'
      ? '<button type="button" class="btn btn-ghost btn-sm" data-act="notify"><i class="fas fa-bell"></i> فعّل تنبيهات المتصفح (حتى لو الصفحة في الخلفية)</button>' : '';
    if (!orders.length) return `${notifBtn}<div class="empty"><i class="fas fa-inbox"></i>ما فيش طلبات جديدة توا — أول ما يوصل طلب يطلع هنا مع تنبيه.</div>`;
    const n = unrepliedCount();
    return `<p class="muted ib-sum">${orders.length} طلب «استلمنا طلبك»${n ? ` — <strong>${n} بدون رد</strong>` : ' — كلهم تم الرد عليهم ✓'}. الطلب يطلع من هنا لما يتعيّن له مندوب أو تتغيّر حالته.</p>
      ${notifBtn}
      <div class="ib-list">${orders.map(o => itemHtml(o)).join('')}</div>`;
  }

  function openInbox() {
    if (modal && modal.isConnected) { load(); return; }   // مفتوح أصلاً — نحدّثه بس
    modal = ui.modal({ title: 'طلبات جديدة', body: listHtml(), footer: '<button type="button" class="btn btn-ghost" data-close>إغلاق</button>' });
    modal.addEventListener('click', onAction);
    load();
  }

  function showPop(o) {
    const el = document.createElement('div');
    el.className = 'ib-pop';
    el.innerHTML = `<div class="ib-pop-head"><i class="fas fa-bell"></i> طلب جديد وصل</div>${itemHtml(o, { compact: true })}`;
    el.addEventListener('click', onAction);
    pop.prepend(el);
    while (pop.children.length > 3) pop.lastElementChild.remove();
    requestAnimationFrame(() => el.classList.add('show'));
  }

  // نقرة على رد/قروب: الرابط يفتح واتساب (السلوك الطبيعي للرابط) وإحنا نسجّل الإرسال في سجل الطلب
  function onAction(e) {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'notify') { Notification.requestPermission().then(paint); return; }
    const item = a.closest('[data-id]');
    const o = item && orders.find(x => x.id === item.dataset.id);
    if (act === 'dismiss') { const p = a.closest('.ib-pop'); if (p) p.remove(); return; }
    if (!o) return;
    if (act === 'reply') {
      replied.add(o.id);
      logWaSend(sb, profile, o, waNotes.customer(receivedLabel));
      setTimeout(paint, 50);
      const p = a.closest('.ib-pop'); if (p) setTimeout(() => p.remove(), 400);
    } else if (act === 'group') {
      logWaSend(sb, profile, o, waNotes.group());
    }
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
