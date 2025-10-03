import { useEffect, useRef, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { 
  localModListAtom, 
  localFilteredModListAtom, 
  localSearchTermAtom,
  localCategoryNameAtom,
  localFilterNameAtom 
} from '@/utils/vars';
import { LocalMod } from '@/utils/types';
import { useDebouncedValue } from './commonHooks';
import MiniSearch from 'minisearch';

/**
 * Optimized search hook that maintains search index and handles debouncing
 */
export function useOptimizedSearch() {
  const localItems = useAtomValue(localModListAtom);
  const localSelectedCategory = useAtomValue(localCategoryNameAtom);
  const localFilter = useAtomValue(localFilterNameAtom);
  const searchTerm = useAtomValue(localSearchTermAtom);
  const setLocalFilteredItems = useSetAtom(localFilteredModListAtom);
  
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const searchDBRef = useRef<MiniSearch<LocalMod> | null>(null);

  // Memoize filtered items before search
  const filteredItems = useMemo(() => {
    return localItems.filter(
      (item) =>
        (localSelectedCategory === "All" ? true : item.path.startsWith("\\" + localSelectedCategory)) &&
        (localFilter === "All" ||
          (localFilter === "Enabled" && item.enabled) ||
          (localFilter === "Disabled" && !item.enabled))
    );
  }, [localItems, localSelectedCategory, localFilter]);

  // Initialize or update search index
  useEffect(() => {
    if (filteredItems.length === 0) return;

    if (!searchDBRef.current) {
      searchDBRef.current = new MiniSearch({
        idField: "truePath",
        fields: ["name", "truePath"],
        storeFields: Object.keys(filteredItems[0]),
        searchOptions: { prefix: true, fuzzy: 0.2 },
      });
    }

    // Efficiently update index
    searchDBRef.current.removeAll();
    searchDBRef.current.addAll(filteredItems);
  }, [filteredItems]);

  // Apply search with debounced term
  useEffect(() => {
    if (!searchDBRef.current) {
      setLocalFilteredItems(filteredItems);
      return;
    }

    if (debouncedSearchTerm.trim() === "") {
      setLocalFilteredItems(filteredItems);
    } else {
      const results = searchDBRef.current.search(debouncedSearchTerm);
      setLocalFilteredItems(results as unknown as LocalMod[]);
    }
  }, [debouncedSearchTerm, filteredItems, setLocalFilteredItems]);

  return {
    searchTerm: debouncedSearchTerm,
    isSearching: debouncedSearchTerm.trim() !== "",
    filteredItemsCount: filteredItems.length
  };
}