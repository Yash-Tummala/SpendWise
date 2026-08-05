import { db, tables } from './db';
export const getAll = (table) => db[table].toArray();
export const save = (table, item) => db[table].put(item);
export const remove = (table, id) => db[table].delete(id);
export const getSetting = async (key, fallback) => (await db.settings.get(key))?.value ?? fallback;
export const setSetting = (key,value) => db.settings.put({key,value});
export async function exportData(){ const result={version:1,exportedAt:new Date().toISOString()}; for(const table of tables)result[table]=await db[table].toArray(); result.settings=await db.settings.toArray(); return result; }
export async function importData(data){ if(!data||typeof data!=='object'||!tables.every(t=>Array.isArray(data[t]))) throw new Error('This backup is not a valid Ledgerly export.'); await db.transaction('rw',[...tables.map(t=>db[t]),db.settings],async()=>{for(const t of tables){await db[t].clear(); await db[t].bulkPut(data[t]);} if(Array.isArray(data.settings)){await db.settings.clear();await db.settings.bulkPut(data.settings);}}); }
export async function resetData(){ await Promise.all([...tables.map(t=>db[t].clear()),db.settings.clear()]); }
