import { invoke } from '@tauri-apps/api/core';

/**
 * Hotreload functionality utilities
 * Provides interface to control automatic F10 key pressing when game window is focused
 */

/**
 * Enable or disable hotreload functionality
 * @param enabled - Whether to enable hotreload
 */
export async function setHotreload(enabled: boolean): Promise<void> {
  try {
    await invoke('set_hotreload', { enabled });
    if(enabled)
        await startWindowMonitoring();
    else
        await stopWindowMonitoring();
    // //console.log(`Hotreload ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Failed to set hotreload:', error);
    throw error;
  }
}

/**
 * Get the current hotreload state
 * @returns Promise resolving to hotreload enabled state
 */
export async function getHotreload(): Promise<boolean> {
  try {
    return await invoke<boolean>('get_hotreload');
  } catch (error) {
    console.error('Failed to get hotreload state:', error);
    return false;
  }
}

/**
 * Start monitoring focused windows for game detection
 */
export async function startWindowMonitoring(): Promise<void> {
  try {
    await invoke('start_window_monitoring');
    //console.log('Window monitoring started');
  } catch (error) {
    console.error('Failed to start window monitoring:', error);
    throw error;
  }
}

/**
 * Stop monitoring focused windows
 */
export async function stopWindowMonitoring(): Promise<void> {
  try {
    await invoke('stop_window_monitoring');
    //console.log('Window monitoring stopped');
  } catch (error) {
    console.error('Failed to stop window monitoring:', error);
    throw error;
  }
}

/**
 * Get information about the currently focused window (for debugging)
 * @returns Promise resolving to window information string
 */
export async function getFocusedWindowInfo(): Promise<string> {
  try {
    return await invoke<string>('get_focused_window_info');
  } catch (error) {
    console.error('Failed to get focused window info:', error);
    return 'Error getting window info';
  }
}

/**
 * Test F10 key sending functionality (for debugging)
 */
export async function testF10Key(): Promise<void> {
  try {
    await invoke('test_f10_key');
    //console.log('F10 key test executed');
  } catch (error) {
    console.error('Failed to test F10 key:', error);
    throw error;
  }
}

/**
 * Test F10 key sending with detailed method results (for debugging)
 */
export async function testF10KeyDetailed(): Promise<string> {
  try {
    const result = await invoke<string>('test_f10_key_detailed');
    //console.log('F10 detailed test results:', result);
    return result;
  } catch (error) {
    console.error('Failed to test F10 key (detailed):', error);
    throw error;
  }
}

/**
 * Set the change trigger state
 * @param trigger - Whether to enable the change trigger
 */
export async function setChange(trigger=true): Promise<void> {
  try {
    await invoke('set_change', { trigger });
    //console.log(`Change trigger set to: ${trigger}`);
  } catch (error) {
    console.error('Failed to set change trigger:', error);
    throw error;
  }
}

/**
 * Get the current change trigger state
 * @returns Promise resolving to change trigger state
 */
export async function getChange(): Promise<boolean> {
  try {
    return await invoke<boolean>('get_change');
  } catch (error) {
    console.error('Failed to get change trigger state:', error);
    return false;
  }
}

/**
 * Trigger a change (set change to true)
 * This will cause F10 to be sent on the next game window focus
 */
export async function triggerChange(): Promise<void> {
  try {
    await invoke('trigger_change');
    //console.log('Change triggered - F10 will be sent on next game window focus');
  } catch (error) {
    console.error('Failed to trigger change:', error);
    throw error;
  }
}

/**
 * Set the F10 method selection (0-5)
 * @param method - Method to use (0=hardware, 1=sendinput, 2=postmessage, 3=extended, 4=legacy, 5=all)
 */
export async function setF10Method(method: number): Promise<void> {
  try {
    await invoke('set_f10_method', { method });
    //console.log(`F10 method set to: ${method}`);
  } catch (error) {
    console.error('Failed to set F10 method:', error);
    throw error;
  }
}

/**
 * Get the current F10 method selection
 * @returns Promise resolving to method number (0-5)
 */
export async function getF10Method(): Promise<number> {
  try {
    return await invoke<number>('get_f10_method');
  } catch (error) {
    console.error('Failed to get F10 method:', error);
    return 5; // Default to all methods
  }
}

/**
 * Get the F10 method name for display
 * @returns Promise resolving to method name string
 */
export async function getF10MethodName(): Promise<string> {
  try {
    return await invoke<string>('get_f10_method_name');
  } catch (error) {
    console.error('Failed to get F10 method name:', error);
    return 'Unknown';
  }
}

/**
 * Complete hotreload setup - enables hotreload and starts monitoring
 */
export async function enableHotreload(): Promise<void> {
  try {
    await setHotreload(true);
    await startWindowMonitoring();
    //console.log('Hotreload fully enabled and monitoring started');
  } catch (error) {
    console.error('Failed to enable hotreload:', error);
    throw error;
  }
}

/**
 * Complete hotreload teardown - disables hotreload and stops monitoring
 */
export async function disableHotreload(): Promise<void> {
  try {
    await setHotreload(false);
    await stopWindowMonitoring();
    //console.log('Hotreload fully disabled and monitoring stopped');
  } catch (error) {
    console.error('Failed to disable hotreload:', error);
    throw error;
  }
}

/**
 * Toggle hotreload state
 * @returns Promise resolving to new hotreload state
 */
export async function toggleHotreload(): Promise<boolean> {
  try {
    const currentState = await getHotreload();
    const newState = !currentState;
    
    if (newState) {
      await enableHotreload();
    } else {
      await disableHotreload();
    }
    
    return newState;
  } catch (error) {
    console.error('Failed to toggle hotreload:', error);
    throw error;
  }
}

/**
 * Get detailed hotreload status including monitoring state
 */
export async function getHotreloadStatus(): Promise<{
  enabled: boolean;
  windowInfo: string;
  isWindows: boolean;
}> {
  try {
    const enabled = await getHotreload();
    let windowInfo = '';
    let isWindows = true;
    
    try {
      windowInfo = await getFocusedWindowInfo();
    } catch (error) {
      isWindows = false;
      windowInfo = 'Not available (Windows only)';
    }
    
    return {
      enabled,
      windowInfo,
      isWindows
    };
  } catch (error) {
    console.error('Failed to get hotreload status:', error);
    return {
      enabled: false,
      windowInfo: 'Error getting status',
      isWindows: false
    };
  }
}

/**
 * React hook for hotreload management
 */
export function useHotreload() {
  return {
    setHotreload,
    getHotreload,
    startWindowMonitoring,
    stopWindowMonitoring,
    getFocusedWindowInfo,
    testF10Key,
    testF10KeyDetailed,
    setF10Method,
    getF10Method,
    getF10MethodName,
    enableHotreload,
    disableHotreload,
    toggleHotreload,
    getHotreloadStatus
  };
}

/**
 * Initialize hotreload system - call this during app startup
 */
// export async function initializeHotreload(value: boolean): Promise<void> {
//   try {
//     // Check if we're on Windows
//     const status = await getHotreloadStatus();
    
//     if (!status.isWindows) {
//       //console.log('Hotreload is only supported on Windows - skipping initialization');
//       return;
//     }
    
//     // Start monitoring (but don't enable hotreload by default)
//     // triggerChange()
//     // setChange(true)
    
//     // await startWindowMonitoring();
//     //console.log('Hotreload system initialized - monitoring started');
//   } catch (error) {
//     console.error('Failed to initialize hotreload system:', error);
//   }
// }