# Session Management - Download Cancellation

## 🎯 Problem Solved

Previously, when users refreshed the page or navigated while downloads were in progress, the downloads would continue running in the background in the Rust backend, consuming bandwidth and resources unnecessarily.

## 🔧 Solution Implemented

### 1. Global Session ID (`sid`)
- **Location**: `src-tauri/src/lib.rs`
- **Implementation**: `AtomicU64` for thread-safe access
- **Purpose**: Tracks the current application session

```rust
static SESSION_ID: AtomicU64 = AtomicU64::new(0);
```

### 2. Session ID Increment on Refresh
- **Trigger**: When `get_username()` is called (typically happens on app initialization/refresh)
- **Action**: Increments the global session ID
- **Effect**: Invalidates all ongoing downloads from previous sessions

```rust
#[tauri::command]
fn get_username() -> String {
    // Increment session ID when get_username is called (indicating session change/refresh)
    let new_sid = SESSION_ID.fetch_add(1, Ordering::SeqCst) + 1;
    log::info!("Session changed, new session ID: {}", new_sid);
    // ... rest of function
}
```

### 3. Download Session Validation
- **Capture**: Session ID is captured at the start of each download
- **Check**: During download streaming, the current session ID is compared with the captured one
- **Action**: If session has changed, download is immediately cancelled

```rust
// At start of download
let current_sid = SESSION_ID.load(Ordering::SeqCst);

// During download streaming
while let Some(item) = stream.next().await {
    // Check if session has changed - if so, abort download
    let global_sid = SESSION_ID.load(Ordering::SeqCst);
    if global_sid != current_sid {
        // Clean up and return error
        drop(writer);
        let _ = remove_file(&file_path);
        return Err(format!("Download cancelled due to session change"));
    }
    // ... continue download
}
```

## 🚀 Features

### Automatic Cancellation
- ✅ Downloads are cancelled immediately when session changes
- ✅ Partial files are cleaned up automatically
- ✅ No resource waste from orphaned downloads

### Multiple Check Points
- ✅ **During streaming**: Checks session ID on every chunk
- ✅ **After download**: Validates session before file processing
- ✅ **Before completion**: Final check before emitting success event

### Comprehensive Logging
- 📝 Session changes are logged with old/new session IDs
- 📝 Download cancellations are logged with reason
- 📝 Successful completions are logged with session ID

## 🎛️ Frontend Integration

### Session Manager Utility (`src/utils/sessionManager.ts`)

```typescript
import { startDownloadWithSessionTracking } from '@/utils/sessionManager';

// Start download with automatic session tracking
const result = await startDownloadWithSessionTracking(
  fileName,
  downloadUrl,
  savePath,
  true
);

if (!result.success && result.error === 'CANCELLED_SESSION_CHANGE') {
  // Handle session change cancellation
  console.log('Download was cancelled due to page refresh');
}
```

### Available Functions

1. **`getCurrentSessionId()`** - Get current session ID
2. **`getUsernameAndTriggerSessionChange()`** - Manually trigger session change
3. **`hasSessionChanged()`** - Check if session changed since last check
4. **`startDownloadWithSessionTracking()`** - Start download with session validation
5. **`initializeSessionTracking()`** - Setup event listeners

## 🧪 Testing

### Manual Testing Steps

1. **Start a large download**:
   ```typescript
   await startDownloadWithSessionTracking("test.zip", "https://example.com/large-file.zip", "./downloads");
   ```

2. **Refresh the page during download**
   - Check browser console for session change logs
   - Verify download stops immediately
   - Confirm partial file is cleaned up

3. **Check backend logs**:
   ```
   Session changed, new session ID: 2
   Session changed during download (was: 1, now: 2), aborting download of: test.zip
   ```

### Automated Testing

```rust
// In Rust - test session change detection
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_session_change_detection() {
        let initial_sid = SESSION_ID.load(Ordering::SeqCst);
        get_username(); // This should increment session ID
        let new_sid = SESSION_ID.load(Ordering::SeqCst);
        assert!(new_sid > initial_sid);
    }
}
```

## 📊 Performance Impact

### Before
- ❌ Downloads continued after refresh
- ❌ Wasted bandwidth and storage
- ❌ Potential file conflicts
- ❌ No way to track active downloads

### After
- ✅ Immediate cancellation on session change
- ✅ Clean resource management
- ✅ No orphaned files
- ✅ Session-aware download tracking
- ✅ Minimal performance overhead (atomic operations)

## 🔄 Session Change Triggers

Currently, session ID increments when:
1. **`get_username()` is called** - typically on app start/refresh
2. **Manual trigger** - via `getUsernameAndTriggerSessionChange()`

### Future Enhancements

You could extend this to trigger on:
- Window focus/blur events
- Route changes in the frontend
- User authentication state changes
- Manual "Cancel All Downloads" button

## 🎯 Usage Examples

### Basic Usage
```typescript
// In your component
import { useSessionTracking } from '@/utils/sessionManager';

const { startDownloadWithSessionTracking } = useSessionTracking();

const handleDownload = async () => {
  const result = await startDownloadWithSessionTracking(
    fileName,
    downloadUrl,
    savePath
  );
  
  if (result.success) {
    console.log('Download completed successfully');
  } else if (result.error === 'CANCELLED_SESSION_CHANGE') {
    // Show user-friendly message
    showNotification('Download cancelled due to page refresh');
  }
};
```

### Advanced Session Management
```typescript
// Check if downloads should be cancelled
const sessionChanged = await hasSessionChanged();
if (sessionChanged) {
  console.log('Session changed - ongoing downloads will be cancelled');
}

// Get current session for logging
const sessionId = await getCurrentSessionId();
console.log(`Current session: ${sessionId}`);
```

## 📝 Logging Examples

### Successful Flow
```
[INFO] Starting download for session ID: 5, file: mod.zip
[INFO] Download completed successfully for session 5: mod.zip
[INFO] Emitting completion event for session 5: mod.zip
```

### Cancelled Flow
```
[INFO] Session changed, new session ID: 6
[INFO] Session changed during download (was: 5, now: 6), aborting download of: mod.zip
```

This implementation provides robust session management that automatically handles download cancellation when users refresh or navigate, preventing resource waste and ensuring a clean user experience.