import { useState, useRef, useEffect } from 'react';
import { geocodeSearch } from '../services/mapbox';
import styles from './TopBar.module.css';

export default function TopBar({ weather, userCoords, onDestinationSelect, onSettingsOpen, isOnline }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);

  const runSearch = async (rawQuery) => {
    const val = rawQuery.trim();
    if (!val) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearching(false);
      setSearchError('');
      setActiveIndex(-1);
      return;
    }

    setSearching(true);
    setSearchError('');

    try {
      const results = await geocodeSearch(val, userCoords ? [userCoords.lng, userCoords.lat] : null);
      setSuggestions(results);
      setShowSuggestions(true);
      setActiveIndex(results.length > 0 ? 0 : -1);
      if (results.length === 0) {
        setSearchError('No matching places found. Try a fuller address, landmark, or coordinates like 28.6139, 77.2090.');
      }
    } catch (error) {
      setSuggestions([]);
      setShowSuggestions(true);
      setActiveIndex(-1);
      setSearchError(error.message || 'Location search failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSearchError('');
    setActiveIndex(-1);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      runSearch(val);
    }, 280);
  };

  const handleSelect = (place) => {
    setQuery(place.place_name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError('');
    setActiveIndex(-1);
    onDestinationSelect(place);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((prev) => {
        if (suggestions.length === 0) return -1;
        return prev >= suggestions.length - 1 ? 0 : prev + 1;
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => {
        if (suggestions.length === 0) return -1;
        return prev <= 0 ? suggestions.length - 1 : prev - 1;
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
        return;
      }
      runSearch(query);
      return;
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className={styles.brandName}>SafeRoute</span>
      </div>

      <div className={`${styles.searchWrap} glass`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          className={styles.searchInput}
          type="text"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => (suggestions.length > 0 || searchError) && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search any place, address, landmark, or coordinates..."
        />
        {searching && <div className={styles.spinner} />}
        {showSuggestions && (
          <ul className={`${styles.suggestions} glass`}>
            {suggestions.map((s, index) => (
              <li
                key={s.id}
                className={`${styles.suggestion} ${index === activeIndex ? styles.suggestionActive : ''}`}
                onMouseDown={() => handleSelect(s)}
              >
                <div className={styles.suggestionIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div className={styles.suggestionContent}>
                  <div className={styles.suggestionName}>{s.name}</div>
                  <div className={styles.suggestionAddr}>{s.place_name}</div>
                </div>
                <div className={styles.suggestionMeta}>{s.category}</div>
              </li>
            ))}
            {!searching && searchError && (
              <li className={styles.searchFeedback}>{searchError}</li>
            )}
            {!searching && !searchError && suggestions.length > 0 && (
              <li className={styles.searchHint}>Press Enter to route or use arrow keys to choose a place.</li>
            )}
          </ul>
        )}
      </div>

      <div className={styles.right}>
        {weather && (
          <div className={styles.weatherBadge}>
            <span className={styles.temp}>{weather.temp}°C</span>
            <span className={styles.weatherDesc}>{weather.description}</span>
            {weather.demoMode && <span className={styles.demoBadge}>DEMO</span>}
          </div>
        )}
        <div className={`${styles.statusPill} glass`}>
          <span className={`${styles.dot} ${isOnline ? styles.online : styles.offline}`} />
          <span>{isOnline ? 'LIVE' : 'OFFLINE'}</span>
        </div>
        <button className={styles.iconBtn} onClick={onSettingsOpen} title="Settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
