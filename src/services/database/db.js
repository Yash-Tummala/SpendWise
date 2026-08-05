import Dexie from 'dexie';
export const db = new Dexie('ledgerlyDB');
db.version(1).stores({ incomes:'id,date,source,amount', expenses:'id,date,category,amount,paymentMethod', categories:'id,name', goals:'id,deadline', settings:'key', reportsCache:'id' });
db.version(2).stores({ incomes:'id,date,source,amount', expenses:'id,date,category,amount,paymentMethod', categories:'id,name', goals:'id,deadline', splits:'id,date,friend,status,amount', settings:'key', reportsCache:'id' });
db.version(3).stores({ incomes:'id,date,source,amount', expenses:'id,date,category,amount,paymentMethod', categories:'id,name', goals:'id,deadline', splits:'id,date,payer,amount', friends:'id,name', settings:'key', reportsCache:'id' });
export const tables = ['incomes','expenses','categories','goals','splits','friends'];
