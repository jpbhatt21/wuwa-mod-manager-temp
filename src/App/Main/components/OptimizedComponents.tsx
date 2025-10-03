import { memo } from 'react';
import { useAtomValue } from 'jotai';
import { localSearchTermAtom } from '@/utils/vars';
import { useDebouncedValue } from '@/utils/commonHooks';

/**
 * Optimized search hook with debouncing
 */
export function useSearchDebounce(delay = 300) {
  const searchTerm = useAtomValue(localSearchTermAtom);
  return useDebouncedValue(searchTerm, delay);
}

/**
 * Memoized search results component
 */
export interface SearchResultsProps {
  results: any[];
  onItemSelect: (item: any) => void;
  selectedIndex: number;
}

export const SearchResults = memo(function SearchResults({ 
  results, 
  onItemSelect, 
  selectedIndex 
}: SearchResultsProps) {
  return (
    <div className="search-results">
      {results.map((item, index) => (
        <div
          key={item.truePath || item.id}
          className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
          onClick={() => onItemSelect(item)}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
});

/**
 * Memoized pagination component
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  loading = false
}: PaginationProps) {
  return (
    <div className="pagination">
      <button
        disabled={currentPage <= 1 || loading}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      <span>{currentPage} / {totalPages}</span>
      <button
        disabled={currentPage >= totalPages || loading}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
});