// import { invoke } from '@tauri-apps/api/core';
// import { listen } from '@tauri-apps/api/event';

// /**
//  * Session management utility for handling download cancellation on refresh
//  */

// let currentSessionId: number | null = null;

// /**
//  * Get the current session ID from Rust backend
//  */
// export async function getCurrentSessionId(): Promise<number> {
//   try {
//     const sessionId = await invoke<number>('get_session_id');
//     currentSessionId = sessionId;
//     return sessionId;
//   } catch (error) {
//     console.error('Failed to get session ID:', error);
//     return 0;
//   }
// }

// /**
//  * Get username and trigger session change
//  * This will increment the session ID and cancel any ongoing downloads
//  */
// export async function getUsernameAndTriggerSessionChange(): Promise<string> {
//   try {
//     const username = await invoke<string>('get_username');
//     // Session ID is automatically incremented in the backend
//     const newSessionId = await getCurrentSessionId();
//     console.log(`Session changed to ID: ${newSessionId}, Username: ${username}`);
//     return username;
//   } catch (error) {
//     console.error('Failed to get username:', error);
//     return 'Unknown';
//   }
// }

// /**
//  * Check if the session has changed since last check
//  */
// export async function hasSessionChanged(): Promise<boolean> {
//   const latestSessionId = await getCurrentSessionId();
//   if (currentSessionId === null) {
//     currentSessionId = latestSessionId;
//     return false;
//   }
  
//   const changed = latestSessionId !== currentSessionId;
//   if (changed) {
//     console.log(`Session changed from ${currentSessionId} to ${latestSessionId}`);
//     currentSessionId = latestSessionId;
//   }
  
//   return changed;
// }

// /**
//  * Initialize session tracking with event listeners
//  */
// export function initializeSessionTracking() {
//   // Listen for download progress events
//   listen<number>('download-progress', (event) => {
//     console.log(`Download progress: ${event.payload.toFixed(1)}%`);
//   });

//   // Listen for download completion events
//   listen<string>('fin', (event) => {
//     console.log(`Download completed: ${event.payload}`);
//   });

//   // Get initial session ID
//   getCurrentSessionId().then(sessionId => {
//     console.log(`Initial session ID: ${sessionId}`);
//   });
// }

// /**
//  * Display user feedback for download cancellation
//  */
// export function showDownloadCancelledMessage(fileName?: string) {
//   const message = fileName 
//     ? `Download of "${fileName}" was cancelled due to page refresh/session change.`
//     : 'Download was cancelled due to page refresh/session change.';
  
//   console.warn(message);
  
//   // You can customize this to show a toast notification or other UI feedback
//   // For example, if you're using a notification library:
//   // toast.warning(message);
// }

// /**
//  * Utility to start a download with session tracking
//  */
// export async function startDownloadWithSessionTracking(
//   fileName: string,
//   downloadUrl: string,
//   savePath: string,
//   emit: boolean = true
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     const sessionId = await getCurrentSessionId();
//     console.log(`Starting download in session ${sessionId}: ${fileName}`);
    
//     await invoke('download_and_unzip', {
//       fileName,
//       downloadUrl,
//       savePath,
//       emit
//     });
    
//     return { success: true };
//   } catch (error) {
//     const errorMessage = error as string;
    
//     // Check if the error is due to session change
//     if (errorMessage.includes('session change')) {
//       console.warn('Download cancelled due to session change:', errorMessage);
//       showDownloadCancelledMessage(fileName);
//       return { success: false, error: 'CANCELLED_SESSION_CHANGE' };
//     }
    
//     console.error('Download failed:', errorMessage);
//     return { success: false, error: errorMessage };
//   }
// }

// /**
//  * Hook for React components to track session changes
//  */
// export function useSessionTracking() {
//   return {
//     getCurrentSessionId,
//     hasSessionChanged,
//     getUsernameAndTriggerSessionChange,
//     startDownloadWithSessionTracking,
//     showDownloadCancelledMessage
//   };
// }