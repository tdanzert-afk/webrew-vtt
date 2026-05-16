import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { libraryItems } from "./data/library";

const categories = [
  "All",
  "Module",
  "Monster",
  "NPC",
  "Location",
  "Item",
  "Spell",
  "Table",
  "Map",
];

const entryTypes = [
  "Module",
  "Monster",
  "NPC",
  "Location",
  "Item",
  "Spell",
  "Table",
  "Map",
];

const blankForm = {
  type: "Monster",
  name: "",
  module: "",
  summary: "",
  tags: "",
  size: "",
  creatureType: "",
  alignment: "",
  ac: "",
  hp: "",
  speed: "",
  cr: "",
  str: "",
  dex: "",
  con: "",
  int: "",
  wis: "",
  cha: "",
  skills: "",
  languages: "",
  traits: "",
  actions: "",
};
const STORAGE_KEY = "webrew-vtt-library";

function loadSavedItems() {
  const savedItems = localStorage.getItem(STORAGE_KEY);

  if (!savedItems) {
    return libraryItems;
  }

  try {
    return JSON.parse(savedItems);
  } catch {
    return libraryItems;
  }
}

function App() {
const [items, setItems] = useState(loadSavedItems);
const [searchTerm, setSearchTerm] = useState("");
const [activeCategory, setActiveCategory] = useState("All");
const [formData, setFormData] = useState(blankForm);
const [editingId, setEditingId] = useState(null);
const [selectedEntry, setSelectedEntry] = useState(null);
  
  useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}, [items]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.type === activeCategory;

      const searchableText = [
        item.type,
        item.name,
        item.module,
        item.summary,
        ...item.tags,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [items, searchTerm, activeCategory]);

  const categoryCounts = filteredItems.reduce((counts, item) => {
    counts[item.type] = (counts[item.type] || 0) + 1;
    return counts;
  }, {});

  const moduleOptions = useMemo(
    () =>
      items
        .filter((item) => item.type === "Module")
        .map((item) => item.name)
        .filter(Boolean)
        .sort((firstName, secondName) => firstName.localeCompare(secondName)),
    [items]
  );

  const availableModuleOptions =
    formData.module &&
    !moduleOptions.includes(formData.module) &&
    formData.type !== "Module"
      ? [formData.module, ...moduleOptions]
      : moduleOptions;

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

function handleAddEntry(event) {
  event.preventDefault();

  if (!formData.name.trim()) {
    window.alert("Please add a name for this entry.");
    return;
  }

  const entryData = {
  type: formData.type,
  name: formData.name.trim(),
  module:
    formData.type === "Module"
      ? formData.name.trim()
      : formData.module.trim() || "Unassigned Module",
  summary: formData.summary.trim() || "No summary added yet.",
  tags: formData.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),
};

if (formData.type === "Monster") {
  entryData.details = {
    size: formData.size,
    creatureType: formData.creatureType,
    alignment: formData.alignment,
    ac: formData.ac,
    hp: formData.hp,
    speed: formData.speed,
    cr: formData.cr,
    str: formData.str,
    dex: formData.dex,
    con: formData.con,
    int: formData.int,
    wis: formData.wis,
    cha: formData.cha,
    skills: formData.skills,
    languages: formData.languages,
    traits: formData.traits,
    actions: formData.actions,
  };
}

  if (editingId) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === editingId ? { ...item, ...entryData } : item
      )
    );

    setEditingId(null);
  } else {
    const newEntry = {
      id: `${formData.type.toLowerCase()}-${Date.now()}`,
      ...entryData,
    };

    setItems((currentItems) => [newEntry, ...currentItems]);
    setActiveCategory(newEntry.type);
  }

  setFormData(blankForm);
  setSearchTerm("");
}

  function handleDeleteEntry(entryId) {
  const confirmed = window.confirm("Delete this entry from your library?");

  if (!confirmed) {
    return;
  }

  setItems((currentItems) =>
    currentItems.filter((item) => item.id !== entryId)
  );

  if (selectedEntry?.id === entryId) {
    setSelectedEntry(null);
  }
}

function handleEditEntry(entry) {
  setEditingId(entry.id);
  setFormData({
    ...blankForm,
    type: entry.type,
    name: entry.name,
    module: entry.module,
    summary: entry.summary,
    tags: entry.tags.join(", "),
    size: entry.details?.size || "",
    creatureType: entry.details?.creatureType || "",
    alignment: entry.details?.alignment || "",
    ac: entry.details?.ac || "",
    hp: entry.details?.hp || "",
    speed: entry.details?.speed || "",
    cr: entry.details?.cr || "",
    str: entry.details?.str || "",
    dex: entry.details?.dex || "",
    con: entry.details?.con || "",
    int: entry.details?.int || "",
    wis: entry.details?.wis || "",
    cha: entry.details?.cha || "",
    skills: entry.details?.skills || "",
    languages: entry.details?.languages || "",
    traits: entry.details?.traits || "",
    actions: entry.details?.actions || "",
  });

  setActiveCategory(entry.type);
  setSearchTerm("");
}

function handleCancelEdit() {
  setEditingId(null);
  setFormData(blankForm);
}

function handleExportLibrary() {
  const exportData = {
    app: "WeBrew VTT",
    version: "0.1.0",
    exportedAt: new Date().toISOString(),
    items,
  };

  const fileData = JSON.stringify(exportData, null, 2);
  const blob = new Blob([fileData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "webrew-vtt-library.json";
  downloadLink.click();

  URL.revokeObjectURL(url);
}

function handleImportLibrary(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const importedData = JSON.parse(reader.result);

      const importedItems = Array.isArray(importedData)
        ? importedData
        : importedData.items;

      if (!Array.isArray(importedItems)) {
        window.alert("This JSON file does not contain a valid WeBrew library.");
        return;
      }

      const cleanedItems = importedItems.map((item) => ({
        id: item.id || `${item.type?.toLowerCase() || "entry"}-${Date.now()}`,
        type: item.type || "Item",
        name: item.name || "Unnamed Entry",
        module: item.module || "Imported Module",
        summary: item.summary || "No summary added yet.",
        tags: Array.isArray(item.tags) ? item.tags : [],
      }));

      setItems(cleanedItems);
      setActiveCategory("All");
      setSearchTerm("");
      setEditingId(null);
      setFormData(blankForm);

      window.alert("Library imported successfully.");
    } catch {
      window.alert("Could not read this JSON file.");
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}

function handleResetLibrary() {
  const confirmed = window.confirm(
    "Reset your library back to the sample WeBrew VTT entries? This will replace your current saved library."
  );

  if (!confirmed) {
    return;
  }

  setItems(libraryItems);
  setActiveCategory("All");
  setSearchTerm("");
  setEditingId(null);
  setFormData(blankForm);
}

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-mark">☕</span>
          <div>
            <h1>WeBrew VTT</h1>
            <p>Brew your world. Run your table.</p>
          </div>
        </div>

        <nav>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? "active-nav" : ""}
              onClick={() => setActiveCategory(category)}
            >
              {category === "All" ? "Dashboard" : `${category}s`}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <p className="eyebrow">Homebrew campaign command center</p>
          <h2>Build modules, organize sourcebooks, and run your virtual table.</h2>
          <p>
            WeBrew VTT helps Game Masters manage monsters, NPCs, locations, items,
            spells, tables, maps, and encounters in one searchable workspace.
          </p>

          <div className="search-box">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search monsters, NPCs, spells, maps, items..."
            />
            <button type="button" onClick={() => setSearchTerm("")}>
              Clear
            </button>
          </div>
          <div className="library-tools">
  <button type="button" onClick={handleExportLibrary}>
    Export Library JSON
  </button>

  <label className="import-button">
    Import Library JSON
    <input
      type="file"
      accept="application/json"
      onChange={handleImportLibrary}
    />
  </label>

  <button className="reset-library" type="button" onClick={handleResetLibrary}>
    Reset Sample Library
  </button>
</div>
        </section>

        <section className="entry-form-section">
          <div className="section-header">
           <h3>{editingId ? "Edit Entry" : "Add New Entry"}</h3>
<p>
  {editingId
    ? "Update this library card and save your changes."
    : "Create a quick library card for your homebrew content."}
</p>
          </div>

          <form className="entry-form" onSubmit={handleAddEntry}>
            <label>
              Type
              <select
                name="type"
                value={formData.type}
                onChange={handleFormChange}
              >
                {entryTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Name
              <input
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Example: Storm Drake"
              />
            </label>

            {formData.type !== "Module" && (
              <label>
                Module
                <select
                  name="module"
                  value={formData.module}
                  onChange={handleFormChange}
                >
                  <option value="">
                    {moduleOptions.length
                      ? "Choose a saved module"
                      : "Create a Module card first"}
                  </option>

                  {availableModuleOptions.map((moduleName) => (
                    <option key={moduleName} value={moduleName}>
                      {moduleName}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="full-width">
              Summary
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleFormChange}
                placeholder="Short description or rules summary..."
                rows="3"
              />
            </label>

            <label className="full-width">
  Tags
  <input
    name="tags"
    value={formData.tags}
    onChange={handleFormChange}
    placeholder="Example: dragon, flying, lightning, boss"
  />
</label>

{formData.type === "Monster" && (
  <div className="monster-details-form full-width">
    <div className="section-header">
      <h3>Monster Details</h3>
      <p>Add stat block information for creature cards.</p>
    </div>

    <label>
      Size
      <input
        name="size"
        value={formData.size}
        onChange={handleFormChange}
        placeholder="Medium"
      />
    </label>

    <label>
      Creature Type
      <input
        name="creatureType"
        value={formData.creatureType}
        onChange={handleFormChange}
        placeholder="Elemental"
      />
    </label>

    <label>
      Alignment
      <input
        name="alignment"
        value={formData.alignment}
        onChange={handleFormChange}
        placeholder="Neutral"
      />
    </label>

    <label>
      Armor Class
      <input
        name="ac"
        value={formData.ac}
        onChange={handleFormChange}
        placeholder="16"
      />
    </label>

    <label>
      Hit Points
      <input
        name="hp"
        value={formData.hp}
        onChange={handleFormChange}
        placeholder="66 (12d8 + 12)"
      />
    </label>

    <label>
      Speed
      <input
        name="speed"
        value={formData.speed}
        onChange={handleFormChange}
        placeholder="20 ft., fly 50 ft."
      />
    </label>

    <label>
      Challenge Rating
      <input
        name="cr"
        value={formData.cr}
        onChange={handleFormChange}
        placeholder="4"
      />
    </label>

    <label>
      STR
      <input
        name="str"
        value={formData.str}
        onChange={handleFormChange}
        placeholder="10"
      />
    </label>

    <label>
      DEX
      <input
        name="dex"
        value={formData.dex}
        onChange={handleFormChange}
        placeholder="16"
      />
    </label>

    <label>
      CON
      <input
        name="con"
        value={formData.con}
        onChange={handleFormChange}
        placeholder="12"
      />
    </label>

    <label>
      INT
      <input
        name="int"
        value={formData.int}
        onChange={handleFormChange}
        placeholder="13"
      />
    </label>

    <label>
      WIS
      <input
        name="wis"
        value={formData.wis}
        onChange={handleFormChange}
        placeholder="17"
      />
    </label>

    <label>
      CHA
      <input
        name="cha"
        value={formData.cha}
        onChange={handleFormChange}
        placeholder="12"
      />
    </label>

    <label className="full-width">
      Skills
      <input
        name="skills"
        value={formData.skills}
        onChange={handleFormChange}
        placeholder="Arcana +3, Nature +5, Perception +7"
      />
    </label>

    <label className="full-width">
      Languages
      <input
        name="languages"
        value={formData.languages}
        onChange={handleFormChange}
        placeholder="Aarakocra, Primordial (Auran)"
      />
    </label>

    <label className="full-width">
      Traits
      <textarea
        name="traits"
        value={formData.traits}
        onChange={handleFormChange}
        placeholder="Special traits, spellcasting, passive abilities..."
        rows="4"
      />
    </label>

    <label className="full-width">
      Actions
      <textarea
        name="actions"
        value={formData.actions}
        onChange={handleFormChange}
        placeholder="Multiattack. Wind Staff. +5 to hit..."
        rows="4"
      />
    </label>
  </div>
)}

<div className="form-actions">
  <button className="submit-entry" type="submit">
    {editingId ? "Save Changes" : "Add Entry"}
  </button>

  {editingId && (
    <button className="cancel-edit" type="button" onClick={handleCancelEdit}>
      Cancel Edit
    </button>
  )}
</div>
          </form>
        </section>

        <section className="card-grid">
          {Object.entries(categoryCounts).map(([type, count]) => (
            <article className="feature-card" key={type}>
              <h3>{type}s</h3>
              <p>
                {count} saved {count === 1 ? "entry" : "entries"} matching your
                search.
              </p>
            </article>
          ))}
        </section>

        <section className="library-list">
          <div className="section-header">
            <h3>
              {activeCategory === "All"
                ? "Library Preview"
                : `${activeCategory}s`}
            </h3>
            <p>
              Showing {filteredItems.length} of {items.length} saved entries.
            </p>
          </div>

          {filteredItems.length > 0 ? (
            <div className="library-grid">
              {filteredItems.map((item) => (
                <article className="library-card" key={item.id}>
                  <div className="library-card-header">
                    <span>{item.type}</span>
                    <small>{item.module}</small>
                  </div>

                  <h4>{item.name}</h4>
<p>{item.summary}</p>

{item.type === "Monster" && item.details && (
  <div className="mini-stat-block">
    <div className="mini-monster-line">
      <em>
        {item.details.size || "Unknown size"}{" "}
        {item.details.creatureType || "creature"},{" "}
        {item.details.alignment || "unaligned"}
      </em>
      {item.details.cr && <strong>CR {item.details.cr}</strong>}
    </div>

    <div className="mini-stat-row">
      {item.details.ac && <span>AC {item.details.ac}</span>}
      {item.details.hp && <span>HP {item.details.hp}</span>}
      {item.details.speed && <span>Speed {item.details.speed}</span>}
    </div>

    <div className="mini-ability-grid">
      <div>STR<br /><strong>{item.details.str || "-"}</strong></div>
      <div>DEX<br /><strong>{item.details.dex || "-"}</strong></div>
      <div>CON<br /><strong>{item.details.con || "-"}</strong></div>
      <div>INT<br /><strong>{item.details.int || "-"}</strong></div>
      <div>WIS<br /><strong>{item.details.wis || "-"}</strong></div>
      <div>CHA<br /><strong>{item.details.cha || "-"}</strong></div>
    </div>

    {item.details.skills && (
      <p><strong>Skills</strong> {item.details.skills}</p>
    )}

    {item.details.languages && (
      <p><strong>Languages</strong> {item.details.languages}</p>
    )}

    {item.details.traits && (
      <p><strong>Traits</strong> {item.details.traits}</p>
    )}

    {item.details.actions && (
      <p><strong>Actions</strong> {item.details.actions}</p>
    )}
  </div>
)}

<div className="tag-row">
  {item.tags.map((tag) => (
    <span key={tag}>{tag}</span>
  ))}
</div>
                 
                  <div className="card-actions">
  <button
    className="view-entry"
    type="button"
    onClick={() => setSelectedEntry(item)}
  >
    View
  </button>

  <button
    className="edit-entry"
    type="button"
    onClick={() => handleEditEntry(item)}
  >
    Edit
  </button>

  <button
    className="delete-entry"
    type="button"
    onClick={() => handleDeleteEntry(item.id)}
  >
    Delete
  </button>
</div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h4>No results found</h4>
              <p>
                Try clearing your search or choosing a different category from the
                sidebar.
              </p>
            </div>
          )}
        </section>

        {selectedEntry && (
  <section className="entry-detail-panel">
    <div className="entry-detail-header">
      <div>
        <p className="eyebrow">{selectedEntry.type}</p>
        <h3>{selectedEntry.name}</h3>
        <p>{selectedEntry.module}</p>
      </div>

      <button type="button" onClick={() => setSelectedEntry(null)}>
        Close
      </button>
    </div>

    <p className="entry-detail-summary">{selectedEntry.summary}</p>

    {selectedEntry.type === "Monster" && selectedEntry.details ? (
      <div className="full-stat-block">
        <div className="monster-header">
          <div>
            <h3>{selectedEntry.name}</h3>
            <p>
              {selectedEntry.details.size || "Unknown size"}{" "}
              {selectedEntry.details.creatureType || "creature"},{" "}
              {selectedEntry.details.alignment || "unaligned"}
            </p>
          </div>
          {selectedEntry.details.cr && <span>CR {selectedEntry.details.cr}</span>}
        </div>

        <div className="stats-row">
          {selectedEntry.details.ac && <strong>AC {selectedEntry.details.ac}</strong>}
          {selectedEntry.details.hp && <strong>HP {selectedEntry.details.hp}</strong>}
          {selectedEntry.details.speed && (
            <strong>Speed {selectedEntry.details.speed}</strong>
          )}
        </div>

        <div className="ability-grid">
          <div>
            STR
            <br />
            <strong>{selectedEntry.details.str || "-"}</strong>
          </div>
          <div>
            DEX
            <br />
            <strong>{selectedEntry.details.dex || "-"}</strong>
          </div>
          <div>
            CON
            <br />
            <strong>{selectedEntry.details.con || "-"}</strong>
          </div>
          <div>
            INT
            <br />
            <strong>{selectedEntry.details.int || "-"}</strong>
          </div>
          <div>
            WIS
            <br />
            <strong>{selectedEntry.details.wis || "-"}</strong>
          </div>
          <div>
            CHA
            <br />
            <strong>{selectedEntry.details.cha || "-"}</strong>
          </div>
        </div>

        {selectedEntry.details.skills && (
          <p>
            <strong>Skills</strong> {selectedEntry.details.skills}
          </p>
        )}

        {selectedEntry.details.languages && (
          <p>
            <strong>Languages</strong> {selectedEntry.details.languages}
          </p>
        )}

        {selectedEntry.details.traits && (
          <div className="rules-text">
            <h4>Traits</h4>
            <p>{selectedEntry.details.traits}</p>
          </div>
        )}

        {selectedEntry.details.actions && (
          <div className="rules-text">
            <h4>Actions</h4>
            <p>{selectedEntry.details.actions}</p>
          </div>
        )}
      </div>
    ) : (
      <div className="general-entry-detail">
        <h4>Details</h4>
        <p>{selectedEntry.summary}</p>
      </div>
    )}

    <div className="tag-row">
      {selectedEntry.tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  </section>
)}

        
      </main>
    </div>
  );
}

export default App;
