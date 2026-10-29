import Dexie from 'dexie';

export const localDb = new Dexie('TiemNhaTaoPOSDB');

localDb.version(1).stores({
  categories: '++id, &name',
  products: '++id, name, price, category, stock, is_available',
  inventory: '++id, name, quantity, unit, min_quantity, cost_price, old_cost_price',
  orders: '++id, code, created_at, total_amount, payment_method, staff_name',
  staff: '++id, full_name, &username, password, role',
  issue_reports: '++id, staff_name, title, content, status, created_at'
});