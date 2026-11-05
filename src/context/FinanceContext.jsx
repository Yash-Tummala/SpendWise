// src/context/FinanceContext.jsx
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import * as service from '../services/database/financeService';
import { supabase } from '../services/database/supabaseClient';

export const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  // Detect demo mode via URL flag (only used to open demo window) –
  // actual demo data is loaded on demand from Settings.
  const demoMode = new URLSearchParams(window.location.search).has('demo');

  const [data, setData] = useState({
    incomes: [],
    expenses: [],
    categories: [],
    goals: [],
    splits: [],
    friends: [],
  });
  const [theme, setThemeState] = useState('light');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [lastDeleted, setLastDeleted] = useState(null);

  const notify = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ----- Refresh data from Supabase -----------------------------------
  const refresh = useCallback(async () => {
    const tables = ['incomes', 'expenses', 'categories', 'goals', 'splits', 'friends'];
    const values = await Promise.all(tables.map(service.getAll));
    setData(Object.fromEntries(tables.map((k, i) => [k, values[i]])));
  }, []);

  // ----- Realtime subscription ----------------------------------------
  useEffect(() => {
    const channel = supabase
      .channel('public-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: '*' }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  // ----- Initial load -------------------------------------------------
  useEffect(() => {
    (async () => {
      const savedTheme = await service.getSetting('theme', 'light');
      setThemeState(savedTheme);
      document.documentElement.className = savedTheme;

      // If a demo flag is present, we load demo data (only once).
      if (demoMode) {
        // Open a new window only if it hasn't been loaded yet.
        if (!sessionStorage.getItem('demoLoaded')) {
          window.open(window.location.href, '_blank', 'noopener,noreferrer');
          sessionStorage.setItem('demoLoaded', 'true');
          await service.seedDemoData();
        }
        setLoading(false);
        return;
      }

      // If the user explicitly asked for demo data via Settings, the flag
      // will be stored in the "loadDemo" setting. We check it here.
      const loadDemo = await service.getSetting('loadDemo', false);
      if (loadDemo && !sessionStorage.getItem('demoLoaded')) {
        // Seed demo data and reload the page to show the fresh DB.
        await service.seedDemoData();
        sessionStorage.setItem('demoLoaded', 'true');
        window.location.reload();
        return;
      }

      await refresh();
      setLoading(false);
    })();
  }, [demoMode, refresh]);

  // ----- CRUD operations ------------------------------------------------
  const upsert = useCallback(
    async (table, item) => {
      try {
        const next = {
          ...item,
          id: item.id || uuid(),
          createdAt: item.createdAt || Date.now(),
        };
        await service.save(table, next);
        await refresh();
        notify(`${table.slice(0, -1)} ${item.id ? 'updated' : 'added'}.`);
        return next;
      } catch (e) {
        console.error(e);
        notify('Database error – could not save.');
        return null;
      }
    },
    [refresh, notify]
  );

  const deleteItem = useCallback(
    async (table, item) => {
      try {
        await service.remove(table, item.id);
        await refresh();
        setLastDeleted({ table, item });
        notify('Item deleted. You can undo this action.');
      } catch (e) {
        console.error(e);
        notify('Database error – could not delete.');
      }
    },
    [refresh, notify]
  );

  const undo = useCallback(async () => {
    if (!lastDeleted) return;
    await upsert(lastDeleted.table, lastDeleted.item);
    setLastDeleted(null);
  }, [lastDeleted, upsert]);

  const setTheme = useCallback(async (value) => {
    setThemeState(value);
    document.documentElement.className = value;
    await service.setSetting('theme', value);
  }, []);

  // ----- Monthly summary & carry‑forward balance -----------------------
  const monthlySummary = useMemo(() => {
    const groupByMonth = (arr) => {
      const map = {};
      arr.forEach((it) => {
        const month = it.date.slice(0, 7); // YYYY‑MM
        if (!map[month]) map[month] = [];
        map[month].push(it);
      });
      return map;
    };
    const incByMonth = groupByMonth(data.incomes);
    const expByMonth = groupByMonth(data.expenses);
    const months = Array.from(new Set([...Object.keys(incByMonth), ...Object.keys(expByMonth)])).sort();
    const result = {};
    let carry = 0;
    months.forEach((m) => {
      const income = incByMonth[m]?.reduce((s, i) => s + Number(i.amount), 0) ?? 0;
      const expense = expByMonth[m]?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
      const balance = carry + income - expense;
      result[m] = { income, expense, balance };
      carry = balance;
    });
    return result;
  }, [data.incomes, data.expenses]);

  const getItemsByMonth = useCallback(
    (table, month) => {
      const items = data[table] || [];
      return items.filter((it) => it.date.startsWith(month));
    },
    [data]
  );

  const summary = useMemo(
    () => ({
      income: data.incomes.reduce((s, x) => s + Number(x.amount), 0),
      expense: data.expenses.reduce((s, x) => s + Number(x.amount), 0),
      balance: data.incomes.reduce((s, x) => s + Number(x.amount), 0) -
        data.expenses.reduce((s, x) => s + Number(x.amount), 0),
    }),
    [data]
  );

  const clearDefaultData = useCallback(async () => {
    await service.clearDemoData();
    await refresh();
    notify('Default demo data has been removed.');
  }, [refresh, notify]);

  return (
    <FinanceContext.Provider
      value={{
        ...data,
        loading,
        theme,
        setTheme,
        refresh,
        upsert,
        deleteItem,
        undo,
        lastDeleted,
        notify,
        summary,
        monthlySummary,
        getItemsByMonth,
        demoMode,
        clearDefaultData,
      }}
    >
      {children}
      {toast && (
        <div className="toast-stack">
          <div className="toast">
            {toast}
            {lastDeleted && <button onClick={undo}>Undo</button>}
          </div>
        </div>
      )}
    </FinanceContext.Provider>
  );
}
