import { db, tables } from './db';
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
