import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import * as service from '../services/database/financeService';
export const FinanceContext=createContext(null);
export function FinanceProvider({children}){const [data,setData]=useState({incomes:[],expenses:[],categories:[],goals:[]});const [theme,setThemeState]=useState('light');const [loading,setLoading]=useState(true);const [toast,setToast]=useState(null);const [lastDeleted,setLastDeleted]=useState(null);
 const refresh=useCallback(async()=>{const values=await Promise.all(['incomes','expenses','categories','goals'].map(service.getAll));setData(Object.fromEntries(['incomes','expenses','categories','goals'].map((k,i)=>[k,values[i]])));},[]);
 useEffect(()=>{(async()=>{const saved=await service.getSetting('theme','light');setThemeState(saved);document.documentElement.className=saved;await refresh();setLoading(false)})()},[refresh]);
 const notify=useCallback(message=>{setToast(message);setTimeout(()=>setToast(null),3500)},[]);
 const upsert=useCallback(async(table,item)=>{const next={...item,id:item.id||uuid(),createdAt:item.createdAt||Date.now()};await service.save(table,next);await refresh();notify(`${table.slice(0,-1).replace(/^./,c=>c.toUpperCase())} ${item.id?'updated':'added'}.`);return next},[refresh,notify]);
 const deleteItem=useCallback(async(table,item)=>{await service.remove(table,item.id);await refresh();setLastDeleted({table,item});notify('Item deleted. You can undo this action.');},[refresh,notify]);
 const undo=useCallback(async()=>{if(!lastDeleted)return;await service.save(lastDeleted.table,lastDeleted.item);await refresh();setLastDeleted(null);notify('Deletion undone.');},[lastDeleted,refresh,notify]);
 const setTheme=useCallback(async value=>{setThemeState(value);document.documentElement.className=value;await service.setSetting('theme',value)},[]);
 const summary=useMemo(()=>{const income=data.incomes.reduce((s,x)=>s+Number(x.amount),0), expense=data.expenses.reduce((s,x)=>s+Number(x.amount),0);return {income,expense,balance:income-expense}},[data]);
 return <FinanceContext.Provider value={{...data,loading,theme,setTheme,refresh,upsert,deleteItem,undo,lastDeleted,notify,summary}}>{children}{toast&&<div className="toast-stack"><div className="toast">{toast}{lastDeleted&&<button onClick={undo}>Undo</button>}</div></div>}</FinanceContext.Provider>}
