import '../style/PageLearn.css'

import { useState, useEffect, useCallback } from "react";
import { DB_CLIENT, DB_TABLE_NAME, LanguageItemData, normalizeTurkish } from "../globals";
import type { RawItem, ItemType } from "../globals";


// ── Helpers ──────────────────────────────────────────────────────────────────

function matchesSearch(query: string, item: LanguageItemData): boolean {
  if (!query) return true;
  const en = normalizeTurkish(item.getLanguageEN().toLowerCase());
  const tr = normalizeTurkish(item.getLanguageTR().toLowerCase());
  return en.includes(query) || tr.includes(query);
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface ItemTableProps {
  title: string;
  items: LanguageItemData[];
  query: string;
}

function ItemTable({ title, items, query }: ItemTableProps) {
  const visible = items.filter((item) => matchesSearch(query, item));
  if (visible.length === 0) return null;

  return (
    <section className="section">
      <h3>{title}</h3>
      <div className="list-wrapper">
        <table>
          <thead>
            <tr>
              <th>English</th>
              <th>Turkish</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item, i) => (
              <tr key={i} className="entry">
                <td className="l-en">{item.getLanguageEN()}</td>
                <td className="l-tr">{item.getLanguageTR()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}



export default function PageLearn() {
  const [data, setData] = useState<LanguageItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [inputEN, setInputEN] = useState("");
  const [inputTR, setInputTR] = useState("");
  const [itemType, setItemType] = useState<ItemType | null>(null);
  const [addResult, setAddResult] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await DB_CLIENT.from(DB_TABLE_NAME).select("*");
      if (res.status !== 200) throw new Error(res.error?.message ?? "DB error");
      setData((res.data as RawItem[]).map((r) => new LanguageItemData(r)));
    } catch (err) {
      setLoadError(String(err));
    } finally {
      setLoading(false);
    }
  }, [DB_CLIENT]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Add item ──────────────────────────────────────────────────────────────

  async function handleAdd() {
    const en = inputEN.trim().toLowerCase();
    const tr = inputTR.trim().toLowerCase();

    if (!itemType || !en || !tr) {
      setAddResult("Missing data! Not added.");
      return;
    }

    const alreadyExists = data.some(
      (d) => d.getLanguageEN() === en && d.getLanguageTR() === tr
    );
    if (alreadyExists) {
      setAddResult("Item already in the database!");
      return;
    }

    const id = data.length + 1;
    const item: RawItem = { id, "l-EN": en, "l-TR": tr, type: itemType };
    await DB_CLIENT.from(DB_TABLE_NAME).insert(item);
    setAddResult(`Added ${itemType} '${en}' → '${tr}'.`);
    setInputEN("");
    setInputTR("");
    setItemType(null);
    await loadData();
  }

  // ── Filtered search ───────────────────────────────────────────────────────

  const normalizedQuery = normalizeTurkish(query.toLowerCase());

  const words     = data.filter((d) => d.getType() === "word");
  const phrases   = data.filter((d) => d.getType() === "phrase");
  const sentences = data.filter((d) => d.getType() === "sentence");

  const noResults =
    normalizedQuery.length > 0 &&
    [...words, ...phrases, ...sentences].every(
      (item) => !matchesSearch(normalizedQuery, item)
    );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main>
      <article>
        <h1>Learn</h1>

        <h2>Add data</h2>
        <div className="add-item-container">
          <input
            type="text"
            id="input-en"
            placeholder="English..."
            autoComplete="off"
            value={inputEN}
            onChange={(e) => setInputEN(e.target.value)}
          />
          <input
            type="text"
            id="input-tr"
            placeholder="Turkish..."
            autoComplete="off"
            value={inputTR}
            onChange={(e) => setInputTR(e.target.value)}
          />

          <div className="radio-container">
            {(["word", "phrase", "sentence"] as ItemType[]).map((t) => (
              <label key={t} className="radio-item">
                <input
                  type="radio"
                  name="choice"
                  value={t}
                  checked={itemType === t}
                  onChange={() => setItemType(t)}
                />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </label>
            ))}
          </div>

          <button className="btn" id="btn-add" onClick={handleAdd}>Add</button>

          {addResult && <p id="add-result-p">{addResult}</p>}
        </div>


        <h2>Search data</h2>
        <div className="search-container">
          <input
            type="text"
            maxLength={40}
            placeholder="Search..."
            autoComplete="off"
            id="search-input"
            value={query}
            disabled={loading}
            onChange={(e) => { setAddResult(null); setQuery(e.target.value); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          />
        </div>

        {loadError && <p className="p-error">{loadError}</p>}
        {noResults && <p id="no-result-p">No results.</p>}

        <ItemTable title="Words"     items={words}     query={normalizedQuery} />
        <ItemTable title="Phrases"   items={phrases}   query={normalizedQuery} />
        <ItemTable title="Sentences" items={sentences} query={normalizedQuery} />
      </article>
    </main>
  );
}
