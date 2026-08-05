import Dexie from 'dexie';
export const db = new Dexie('ledgerlyDB');
db.version(1).stores({ incomes:'id,date,source,amount', expenses:'id,date,category,amount,paymentMethod', categories:'id,name', goals:'id,deadline', settings:'key', reportsCache:'id' });
export const tables = ['incomes','expenses','categories','goals'];
