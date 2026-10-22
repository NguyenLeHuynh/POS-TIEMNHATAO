import Dexie from 'dexie';

export const localDb = new Dexie('MatchaPOSLocal');

localDb.version(3).stores({
  orders: '++id, created_at, sync_status',
  products: 'id, name, category',
  inventory: '++id, name',
  staff: '++id, username',
  issue_reports: '++id, created_at',
  categories: '++id, name'
});