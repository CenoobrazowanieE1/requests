import React, { useState, useEffect, useRef, useMemo } from "react";
import MiniSearch from "minisearch";
import { ref, onValue } from "firebase/database";
import { database } from "./firebase";
import debounce from "lodash.debounce";
import localforage from "localforage";
import "./AutoComplete.css";

const AutoComplete = ({ value, onChange, onSelect }) => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [miniSearch, setMiniSearch] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [copyAlert, setCopyAlert] = useState(false);
  const containerRef = useRef(null);
  const suggestionRefs = useRef([]);

  useEffect(() => {
    const initializeSearch = (items) => {
      const uniqueItems = [];
      const itemIds = new Set();

      items.forEach((item) => {
        if (!itemIds.has(item.id)) {
          uniqueItems.push(item);
          itemIds.add(item.id);
        }
      });

      const ms = new MiniSearch({
        fields: ["name", "group3", "code"],
        storeFields: ["name", "baseUnit", "code", "variation", "group3"],
        searchOptions: {
          boost: { name: 3, group3: 4 },
          prefix: true,
          fuzzy: 0.4,
          tokenize: (text) => text.split(/\s+/),
        },
      });
      ms.addAll(uniqueItems);
      setMiniSearch(ms);
      setInitialized(true);
    };

    const updateCacheAndInitialize = async (items) => {
      await localforage.setItem("items", items);
      await localforage.setItem("itemsCount", items.length);
      initializeSearch(items);
    };

    const fetchItemsFromFirebase = async () => {
      const itemsRef = ref(database, "items");
      onValue(itemsRef, async (snapshot) => {
        const itemsData = snapshot.val();
        if (itemsData) {
          const itemsArray = Object.keys(itemsData).map((key) => ({
            id: key,
            ...itemsData[key],
          }));
          if (!cacheLoaded) {
            updateCacheAndInitialize(itemsArray);
          } else {
            await localforage.setItem("items", itemsArray);
            await localforage.setItem("itemsCount", itemsArray.length);
          }
        }
      });
    };

    const loadItemsFromCache = async () => {
      const cachedItems = await localforage.getItem("items");
      if (cachedItems) {
        initializeSearch(cachedItems);
        setCacheLoaded(true);
      }
    };

    const initializeComponent = async () => {
      await loadItemsFromCache();
      fetchItemsFromFirebase();
    };

    initializeComponent();
  }, [cacheLoaded]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadSuggestions = useMemo(
    () =>
      debounce((searchTerm) => {
        if (miniSearch) {
          const results = miniSearch.search(searchTerm, {
            prefix: true,
            fuzzy: 0.2,
          });
          setSuggestions(results.slice(0, 30));
        }
      }, 300),
    [miniSearch]
  );

  useEffect(() => {
    if (search && initialized) {
      loadSuggestions(search);
    } else {
      setSuggestions([]);
    }
  }, [search, loadSuggestions, initialized]);

  const handleSelect = (item) => {
    onChange(item.name);
    onSelect(item);
    setSuggestions([]);
  };

  const highlightMatches = (text, query) => {
    return highlightMatch(text, query);
  };

  const highlightMatch = (text, searchTerm) => {
    if (!text) return text; // Check if text is undefined or null
    const searchWords = searchTerm.split(/\s+/);
    const escapedSearchWords = searchWords.map((word) =>
      word.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&")
    );

    const regex = new RegExp("(" + escapedSearchWords.join("|") + ")", "gi");

    return text.replace(regex, (match) => `<mark>${match}</mark>`);
  };

  const capitalizeWords = (input) => {
    const forbiddenChars = /[\\:?<>|"%&@;#!№²]/g;
    const originalValue = input.trim();

    if (originalValue.length === 0) {
      return input;
    }

    const sanitizedValue = originalValue.replace(forbiddenChars, "");

    const words = sanitizedValue.split(/\s+/);
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);

    const replacedValue = words.join(" ").replace(/(\d)х(\d)/g, "$1x$2");

    const trailingSpace = input.endsWith(" ") ? " " : "";

    return (
      replacedValue.replace(/\s(?=\S)/g, " ").replace(/\*/g, "x") +
      trailingSpace
    );
  };

  const handleBlur = () => {
    const finalValue = capitalizeWords(value);
    onChange(finalValue.trim());
  };

  const handleFocus = () => {
    if (search && initialized) {
      loadSuggestions(search);
    }
  };

  const handleCodeClick = (event, code) => {
    event.stopPropagation(); // Prevent triggering handleSelect
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopyAlert(true);
        setTimeout(() => setCopyAlert(false), 2000); // Hide alert after 2 seconds
        console.log(`Код ${code} скопирован в буфер обмена`);
      });
    }
  };

  useEffect(() => {
    const currentRefs = suggestionRefs.current;
    currentRefs.forEach((ref, index) => {
      if (ref) {
        const codeElement = ref.querySelector(".list-code");
        const code = suggestions[index]?.code;
        if (codeElement) {
          codeElement.addEventListener("click", (event) =>
            handleCodeClick(event, code)
          );
        }
      }
    });

    // Cleanup event listeners on unmount
    return () => {
      currentRefs.forEach((ref) => {
        if (ref) {
          const codeElement = ref.querySelector(".list-code");
          if (codeElement) {
            codeElement.removeEventListener("click", handleCodeClick);
          }
        }
      });
    };
  }, [suggestions]);

  return (
    <div className="autocomplete-container" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const newValue = capitalizeWords(e.target.value);
          onChange(newValue);
          setSearch(newValue);
        }}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder="Введите наименование или код"
        className="autocomplete-input"
      />
      {copyAlert && <div className="copy-alert">Код скопирован!</div>}
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((item, index) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              className="suggestion-item"
              ref={(el) => (suggestionRefs.current[index] = el)}
              dangerouslySetInnerHTML={{
                __html: `
                  <div class="suggestion-title">${highlightMatches(
                    item.name,
                    search
                  )}</div>
                  <div class="suggestion-details">
                    <small>Вариант исполнения: ${highlightMatches(
                      item.variation,
                      search
                    )}</small> <br />
                    <small class="list-code">Код: ${highlightMatches(
                      item.code ? item.code.toString() : "",
                      search
                    )}</small>
                  </div>
                `,
              }}
            ></li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutoComplete;
