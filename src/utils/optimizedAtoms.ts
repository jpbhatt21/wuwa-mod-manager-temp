import { selectAtom } from 'jotai/utils';
import { 
  localDataAtom, 
  localModListAtom, 
  onlineDataAtom,
  settingsDataAtom 
} from './vars';

/**
 * Optimized selectors to prevent unnecessary re-renders
 */

// Select only enabled mods
export const enabledModsAtom = selectAtom(
  localModListAtom,
  (mods) => mods.filter(mod => mod.enabled)
);

// Select only disabled mods  
export const disabledModsAtom = selectAtom(
  localModListAtom,
  (mods) => mods.filter(mod => !mod.enabled)
);

// Select mod count
export const modCountAtom = selectAtom(
  localModListAtom,
  (mods) => mods.length
);

// Select only hotkey settings from settings
export const hotkeySettingsAtom = selectAtom(
  settingsDataAtom,
  (settings) => settings?.hotKeys || {}
);

// Select UI preferences from settings
export const uiPreferencesAtom = selectAtom(
  settingsDataAtom,
  (settings) => ({
    theme: settings?.bgType || 0,
    opacity: settings?.opacity || 1,
    listType: settings?.listType || 0
  })
);

// Select download-related data
export const downloadDataAtom = selectAtom(
  localDataAtom,
  (data) => {
    const downloadItems = Object.entries(data).filter(([, item]) => 
      item.source && item.updatedAt
    );
    return Object.fromEntries(downloadItems);
  }
);

// Select online banner data specifically
export const bannerDataAtom = selectAtom(
  onlineDataAtom,
  (data) => data.banner || []
);

// Select categories with item counts
export const categoriesWithCountAtom = selectAtom(
  localModListAtom,
  (mods) => {
    const categories = new Map<string, number>();
    categories.set('All', mods.length);
    
    mods.forEach(mod => {
      const category = mod.path.split('\\')[1] || 'Unknown';
      categories.set(category, (categories.get(category) || 0) + 1);
    });
    
    return Array.from(categories.entries()).map(([name, count]) => ({
      name,
      count,
      enabled: mods.filter(m => 
        (name === 'All' || m.path.startsWith('\\' + name)) && m.enabled
      ).length
    }));
  }
);