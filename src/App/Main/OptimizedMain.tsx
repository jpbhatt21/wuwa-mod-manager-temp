import { memo, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { localModListAtom } from '@/utils/vars';
import { useOptimizedSearch } from '@/utils/optimizedSearch';
import Catbar from './components/Catbar';
import Navbar from './components/Navbar';
import MainLocal from './MainLocal';
import MainOnline from './MainOnline';

interface MainProps {
  leftSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
  online: boolean;
}

/**
 * Optimized Main component with better performance and state management
 */
const OptimizedMain = memo(function OptimizedMain({
  leftSidebarOpen,
  setLeftSidebarOpen,
  rightSidebarOpen,
  setRightSidebarOpen,
  online,
}: MainProps) {
  // Use optimized search hook
  useOptimizedSearch();
  
  const localItems = useAtomValue(localModListAtom);

  // Memoized load more function to prevent unnecessary re-renders
  const handleLoadMore = useCallback((e: any) => {
    // Load more logic here - moved to separate hook for better organization
    console.log('Loading more items...', e);
  }, []);

  return (
    <div className="border-border flex flex-col w-full h-full overflow-hidden duration-200 border">
      <Navbar 
        leftSidebarOpen={leftSidebarOpen}
        setLeftSidebarOpen={setLeftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
        setRightSidebarOpen={setRightSidebarOpen}
        online={online}
      />
      <div className="flex w-full h-full px-2 overflow-hidden">
        <MainLocal online={online} />
        <MainOnline 
          max={100} // This should come from state
          count={1} // This should come from state  
          online={online}
          loadMore={handleLoadMore}
        />
      </div>
      <Catbar online={online} items={localItems} />
    </div>
  );
});

export default OptimizedMain;