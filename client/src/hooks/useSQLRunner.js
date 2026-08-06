import { useState, useEffect, useRef } from 'react';
import initSqlJs from 'sql.js';

export const useSQLRunner = () => {
    const [db, setDb] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);
    const dbRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        const initDB = async () => {
            try {
                // Initialize sql.js. It needs the path to the wasm file.
                // In Vite, we can copy the wasm file to public/ or import it.
                // It's often easiest to load it from a CDN for a quick setup, or point to public dir.
                // For this project, we'll try to load it from the unpkg CDN for simplicity and reliability.
                const SQL = await initSqlJs({
                    locateFile: file => `https://unpkg.com/sql.js@1.14.1/dist/${file}`
                });
                
                if (isMounted) {
                    const newDb = new SQL.Database();
                    setDb(newDb);
                    dbRef.current = newDb;
                    setIsReady(true);
                }
            } catch (err) {
                console.error("Failed to initialize sql.js", err);
                if (isMounted) setError(err.message);
            }
        };

        initDB();

        return () => {
            isMounted = false;
            if (dbRef.current) {
                try {
                    dbRef.current.close();
                } catch (e) {
                    console.error("Error closing DB", e);
                }
            }
        };
    }, []);

    const executeDDL = (sql) => {
        if (!dbRef.current) throw new Error("Database not ready");
        try {
            dbRef.current.run(sql);
            return true;
        } catch (err) {
            throw new Error(`DDL Error: ${err.message}`);
        }
    };

    const executeDML = (sql) => {
        if (!dbRef.current) throw new Error("Database not ready");
        try {
            dbRef.current.run(sql);
            return true;
        } catch (err) {
            throw new Error(`DML Error: ${err.message}`);
        }
    };

    const runQuery = (sql) => {
        if (!dbRef.current) throw new Error("Database not ready");
        try {
            const results = dbRef.current.exec(sql);
            if (results && results.length > 0) {
                return {
                    columns: results[0].columns,
                    values: results[0].values,
                    error: null
                };
            }
            // Return empty if no output (e.g. valid query but empty result)
            return { columns: [], values: [], error: null };
        } catch (err) {
            return { columns: [], values: [], error: err.message };
        }
    };

    const compareResults = (res1, res2) => {
        if (res1.error || res2.error) return false;

        // Compare columns, case-insensitively (e.g. "Total" vs "total" should still match)
        if (res1.columns.length !== res2.columns.length) return false;
        const cols1 = res1.columns.map(c => String(c).toLowerCase());
        const cols2 = res2.columns.map(c => String(c).toLowerCase());
        for (let i = 0; i < cols1.length; i++) {
            if (cols1[i] !== cols2[i]) return false;
        }

        // Compare values, ignoring row order (a correct query without a matching ORDER BY
        // can still return rows in a different order and should still be marked correct)
        if (res1.values.length !== res2.values.length) return false;
        const normalizeRows = (rows) =>
            rows.map(row => JSON.stringify(row.map(v => String(v)))).sort();
        const rows1 = normalizeRows(res1.values);
        const rows2 = normalizeRows(res2.values);
        for (let i = 0; i < rows1.length; i++) {
            if (rows1[i] !== rows2[i]) return false;
        }

        return true;
    };

    const resetDb = () => {
        if (dbRef.current) {
            try {
                // To reset completely, create a new DB instance
                // We'll rely on the caller to re-initialize schema
                const oldDb = dbRef.current;
                
                // Need to get SQL object again, but since we already have it in window or module cache:
                // Actually, the easiest way to reset is to execute PRAGMA or just DROP tables, 
                // but since we don't know the tables easily, we can just fetch all tables and drop them.
                const res = oldDb.exec("SELECT name FROM sqlite_master WHERE type='table';");
                if (res.length > 0) {
                    const tables = res[0].values.map(v => v[0]);
                    tables.forEach(table => {
                        if (table !== 'sqlite_sequence') {
                            oldDb.run(`DROP TABLE "${table}";`);
                        }
                    });
                }
                return true;
            } catch (err) {
                console.error("Failed to reset DB", err);
                return false;
            }
        }
    };

    return {
        isReady,
        error,
        executeDDL,
        executeDML,
        runQuery,
        compareResults,
        resetDb
    };
};
