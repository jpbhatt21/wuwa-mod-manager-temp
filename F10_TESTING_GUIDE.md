# Improved F10 Key Sending - Testing Guide

## What Was Fixed

The F10 key was not registering in games because many games have input protection against synthetic key events. I've implemented multiple improvements:

### 1. **Scan Code Support**
- Now uses proper hardware scan codes via `MapVirtualKeyW`
- Games are more likely to accept input with correct scan codes
- Uses `KEYEVENTF_SCANCODE` flag for authentic key events

### 2. **Multiple Sending Methods**
- **Method 1**: `SendInput` with scan codes (primary method)
- **Method 2**: `PostMessage` directly to game window (fallback)
- Both methods are tried to maximize compatibility

### 3. **Realistic Timing**
- Added small delays between key down/up events (5-10ms)
- Added 50ms delay before sending to ensure window is ready
- More natural key press simulation

### 4. **Enhanced Logging**
- Detailed logging of which methods succeed/fail
- Window information logged when F10 is sent
- Better debugging information

## Testing the Fix

### Method 1: Use the Detailed Test Function
```typescript
import { testF10KeyDetailed } from '@/utils/hotreload';

// Test both methods and see results
const results = await testF10KeyDetailed();
console.log(results); // Shows "SendInput: SUCCESS, PostMessage: SUCCESS" etc.
```

### Method 2: Test with Game Window
1. **Enable hotreload monitoring**:
   ```typescript
   import { enableHotreload, triggerChange } from '@/utils/hotreload';
   
   await enableHotreload();
   ```

2. **Focus your game window** (Wuthering Waves)

3. **Trigger F10 from your app**:
   ```typescript
   await triggerChange(); // This will send F10 when game is focused
   ```

### Method 3: Manual Testing
1. Open your game (Wuthering Waves)
2. Focus the game window
3. Call `triggerChange()` from your frontend
4. Check the console logs for detailed results

## Expected Behavior

- **Before**: F10 was sent but game didn't respond
- **After**: F10 should now be properly received by the game

## Debugging Tips

1. **Check Logs**: Look for these messages in your Tauri logs:
   - `"F10 sent via SendInput with scan code: X"`
   - `"F10 sent via PostMessage to window: HWND"`
   - `"F10 sent successfully (SendInput: true, PostMessage: true)"`

2. **Test Both Methods**: Use `testF10KeyDetailed()` to see which method works:
   - If SendInput fails but PostMessage succeeds → Game blocks SendInput
   - If both work → Should definitely register in game
   - If both fail → Window focus or permission issue

3. **Window Detection**: Verify game window is detected correctly:
   ```typescript
   import { getFocusedWindowInfo } from '@/utils/hotreload';
   
   const info = await getFocusedWindowInfo();
   console.log(info); // Should show game window when focused
   ```

## Common Issues & Solutions

### Issue: "SendInput failed, returned: 0"
- **Cause**: System blocked input or insufficient permissions
- **Solution**: Run app as administrator or check antivirus blocking

### Issue: "No focused window found"
- **Cause**: Game window not properly focused
- **Solution**: Click on game window before triggering

### Issue: PostMessage works but SendInput doesn't
- **Cause**: Game has anti-cheat blocking SendInput
- **Solution**: This is normal, PostMessage should still work

## Game-Specific Notes

**Wuthering Waves**: 
- Uses Unreal Engine which often blocks SendInput
- PostMessage method should work better
- Try both methods - at least one should succeed

Let me know the results of `testF10KeyDetailed()` when you have the game focused!