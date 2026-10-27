// Import React hooks and styles
import { useEffect, useMemo, useState } from 'react'
import './App.css'

// Categories available for closet items
const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories']
// Local storage key for persisting items
const STORAGE_KEY = 'digital-closet-items'

// Seed data shown on first load if nothing is saved
const STARTER_ITEMS = [
  { id: 1, name: 'White Tee', category: 'Tops', color: '#f5f5f4', images: [] },
  {
    id: 2,
    name: 'Denim Jacket',
    category: 'Outerwear',
    color: '#4a6fa5',
    images: [],
  },
  {
    id: 3,
    name: 'Black Jeans',
    category: 'Bottoms',
    color: '#2b2b30',
    images: [],
  },
  {
    id: 4,
    name: 'Running Shoes',
    category: 'Shoes',
    color: '#e07a5f',
    images: [],
  },
  {
    id: 5,
    name: 'Canvas Tote',
    category: 'Accessories',
    color: '#d9c2a3',
    images: [],
  },
]

// Get all photos for an item, supporting old single image format
function itemImages(item) {
  if (Array.isArray(item.images) && item.images.length > 0) return item.images
  return item.image ? [item.image] : []
}

// Normalize items to always use the images array (migrates old data)
function normalizeItem(item) {
  return {
    ...item,
    images: Array.isArray(item.images)
      ? item.images
      : item.image
        ? [item.image]
        : [],
  }
}

// Read multiple files and convert them to data URLs
function readImageFiles(files, onLoad) {
  const list = Array.from(files ?? [])
  if (list.length === 0) return

  // Read all files in parallel and return array of data URLs
  Promise.all(
    list.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.readAsDataURL(file)
        }),
    ),
  ).then(onLoad)
}

// Display selected photos with remove buttons
function PhotoStrip({ photos, onRemove }) {
  if (photos.length === 0) return null

  return (
    <div className="photo-strip">
      {photos.map((photo, index) => (
        <div className="photo-thumb" key={`${photo.slice(0, 40)}-${index}`}>
          <img src={photo} alt={`Photo ${index + 1}`} />
          <button
            type="button"
            className="thumb-remove"
            onClick={() => onRemove(index)}
            aria-label={`Remove photo ${index + 1}`}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}

// Draw category-specific placeholder shapes
function GarmentShape({ category, initial }) {
  const outline = {
    fill: 'var(--item-color)',
    stroke: 'rgba(0, 0, 0, 0.22)',
    strokeWidth: 2,
    strokeLinejoin: 'round',
  }
  const detail = {
    fill: 'none',
    stroke: 'rgba(255, 255, 255, 0.38)',
    strokeWidth: 2,
    strokeLinecap: 'round',
  }

  // First letter label for placeholder
  const label = (
    <text
      x="100"
      y="102"
      textAnchor="middle"
      fontSize="32"
      fontWeight="600"
      fill="#fff"
      opacity="0.85"
    >
      {initial}
    </text>
  )

  // Pants shape
  if (category === 'Bottoms') {
    return (
      <g>
        <path d="M72 38h56l10 86h-25l-9-54-9 54H70l2-86Z" {...outline} />
        <path d="M70 54h60" {...detail} />
        <path d="M100 54v22" {...detail} />
        {label}
      </g>
    )
  }

  // Jacket shape
  if (category === 'Outerwear') {
    return (
      <g>
        <path d="M100 40 76 28 50 52l14 17 10-8v62h52V61l10 8 14-17-26-24-24 12Z" {...outline} />
        <path d="M86 30 100 47l14-17" {...detail} />
        <path d="M100 47v74" stroke="rgba(0, 0, 0, 0.28)" strokeWidth="2" />
        <path d="M76 94h14M110 94h14" {...detail} />
        {label}
      </g>
    )
  }

  // Shoes shape
  if (category === 'Shoes') {
    return (
      <g>
        <path
          d="M38 104c0-6 5-10 11-10h20l16-16 9 11 30 5c16 3 26 11 26 21v9H46c-7 0-12-5-12-12l4-8Z"
          {...outline}
        />
        <path d="M36 116h128v10H36z" fill="rgba(0, 0, 0, 0.3)" />
        <path d="M70 106l12-12M84 108l12-12M98 110l10-9" {...detail} />
        <text
          x="100"
          y="123"
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="#fff"
          opacity="0.7"
        >
          {initial}
        </text>
      </g>
    )
  }

  // Bag/tote shape
  if (category === 'Accessories') {
    return (
      <g>
        <path d="M62 66h76l10 66H52l10-66Z" {...outline} />
        <path
          d="M78 66c0-16 8-24 22-24s22 8 22 24"
          fill="none"
          stroke="var(--item-color)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d="M62 84h76" {...detail} />
        {label}
      </g>
    )
  }

  // Default: shirt/tee shape
  return (
    <g>
      <path d="M100 40 76 28 50 52l14 17 10-8v62h52V61l10 8 14-17-26-24-24 12Z" {...outline} />
      <path d="M88 29c2 8 6 12 12 12s10-4 12-12" {...detail} />
      {label}
    </g>
  )
}

// Show uploaded photo or category-specific placeholder
function ItemPhoto({ item, className, src }) {
  const image = src ?? itemImages(item)[0]

  if (image) {
    return <img className={className} src={image} alt={item.name} />
  }

  return (
    <div className={`${className} placeholder`} style={{ '--item-color': item.color }}>
      <svg
        viewBox="0 0 200 160"
        role="img"
        aria-label={`${item.name} placeholder image`}
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="200" height="160" fill="var(--code-bg)" />
        <circle cx="162" cy="28" r="48" fill="var(--item-color)" opacity="0.14" />
        <GarmentShape
          category={item.category}
          initial={item.name.charAt(0).toUpperCase()}
        />
      </svg>
    </div>
  )
}

function App() {
  // Load items from localStorage or use starter data
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored).map(normalizeItem) : STARTER_ITEMS
    } catch {
      return STARTER_ITEMS
    }
  })
  // Filters and search
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  // Add form state
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('Tops')
  const [newColor, setNewColor] = useState('#aa3bff')
  const [newImages, setNewImages] = useState([])
  // Modal/view state
  const [selectedId, setSelectedId] = useState(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)

  // Weather widget state
  const [weather, setWeather] = useState(null)
  const [weatherCity, setWeatherCity] = useState('New York')
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')

  // Fetch weather from RapidAPI when city changes
  useEffect(() => {
    const key = import.meta.env.VITE_RAPIDAPI_KEY
    const host = import.meta.env.VITE_RAPIDAPI_HOST

    // Skip if env vars not configured
    if (!key || !host) return

    async function fetchWeather() {
      setWeatherLoading(true)
      setWeatherError('')
      try {
        const res = await fetch(
          `https://open-weather13.p.rapidapi.com/city?city=${encodeURIComponent(
            weatherCity,
          )}&lang=EN`,
          {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': key,
              'X-RapidAPI-Host': host,
            },
          },
        )

        if (!res.ok) throw new Error('Failed to fetch weather')
        const data = await res.json()
        setWeather(data)
      } catch {
        setWeatherError('Could not load weather')
      } finally {
        setWeatherLoading(false)
      }
    }

    fetchWeather()
  }, [weatherCity])

  // Persist items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore storage quota errors from large uploaded images.
    }
  }, [items])

  // Close modal with Escape key
  useEffect(() => {
    if (selectedId === null) return

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setSelectedId(null)
        setEditing(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId])

  // Filter items by category and search
  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return items.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category
      const matchesSearch = item.name.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [items, category, search])

  // Get selected item and its photos
  const selected = items.find((item) => item.id === selectedId)
  const selectedPhotos = selected ? itemImages(selected) : []

  // Create a new item (Create)
  function addItem(event) {
    event.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return

    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        name: trimmed,
        category: newCategory,
        color: newColor,
        images: newImages,
      },
    ])
    setNewName('')
    setNewImages([])
  }

  // Delete an item (Delete)
  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id))
    if (id === selectedId) {
      setSelectedId(null)
      setEditing(false)
    }
  }

  // Open item details (Read)
  function openItem(id) {
    setSelectedId(id)
    setPhotoIndex(0)
    setEditing(false)
  }

  // Close item details
  function closeItem() {
    setSelectedId(null)
    setPhotoIndex(0)
    setEditing(false)
  }

  // Start editing an item (Update)
  function startEdit(item) {
    setDraft({
      name: item.name,
      category: item.category,
      color: item.color,
      images: itemImages(item),
    })
    setPhotoIndex(0)
    setEditing(true)
  }

  // Save edited item (Update)
  function saveEdit(event) {
    event.preventDefault()
    if (!draft) return
    const trimmed = draft.name.trim()
    if (!trimmed) return

    setItems((current) =>
      current.map((item) =>
        item.id === selectedId
          ? { ...item, ...draft, name: trimmed, image: '' }
          : item,
      ),
    )
    setPhotoIndex(0)
    setEditing(false)
  }

  return (
    <main className="closet">
      {/* Header with title and weather widget */}
      <header className="closet-header">
        <div>
          <p className="eyebrow">Digital Closet</p>
          <h1>Your wardrobe, organized</h1>
          <p className="subtitle">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'} collected
          </p>
        </div>
        {/* Weather widget using RapidAPI */}
        <div className="weather-widget">
          <div className="weather-top">
            <input
              className="weather-city"
              value={weatherCity}
              onChange={(event) => setWeatherCity(event.target.value)}
              aria-label="Weather city"
              placeholder="City"
            />
          </div>
          {weatherLoading && <p className="weather-text">Loading...</p>}
          {weatherError && <p className="weather-text weather-error">{weatherError}</p>}
          {weather && !weatherLoading && !weatherError && (
            <p className="weather-text">
              {Math.round(weather.main?.temp)}°F • {weather.weather?.[0]?.description}
            </p>
          )}
        </div>
      </header>

      {/* Add new item form (Create) */}
      <form className="add-form" onSubmit={addItem}>
        <input
          type="text"
          placeholder="Item name"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          aria-label="Item name"
        />
        <select
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          aria-label="Category"
        >
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          type="color"
          value={newColor}
          onChange={(event) => setNewColor(event.target.value)}
          aria-label="Item color"
        />
        {/* Photo upload from device */}
        <div className="photo-field">
          <label className="file-btn">
            Add from photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                readImageFiles(event.target.files, (images) =>
                  setNewImages((current) => [...current, ...images]),
                )
                event.target.value = ''
              }}
            />
          </label>
          <span className="photo-hint">Choose from your device</span>
          <PhotoStrip
            photos={newImages}
            onRemove={(index) =>
              setNewImages((current) => current.filter((_, i) => i !== index))
            }
          />
        </div>
        <button type="submit" className="primary" disabled={!newName.trim()}>
          Add item
        </button>
      </form>

      {/* Filter and search toolbar */}
      <div className="toolbar">
        <div className="filters">
          {['All', ...CATEGORIES].map((option) => (
            <button
              key={option}
              type="button"
              className={category === option ? 'filter active' : 'filter'}
              onClick={() => setCategory(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search closet"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search closet"
        />
      </div>

      {/* Grid of items (Read) */}
      {visibleItems.length === 0 ? (
        <p className="empty">No items match your search.</p>
      ) : (
        <ul className="grid">
          {visibleItems.map((item) => (
            <li key={item.id} className="card">
              <button
                type="button"
                className="card-open"
                onClick={() => openItem(item.id)}
                aria-label={`View ${item.name}`}
              >
                <ItemPhoto item={item} className="card-photo" />
                <div className="card-body">
                  <h2>{item.name}</h2>
                  <p>{item.category}</p>
                </div>
              </button>
              <button
                type="button"
                className="remove"
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Detail/Edit modal */}
      {selected && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeItem()
          }}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-label={selected.name}>
            <button type="button" className="modal-close" onClick={closeItem}>
              Close
            </button>

            {editing && draft ? (
              // Edit form (Update)
              <form className="edit-form" onSubmit={saveEdit}>
                <div className="edit-photo">
                  <ItemPhoto
                    item={{
                      ...selected,
                      name: draft.name || selected.name,
                      category: draft.category,
                      color: draft.color,
                      images: draft.images,
                      image: '',
                    }}
                    src={draft.images[0]}
                    className="edit-preview"
                  />
                  <PhotoStrip
                    photos={draft.images}
                    onRemove={(index) =>
                      setDraft((current) => ({
                        ...current,
                        images: current.images.filter((_, i) => i !== index),
                      }))
                    }
                  />
                  <div className="edit-photo-actions">
                    <label className="file-btn">
                      Add from photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => {
                          readImageFiles(event.target.files, (images) =>
                            setDraft((current) => ({
                              ...current,
                              images: [...current.images, ...images],
                            })),
                          )
                          event.target.value = ''
                        }}
                      />
                    </label>
                    {draft.images.length > 0 && (
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() =>
                          setDraft((current) => ({ ...current, images: [] }))
                        }
                      >
                        Remove all photos
                      </button>
                    )}
                  </div>
                </div>

                <label className="field">
                  Name
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  Category
                  <select
                    value={draft.category}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, category: event.target.value }))
                    }
                  >
                    {CATEGORIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Color
                  <input
                    type="color"
                    value={draft.color}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, color: event.target.value }))
                    }
                  />
                </label>

                <div className="edit-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary" disabled={!draft.name.trim()}>
                    Save changes
                  </button>
                </div>
              </form>
            ) : (
              // Item detail view (Read)
              <div className="modal-body">
                <ItemPhoto
                  item={selected}
                  src={selectedPhotos[photoIndex]}
                  className="modal-photo"
                />
                {/* Photo gallery thumbnails */}
                {selectedPhotos.length > 1 && (
                  <div className="gallery-thumbs">
                    {selectedPhotos.map((photo, index) => (
                      <button
                        key={`${photo.slice(0, 40)}-${index}`}
                        type="button"
                        className={index === photoIndex ? 'gallery-thumb active' : 'gallery-thumb'}
                        onClick={() => setPhotoIndex(index)}
                        aria-label={`View photo ${index + 1}`}
                      >
                        <img src={photo} alt="" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="modal-info">
                  <p className="eyebrow">{selected.category}</p>
                  <h2>{selected.name}</h2>
                  <p className="modal-color">
                    <span
                      className="color-dot"
                      style={{ background: selected.color }}
                      aria-hidden="true"
                    />
                    {selected.color}
                  </p>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="primary"
                      onClick={() => startEdit(selected)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => removeItem(selected.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default App
