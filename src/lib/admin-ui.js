// أدوات واجهة لوحة التحكم: تنبيهات، نوافذ، جداول، نماذج. بلا تبعيات.
import { esc, STATUS_LABELS, formatDate } from './db.js';

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const ui = {
  esc,

  /** تنبيه عابر. type: 'ok' | 'err' | 'info' */
  toast(message, type = 'info', ms = 3200) {
    const root = document.getElementById('toastRoot');
    if (!root) return;
    const icon = type === 'ok' ? 'fa-circle-check' : type === 'err' ? 'fa-triangle-exclamation' : 'fa-circle-info';
    const t = el(`<div class="toast toast-${type}"><i class="fas ${icon}"></i><span>${esc(message)}</span></div>`);
    root.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
  },

  /** نافذة تأكيد. يُرجع Promise<boolean>. */
  confirm(message, { okText = 'تأكيد', danger = false } = {}) {
    return new Promise(resolve => {
      const m = this.modal({
        title: 'تأكيد',
        body: `<p class="confirm-text">${esc(message)}</p>`,
        footer: `<button type="button" class="btn btn-ghost" data-close>إلغاء</button>
                 <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(okText)}</button>`,
      });
      m.querySelector('[data-ok]').addEventListener('click', () => { m.close(); resolve(true); });
      m.addEventListener('closed', () => resolve(false), { once: true });
    });
  },

  /**
   * نافذة سبب: أسباب جاهزة بضغطة + نص حر (3 أحرف على الأقل). يُرجع Promise<string|null>.
   * تُستخدم لإلغاء الطلب (الإدارة) ولإرجاع الطلب (المندوب).
   */
  reasonPrompt({ title, intro = '', reasons = [], okText = 'تأكيد', danger = false, placeholder = 'أو اكتب السبب هنا…' } = {}) {
    return new Promise(resolve => {
      const m = this.modal({
        title,
        body: `${intro ? `<p class="confirm-text rp-intro">${esc(intro)}</p>` : ''}
          ${reasons.length ? `<div class="chips rp-chips">${reasons.map(r => `<button type="button" class="chip" data-reason="${esc(r)}">${esc(r)}</button>`).join('')}</div>` : ''}
          <label class="field"><span class="label">السبب <span class="req">*</span></span>
            <textarea rows="2" maxlength="300" placeholder="${esc(placeholder)}"></textarea></label>
          <p class="form-error" data-error hidden></p>`,
        footer: `<button type="button" class="btn btn-ghost" data-close>رجوع</button>
                 <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(okText)}</button>`,
      });
      const ta = m.querySelector('textarea');
      const err = m.querySelector('[data-error]');
      m.querySelectorAll('[data-reason]').forEach(c => c.addEventListener('click', () => {
        m.querySelectorAll('[data-reason]').forEach(x => x.classList.toggle('active', x === c));
        ta.value = c.dataset.reason;
        err.hidden = true;
      }));
      let done = false;
      m.querySelector('[data-ok]').addEventListener('click', () => {
        const v = ta.value.trim();
        if (v.length < 3) { err.textContent = 'اختار سبب من فوق أو اكتبه.'; err.hidden = false; ta.focus(); return; }
        done = true; m.close(); resolve(v.slice(0, 300));
      });
      m.addEventListener('closed', () => { if (!done) resolve(null); }, { once: true });
    });
  },

  /**
   * نافذة عامة. يُرجع عنصر .modal مع close().
   * opts: { title, body (html), footer (html), wide }
   */
  modal({ title = '', body = '', footer = '', wide = false } = {}) {
    const root = document.getElementById('modalRoot');
    const m = el(`
      <div class="modal-backdrop">
        <div class="modal ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
          <div class="modal-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="إغلاق"><i class="fas fa-xmark"></i></button></div>
          <div class="modal-body">${body}</div>
          ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
        </div>
      </div>`);
    let closed = false;
    m.close = () => {
      if (closed) return; closed = true;
      m.classList.remove('show');
      setTimeout(() => {
        m.remove();
        m.dispatchEvent(new Event('closed'));
        // نوافذ متداخلة (تأكيد فوق تفاصيل): لا نحرر تمرير الصفحة إلا عند إغلاق آخر نافذة
        if (!root.querySelector('.modal-backdrop')) document.body.classList.remove('modal-open');
      }, 180);
    };
    m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', m.close));
    m.addEventListener('click', e => { if (e.target === m) m.close(); });
    const onKey = e => { if (e.key === 'Escape') { m.close(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
    root.appendChild(m);
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => m.classList.add('show'));
    const first = m.querySelector('input, select, textarea, button:not([data-close])');
    if (first) setTimeout(() => first.focus(), 50);
    return m;
  },

  /**
   * نافذة نموذج. fields: [{ name, label, type='text', required, options:[{value,label}], value, placeholder, rows, hint }]
   * يُرجع Promise<object|null> بقيم الحقول، أو null عند الإلغاء. onSubmit(values) اختياري — إن رمى خطأً تبقى النافذة مفتوحة.
   */
  form({ title, fields, values = {}, submitText = 'حفظ', onSubmit, wide = false }) {
    return new Promise(resolve => {
      const body = `<form class="form-grid" novalidate>${fields.map(f => this.fieldHtml(f, values[f.name])).join('')}
        <p class="form-error" data-error hidden></p></form>`;
      const m = this.modal({
        title, body, wide,
        footer: `<button type="button" class="btn btn-ghost" data-close>إلغاء</button>
                 <button type="button" class="btn btn-primary" data-submit>${esc(submitText)}</button>`,
      });
      const form = m.querySelector('form');
      const errEl = m.querySelector('[data-error]');
      let done = false;
      const submit = async () => {
        const out = {};
        for (const f of fields) {
          const input = form.elements[f.name];
          if (!input) continue;
          let v = f.type === 'checkbox' ? input.checked : (input.value ?? '').toString().trim();
          if (f.type === 'number') v = v === '' ? null : Number(v);
          if (f.type === 'tags') v = v ? v.split(/[،,]/).map(s => s.trim()).filter(Boolean) : [];
          if (f.required && (v === '' || v === null || (Array.isArray(v) && !v.length))) {
            errEl.textContent = `حقل "${f.label}" مطلوب.`; errEl.hidden = false; input.focus(); return;
          }
          out[f.name] = v === '' ? null : v;
        }
        errEl.hidden = true;
        const btn = m.querySelector('[data-submit]');
        btn.disabled = true;
        try {
          if (onSubmit) await onSubmit(out);
          done = true; m.close(); resolve(out);
        } catch (e) {
          errEl.textContent = (e && e.friendly) || (e && e.message) || String(e);
          errEl.hidden = false;
        } finally { btn.disabled = false; }
      };
      m.querySelector('[data-submit]').addEventListener('click', submit);
      form.addEventListener('submit', e => { e.preventDefault(); submit(); });
      m.addEventListener('closed', () => { if (!done) resolve(null); }, { once: true });
    });
  },

  fieldHtml(f, value) {
    const v = value ?? f.value ?? '';
    const id = 'f_' + f.name;
    const req = f.required ? '<span class="req">*</span>' : '';
    const hint = f.hint ? `<small class="hint">${esc(f.hint)}</small>` : '';
    const full = f.full || f.type === 'textarea' ? ' full' : '';
    let control = '';
    if (f.type === 'textarea') {
      control = `<textarea id="${id}" name="${f.name}" rows="${f.rows || 3}" placeholder="${esc(f.placeholder || '')}">${esc(v)}</textarea>`;
    } else if (f.type === 'select') {
      control = `<select id="${id}" name="${f.name}">${(f.options || []).map(o =>
        `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
    } else if (f.type === 'checkbox') {
      return `<label class="field check${full}"><input type="checkbox" id="${id}" name="${f.name}" ${v ? 'checked' : ''}> <span>${esc(f.label)}</span>${hint}</label>`;
    } else if (f.type === 'tags') {
      control = `<input id="${id}" name="${f.name}" type="text" value="${esc(Array.isArray(v) ? v.join('، ') : v)}" placeholder="${esc(f.placeholder || 'افصل بينها بفاصلة')}">`;
    } else {
      control = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${f.step ? `step="${f.step}"` : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.pattern ? `pattern="${f.pattern}"` : ''} ${f.inputmode ? `inputmode="${f.inputmode}"` : ''}>`;
    }
    return `<label class="field${full}" for="${id}"><span class="label">${esc(f.label)}${req}</span>${control}${hint}</label>`;
  },

  /**
   * جدول. columns: [{ key, label, render(row) → html (مهرَّب!), width, class }]
   * opts: { rows, columns, empty, onRow(row, tr) }
   * يُرجع عنصر .table-wrap
   */
  table({ columns, rows, empty = 'لا توجد بيانات بعد.', onRow }) {
    const wrap = el(`<div class="table-wrap"><table class="table"><thead><tr>${columns.map(c =>
      `<th style="${c.width ? 'width:' + c.width : ''}">${esc(c.label)}</th>`).join('')}</tr></thead><tbody></tbody></table></div>`);
    const tbody = wrap.querySelector('tbody');
    if (!rows || !rows.length) {
      tbody.innerHTML = `<tr><td colspan="${columns.length}"><div class="empty">${esc(empty)}</div></td></tr>`;
      return wrap;
    }
    for (const row of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = columns.map(c => `<td class="${c.class || ''}" data-label="${esc(c.label)}">${c.render ? c.render(row) : esc(row[c.key])}</td>`).join('');
      if (onRow) { tr.classList.add('clickable'); tr.addEventListener('click', e => { if (!e.target.closest('button, a, input, select')) onRow(row, tr); }); }
      tbody.appendChild(tr);
    }
    return wrap;
  },

  statusBadge(status) {
    return `<span class="badge st-${esc(status)}">${esc(STATUS_LABELS[status] || status)}</span>`;
  },

  statTile({ label, value, icon, tone = '' }) {
    return `<div class="stat ${tone}"><div class="stat-icon"><i class="fas ${icon}"></i></div><div><div class="stat-value">${esc(value)}</div><div class="stat-label">${esc(label)}</div></div></div>`;
  },

  skeleton(n = 4) {
    return `<div class="skeleton-list">${Array.from({ length: n }, () => '<div class="skeleton"></div>').join('')}</div>`;
  },

  /** شريط أدوات بحث + أزرار. يُرجع { el, input } */
  toolbar({ placeholder = 'بحث…', buttons = '' } = {}) {
    const bar = el(`<div class="toolbar"><div class="search"><i class="fas fa-magnifying-glass"></i><input type="search" placeholder="${esc(placeholder)}"></div><div class="toolbar-btns">${buttons}</div></div>`);
    return { el: bar, input: bar.querySelector('input') };
  },

  /** ترقيم بسيط. يُرجع عنصراً؛ onPage(page) */
  pager({ page, pageSize, total, onPage }) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const p = el(`<div class="pager"><button type="button" class="btn btn-ghost btn-sm" data-prev ${page <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
      <span>صفحة ${page} من ${pages} · ${total} سجل</span>
      <button type="button" class="btn btn-ghost btn-sm" data-next ${page >= pages ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button></div>`);
    p.querySelector('[data-prev]').addEventListener('click', () => onPage(page - 1));
    p.querySelector('[data-next]').addEventListener('click', () => onPage(page + 1));
    return p;
  },

  setupNoticeHtml() {
    return `<div class="gate-card">
      <div class="gate-icon"><i class="fas fa-database"></i></div>
      <h2>قاعدة البيانات غير مهيأة بعد</h2>
      <p>اللوحة جاهزة، وتحتاج فقط ربطها بمشروع Supabase:</p>
      <ol class="setup-steps">
        <li>أنشئ مشروعاً على <strong>supabase.com</strong> (منطقة فرانكفورت).</li>
        <li>نفّذ ملف <code>supabase/migrations/20261017000000_init.sql</code> في SQL Editor.</li>
        <li>ضع <code>Project URL</code> و<code>anon key</code> في <code>src/lib/supabase-config.js</code> واعتمد التغيير.</li>
        <li>سجّل حسابك من <a href="/delegate/login/">صفحة الدخول</a> ثم رقّه إلى مدير بالاستعلام المذكور أعلى ملف الـ migration.</li>
      </ol>
      <p class="muted">التفاصيل الكاملة في <code>docs/SUPABASE-SETUP.md</code>.</p>
    </div>`;
  },

  gateHtml(title, text, href, linkText = 'تسجيل الدخول') {
    return `<div class="gate-card">
      <div class="gate-icon"><i class="fas fa-lock"></i></div>
      <h2>${esc(title)}</h2>
      <p>${esc(text)}</p>
      ${href ? `<a class="btn btn-primary" href="${esc(href)}">${esc(linkText)}</a>` : ''}
    </div>`;
  },

  fmtDate: formatDate,
};
