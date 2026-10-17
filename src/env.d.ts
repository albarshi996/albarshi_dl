/// <reference path="../.astro/types.d.ts" />

interface Window {
  /** وعد جاهزية لوحة التحكم — يحلّه AdminLayout.astro بـ { db, ui, sb, profile } */
  dawerliReady: Promise<{ db: any; ui: any; sb: any; profile: any }>;
  /** طبقة قاعدة البيانات للموقع العام — يضبطها Layout.astro */
  dawerliDB?: typeof import('./lib/db.js');
}
