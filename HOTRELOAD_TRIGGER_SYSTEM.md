# Hotreload Trigger System Documentation

## Overview
Modified the hotreload system to use a trigger-based approach instead of continuous F10 key pressing. The system now only sends F10 when both the game window is focused AND a change trigger is active.

## How It Works

### Backend (Rust)
Located in `src-tauri/src/hotreload.rs`:

#### Global Variables
- `HOTRELOAD_ENABLED`: Controls whether hotreload monitoring is active
- `MONITORING_ACTIVE`: Tracks if the monitoring thread is running
- `CHANGE`: New trigger variable that controls when F10 should be sent

#### Key Functions
- `set_change(trigger: bool)`: Sets the change trigger state
- `get_change() -> bool`: Gets the current change trigger state  
- `trigger_change()`: Sets change to true (shorthand for triggering)

#### Logic Flow
```rust
// In the monitoring loop:
if is_game && change_triggered {
    send_f10_key();
    CHANGE.store(false, Ordering::Relaxed); // Reset after sending
}
```

### Frontend (TypeScript)
Located in `src/utils/hotreload.ts`:

#### New Functions
- `setChange(trigger: boolean)`: Set the change trigger state
- `getChange(): Promise<boolean>`: Get current change trigger state
- `triggerChange()`: Trigger a change (sets to true)

## Usage Examples

### Basic Usage
```typescript
import { enableHotreload, triggerChange } from '@/utils/hotreload';

// Enable hotreload monitoring
await enableHotreload(true);

// Trigger F10 to be sent when game window is next focused
await triggerChange();
```

### Manual Control
```typescript
// Set change state manually
await setChange(true);

// Check current state
const isChangeActive = await getChange();

// Reset change state
await setChange(false);
```

## Benefits

1. **Precise Control**: F10 is only sent when explicitly triggered
2. **No Spam**: Eliminates continuous key pressing
3. **Event-Driven**: Perfect for responding to specific game state changes
4. **Automatic Reset**: Change flag is automatically cleared after F10 is sent
5. **Thread-Safe**: Uses atomic operations for safe multi-threading

## Use Cases

- Trigger hotreload after mod installation
- Send F10 when specific game events occur
- Manual hotreload triggering from UI
- Conditional hotreload based on game state

## Technical Notes

- Uses `AtomicBool` for thread-safe access
- Windows API integration for reliable key sending
- Automatic cleanup prevents memory leaks
- Compatible with existing hotreload system