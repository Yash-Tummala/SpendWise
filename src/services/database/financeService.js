// src/services/database/financeService.js
import { supabase } from './supabaseClient';
import { enqueue } from './offlineSync';

export const tables = [
  'incomes',
  'expenses',
  'categories',
  'goals',
  'splits',
  'friends',
  'settings',
];

/* ---------- READ ---------- */
export const getAll = async (table) => {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return data;
};

export const getSetting = async (key, fallback) => {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // row not found
  return data?.value ?? fallback;
};

export const setSetting = async (key, value) => {
  const { error } = await supabase.from('settings').upsert({ key, value });
  if (error) throw error;
};

/* ---------- WRITE ---------- */
export const save = async (table, item) => {
  try {
    const { data, error } = await supabase.from(table).upsert(item);
    if (error) throw error;
    return data[0];
  } catch (e) {
    // offline – queue it
    enqueue({ type: 'upsert', table, item });
    throw e;
  }
};

export const remove = async (table, id) => {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    // offline – queue it
    enqueue({ type: 'remove', table, item: { id } });
    throw e;
  }
};

/* ---------- DEMO DATA ---------- */
export const demoData = () => ({
  incomes: [
    { id: 'demo-income-1', amount: 12000, source: 'Pocket money', date: '2023-09-01', notes: 'Monthly allowance', isDemo: true },
    { id: 'demo-income-2', amount: 1500, source: 'Freelance', date: '2023-09-10', notes: 'Design project', isDemo: true },
  ],
  categories: [
    { id: 'demo-category-1', name: 'Food', isDemo: true },
    { id: 'demo-category-2', name: 'Travel', isDemo: true },
    { id: 'demo-category-3', name: 'Shopping', isDemo: true },
    { id: 'demo-category-4', name: 'Entertainment', isDemo: true },
  ],
  expenses: [
    { id: 'demo-expense-1', amount: 420, category: 'Food', date: '2023-09-05', notes: 'Lunch with friends', paymentMethod: 'UPI', isDemo: true },
    { id: 'demo-expense-2', amount: 850, category: 'Shopping', date: '2023-09-12', notes: 'Essentials', paymentMethod: 'Card', isDemo: true },
    { id: 'demo-expense-3', amount: 180, category: 'Travel', date: '2023-09-15', notes: 'Metro recharge', paymentMethod: 'UPI', isDemo: true },
    { id: 'demo-expense-4', amount: 560, category: 'Food', date: '2023-09-20', notes: 'Groceries', paymentMethod: 'Cash', isDemo: true },
    { id: 'demo-expense-5', amount: 300, category: 'Entertainment', date: '2023-09-25', notes: 'Movie tickets', paymentMethod: 'UPI', isDemo: true },
  ],
  goals: [
    { id: 'demo-goal-1', title: 'New headphones', target: 5000, saved: 2800, deadline: '2023-10-15', isDemo: true },
  ],
  friends: [
    { id: 'demo-friend-1', name: 'Aisha', isDemo: true },
    { id: 'demo-friend-2', name: 'Rohan', isDemo: true },
  ],
  splits: [
    {
      id: 'demo-split-1',
      description: 'Weekend dinner',
      amount: 900,
      payer: 'Me',
      date: '2023-09-18',
      shares: [
        { person: 'Me', amount: 300 },
        { person: 'Aisha', amount: 300 },
        { person: 'Rohan', amount: 300 },
      ],
      settledFor: [],
      isDemo: true,
    },
  ],
});

export const seedDemoData = async () => {
  const { data } = await supabase.from('incomes').select('id', { limit: 1 });
  if (data?.length) return false; // already seeded
  const demo = demoData();
  for (const tbl of tables) {
    if (tbl === 'settings') continue;
    const rows = demo[tbl] || [];
    if (rows.length) {
      const { error } = await supabase.from(tbl).upsert(rows);
      if (error) throw error;
    }
  }
  return true;
};

export const clearDemoData = async () => {
  for (const tbl of tables) {
    if (tbl === 'settings') continue;
    await supabase.from(tbl).delete().eq('isDemo', true);
  }
  await setSetting('demoCleared', true);
};

/* ---------- EXPORT / IMPORT ---------- */
export const exportData = async () => {
  const result = { version: 1, exportedAt: new Date().toISOString() };
  for (const tbl of tables) {
    const { data, error } = await supabase.from(tbl).select('*');
    if (error) throw error;
    result[tbl] = data;
  }
  const { data: settings } = await supabase.from('settings').select('*');
  result.settings = settings;
  return result;
};

export const importData = async (payload) => {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid backup file');
  for (const tbl of tables) {
    await supabase.from(tbl).delete();
    const rows = payload[tbl] || [];
    if (rows.length) {
      const { error } = await supabase.from(tbl).upsert(rows);
      if (error) throw error;
    }
  }
};

/* ---------- RESET ---------- */
export const resetData = async () => {
  for (const tbl of tables) {
    await supabase.from(tbl).delete();
  }
};

const iso = offset => { const date=new Date();date.setDate(date.getDate()+offset);return date.toISOString().slice(0,10); };
export const demoData = () => ({
  incomes:[{id:'demo-income-1',amount:12000,source:'Pocket money',date:iso(-17),notes:'Monthly allowance',isDemo:true},{id:'demo-income-2',amount:1500,source:'Freelance',date:iso(-6),notes:'Design project',isDemo:true}],
  categories:[{id:'demo-category-1',name:'Food',isDemo:true},{id:'demo-category-2',name:'Travel',isDemo:true},{id:'demo-category-3',name:'Shopping',isDemo:true},{id:'demo-category-4',name:'Entertainment',isDemo:true}],
  expenses:[{id:'demo-expense-1',amount:420,category:'Food',date:iso(-14),notes:'Lunch with friends',paymentMethod:'UPI',isDemo:true},{id:'demo-expense-2',amount:850,category:'Shopping',date:iso(-10),notes:'Essentials',paymentMethod:'Card',isDemo:true},{id:'demo-expense-3',amount:180,category:'Travel',date:iso(-7),notes:'Metro recharge',paymentMethod:'UPI',isDemo:true},{id:'demo-expense-4',amount:560,category:'Food',date:iso(-3),notes:'Groceries',paymentMethod:'Cash',isDemo:true},{id:'demo-expense-5',amount:300,category:'Entertainment',date:iso(-1),notes:'Movie tickets',paymentMethod:'UPI',isDemo:true}],
  goals:[{id:'demo-goal-1',title:'New headphones',target:5000,saved:2800,deadline:iso(45),isDemo:true}],
  friends:[{id:'demo-friend-1',name:'Aisha',isDemo:true},{id:'demo-friend-2',name:'Rohan',isDemo:true}],
  splits:[{id:'demo-split-1',description:'Weekend dinner',amount:900,payer:'Me',date:iso(-2),shares:[{person:'Me',amount:300},{person:'Aisha',amount:300},{person:'Rohan',amount:300}],settledFor:[],isDemo:true}]
});
export const getAll = (table) => db[table].toArray();
export const save = (table, item) => db[table].put(item);
export const remove = (table, id) => db[table].delete(id);
export const getSetting = async (key, fallback) => (await db.settings.get(key))?.value ?? fallback;
export const setSetting = (key,value) => db.settings.put({key,value});
export async function seedDemoData(){if(await db.incomes.get('demo-income-1'))return false;const demo=demoData();await db.transaction('rw',tables.map(table=>db[table]),async()=>{for(const table of tables)await db[table].bulkPut(demo[table]||[])});return true;}
export async function clearDemoData(){for(const table of tables)await db[table].filter(item=>item.isDemo===true).delete();await setSetting('demoCleared',true);}
export async function exportData(){ const result={version:1,exportedAt:new Date().toISOString()}; for(const table of tables)result[table]=await db[table].toArray(); result.settings=await db.settings.toArray(); return result; }
export async function importData(data){ if(!data||typeof data!=='object'||!tables.every(t=>Array.isArray(data[t]))) throw new Error('This backup is not a valid Ledgerly export.'); await db.transaction('rw',[...tables.map(t=>db[t]),db.settings],async()=>{for(const t of tables){await db[t].clear(); await db[t].bulkPut(data[t]);} if(Array.isArray(data.settings)){await db.settings.clear();await db.settings.bulkPut(data.settings);}}); }
export async function resetData(){ await Promise.all([...tables.map(t=>db[t].clear()),db.settings.clear()]); }
