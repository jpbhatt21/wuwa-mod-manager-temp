# F10 Method Selection Control

## 🎛️ **New Feature: Method Selection Control**

You now have **granular control** over which F10 key sending methods are used! Instead of always trying all 5 methods, you can select specific ones for testing or optimization.

### 🔧 **Method Selection Options:**

| Value | Method | Description |
|-------|--------|-------------|
| **0** | **Hardware Input Only** | Uses `INPUT_HARDWARE` with thread attachment - most aggressive |
| **1** | **SendInput Only** | Uses `SendInput` with proper scan codes - standard approach |
| **2** | **PostMessage Only** | Uses `WM_KEYDOWN`/`WM_KEYUP` messages - bypasses input filtering |
| **3** | **Extended PostMessage Only** | Uses multiple `PostMessage` variations - for picky games |
| **4** | **Legacy keybd_event Only** | Uses deprecated `keybd_event` API - bypasses modern protection |
| **5** | **All Methods** | Uses all 5 methods together - maximum compatibility (default) |

### 🚀 **Frontend Usage:**

#### Set Method:
```typescript
import { setF10Method } from '@/utils/hotreload';

// Use only PostMessage method
await setF10Method(2); 

// Use all methods (default)
await setF10Method(5);
```

#### Get Current Method:
```typescript
import { getF10Method, getF10MethodName } from '@/utils/hotreload';

const method = await getF10Method(); // Returns number 0-5
const methodName = await getF10MethodName(); // Returns "PostMessage Only" etc.

console.log(`Current method: ${method} (${methodName})`);
```

#### Full Hook Usage:
```typescript
import { useHotreload } from '@/utils/hotreload';

const {
  setF10Method,
  getF10Method,
  getF10MethodName,
  testF10KeyDetailed
} = useHotreload();

// Test which methods work
const results = await testF10KeyDetailed();
console.log(results); // "Hardware: FAILED | SendInput: SUCCESS | PostMessage: SUCCESS..."

// Based on results, use only working methods
if (results.includes("PostMessage: SUCCESS")) {
  await setF10Method(2); // Use PostMessage only
}
```

### 🎯 **Strategic Usage:**

#### 1. **Find What Works:**
```typescript
// Test all methods first
const results = await testF10KeyDetailed();
console.log(results);

// If only Legacy works:
if (results.includes("Legacy: SUCCESS") && !results.includes("SendInput: SUCCESS")) {
  await setF10Method(4); // Use Legacy only for speed
}
```

#### 2. **Optimize Performance:**
```typescript
// If multiple methods work, use the fastest one
const results = await testF10KeyDetailed();

if (results.includes("SendInput: SUCCESS")) {
  await setF10Method(1); // Fastest method
} else if (results.includes("PostMessage: SUCCESS")) {
  await setF10Method(2); // Good fallback
}
```

#### 3. **Game-Specific Optimization:**
```typescript
// For Wuthering Waves - if you find PostMessage works best:
await setF10Method(2);

// For other games - if Hardware Input is needed:
await setF10Method(0);

// For maximum compatibility (default):
await setF10Method(5);
```

### 🧪 **Testing Workflow:**

#### Step 1: Test All Methods
```typescript
// Focus your game window first
const results = await testF10KeyDetailed();
console.log(results);
// Example: "Hardware: FAILED | SendInput: FAILED | PostMessage: SUCCESS | Extended: SUCCESS | Legacy: SUCCESS"
```

#### Step 2: Optimize Based on Results
```typescript
// If 3 methods work, pick the most reliable one
if (results.includes("PostMessage: SUCCESS")) {
  await setF10Method(2); // Use PostMessage only
  console.log("Optimized to PostMessage method");
}
```

#### Step 3: Test the Selected Method
```typescript
// Test the specific method works
await testF10Key(); // Now tests only your selected method
```

### 📊 **Benefits:**

- **🚄 Faster Execution**: Single method executes faster than all 5
- **🎯 Precise Control**: Use exactly what works for your game
- **🔍 Better Debugging**: Test individual methods in isolation
- **⚡ Reduced Overhead**: No unnecessary method attempts
- **🎮 Game Optimization**: Fine-tune for specific games

### 🔧 **Default Behavior:**
- **Default**: Method 5 (All Methods) - maintains compatibility
- **Automatic**: No change needed if you want all methods
- **Configurable**: Change anytime via `setF10Method()`

### 💡 **Pro Tips:**

1. **Start with All Methods (5)** to test compatibility
2. **Use testF10KeyDetailed()** to see which methods work
3. **Switch to single method** that works for better performance
4. **Reset to All Methods (5)** if issues arise
5. **Different games may need different methods**

Now you have complete control over F10 key sending! 🎮✨