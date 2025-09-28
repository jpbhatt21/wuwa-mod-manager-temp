#[cfg(windows)]
use std::ffi::OsString;
#[cfg(windows)]
use std::os::windows::ffi::OsStringExt;
#[cfg(windows)]
use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(windows)]
use std::time::Duration;
#[cfg(windows)]
use winapi::um::{
    handleapi::CloseHandle,
    processthreadsapi::OpenProcess,
    psapi::GetModuleBaseNameW,
    winnt::{PROCESS_QUERY_INFORMATION, PROCESS_VM_READ},
    winuser::{
        keybd_event, GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId, MapVirtualKeyW,
        SetForegroundWindow, KEYEVENTF_KEYUP, MAPVK_VK_TO_VSC, VK_F10,
    },
};

#[cfg(windows)]
// Global hotreload state
static HOTRELOAD_ENABLED: AtomicBool = AtomicBool::new(false);

#[cfg(windows)]
// Global monitoring state
static MONITORING_ACTIVE: AtomicBool = AtomicBool::new(false);

#[cfg(windows)]
// Global change trigger state
static CHANGE: AtomicBool = AtomicBool::new(false);

#[cfg(windows)]
// Global F10 method selection (0-5: 0=hardware only, 1=sendinput only, 2=postmessage only, 3=extended only, 4=legacy only, 5=all methods)
static F10_METHOD: std::sync::atomic::AtomicU8 = std::sync::atomic::AtomicU8::new(4);

/// Set the hotreload state
#[tauri::command]
pub fn set_hotreload(enabled: bool) -> Result<(), String> {
    #[cfg(windows)]
    {
        HOTRELOAD_ENABLED.store(enabled, Ordering::SeqCst);
        log::info!("Hotreload set to: {}", enabled);
        Ok(())
    }
    #[cfg(not(windows))]
    {
        Err("Hotreload is only supported on Windows".to_string())
    }
}

/// Get the current hotreload state
#[tauri::command]
pub fn get_hotreload() -> bool {
    #[cfg(windows)]
    {
        HOTRELOAD_ENABLED.load(Ordering::SeqCst)
    }
    #[cfg(not(windows))]
    {
        false
    }
}

/// Set the change trigger state
#[tauri::command]
pub fn set_change(trigger: bool) -> Result<(), String> {
    #[cfg(windows)]
    {
        CHANGE.store(trigger, Ordering::SeqCst);
        log::info!("Change trigger set to: {}", trigger);
        Ok(())
    }
    #[cfg(not(windows))]
    {
        Err("Change trigger is only supported on Windows".to_string())
    }
}

/// Get the current change trigger state
#[tauri::command]
pub fn get_change() -> bool {
    #[cfg(windows)]
    {
        CHANGE.load(Ordering::SeqCst)
    }
    #[cfg(not(windows))]
    {
        false
    }
}

/// Trigger a change (set change to true)
#[tauri::command]
pub fn trigger_change() -> Result<(), String> {
    #[cfg(windows)]
    {
        CHANGE.store(true, Ordering::SeqCst);
        log::info!("Change triggered - F10 will be sent on next game window focus");
        Ok(())
    }
    #[cfg(not(windows))]
    {
        Err("Change trigger is only supported on Windows".to_string())
    }
}

/// Set the F10 method selection (0-5)
#[tauri::command]
pub fn set_f10_method(method: u8) -> Result<(), String> {
    #[cfg(windows)]
    {
        if method > 5 {
            return Err("F10 method must be in range 0-5".to_string());
        }
        F10_METHOD.store(method, Ordering::SeqCst);
        let method_name = match method {
            0 => "Hardware Input Only",
            1 => "SendInput Only",
            2 => "PostMessage Only",
            3 => "Extended PostMessage Only",
            4 => "Legacy keybd_event Only",
            5 => "All Methods",
            _ => "Unknown",
        };
        log::info!("F10 method set to: {} ({})", method, method_name);
        Ok(())
    }
    #[cfg(not(windows))]
    {
        Err("F10 method selection is only supported on Windows".to_string())
    }
}

/// Get the current F10 method selection
#[tauri::command]
pub fn get_f10_method() -> u8 {
    #[cfg(windows)]
    {
        F10_METHOD.load(Ordering::SeqCst)
    }
    #[cfg(not(windows))]
    {
        5 // Default to all methods on non-Windows
    }
}

/// Get the F10 method name for display
#[tauri::command]
pub fn get_f10_method_name() -> String {
    let method = get_f10_method();
    match method {
        0 => "Hardware Input Only".to_string(),
        1 => "SendInput Only".to_string(),
        2 => "PostMessage Only".to_string(),
        3 => "Extended PostMessage Only".to_string(),
        4 => "Legacy keybd_event Only".to_string(),
        5 => "All Methods".to_string(),
        _ => "Unknown".to_string(),
    }
}

/// Start monitoring the focused window for game detection
#[tauri::command]
pub fn start_window_monitoring() -> Result<(), String> {
    #[cfg(windows)]
    {
        if MONITORING_ACTIVE.load(Ordering::SeqCst) {
            return Ok(()); // Already monitoring
        }

        MONITORING_ACTIVE.store(true, Ordering::SeqCst);
        log::info!("Starting window monitoring for hotreload");

        // Spawn a background task for monitoring
        tauri::async_runtime::spawn(async {
            window_monitor_loop().await;
        });

        Ok(())
    }
    #[cfg(not(windows))]
    {
        Err("Window monitoring is only supported on Windows".to_string())
    }
}

/// Stop monitoring the focused window
#[tauri::command]
pub fn stop_window_monitoring() -> Result<(), String> {
    #[cfg(windows)]
    {
        MONITORING_ACTIVE.store(false, Ordering::SeqCst);
        log::info!("Stopped window monitoring");
        Ok(())
    }
    #[cfg(not(windows))]
    {
        Err("Window monitoring is only supported on Windows".to_string())
    }
}

#[cfg(windows)]
/// Get the title of the currently focused window
fn get_focused_window_title() -> Option<String> {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() {
            return None;
        }

        let mut buffer = [0u16; 512];
        let len = GetWindowTextW(hwnd, buffer.as_mut_ptr(), buffer.len() as i32);

        if len > 0 {
            let title = OsString::from_wide(&buffer[..len as usize])
                .to_string_lossy()
                .to_string();
            Some(title)
        } else {
            None
        }
    }
}

#[cfg(windows)]
/// Get the process name of the currently focused window
fn get_focused_window_process_name() -> Option<String> {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() {
            return None;
        }

        let mut process_id = 0;
        GetWindowThreadProcessId(hwnd, &mut process_id);

        if process_id == 0 {
            return None;
        }

        let process_handle =
            OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, process_id);

        if process_handle.is_null() {
            return None;
        }

        let mut buffer = [0u16; 512];
        let len = GetModuleBaseNameW(
            process_handle,
            std::ptr::null_mut(),
            buffer.as_mut_ptr(),
            buffer.len() as u32,
        );

        CloseHandle(process_handle);

        if len > 0 {
            let process_name = OsString::from_wide(&buffer[..len as usize])
                .to_string_lossy()
                .to_string();
            Some(process_name)
        } else {
            None
        }
    }
}

#[cfg(windows)]
/// Send F10 key press using Windows API with configurable method selection
fn send_f10_key() -> Result<(), String> {
    let method = F10_METHOD.load(Ordering::SeqCst);

    match method {
        0 => {
            // Hardware input only (COMMENTED OUT)
            // let result = send_f10_with_hardware_input();
            // if result.is_ok() {
            //     log::info!("F10 key sent successfully using Hardware Input method");
            //     println!("F10 key sent successfully using Hardware Input method");
            //     Ok(())
            // } else {
            //     let error_msg = format!("Hardware Input method failed: {:?}", result.err());
            //     log::error!("{}", error_msg);
            //     println!("Hardware Input method failed");
            //     Err(error_msg)
            // }
            Err("Hardware Input method is disabled".to_string())
        }
        1 => {
            // SendInput only (COMMENTED OUT)
            // let result = send_f10_with_sendinput();
            // if result.is_ok() {
            //     log::info!("F10 key sent successfully using SendInput method");
            //     println!("F10 key sent successfully using SendInput method");
            //     Ok(())
            // } else {
            //     let error_msg = format!("SendInput method failed: {:?}", result.err());
            //     log::error!("{}", error_msg);
            //     println!("SendInput method failed");
            //     Err(error_msg)
            // }
            Err("SendInput method is disabled".to_string())
        }
        2 => {
            // PostMessage only (COMMENTED OUT)
            // let result = send_f10_with_postmessage();
            // if result.is_ok() {
            //     log::info!("F10 key sent successfully using PostMessage method");
            //     println!("F10 key sent successfully using PostMessage method");
            //     Ok(())
            // } else {
            //     let error_msg = format!("PostMessage method failed: {:?}", result.err());
            //     log::error!("{}", error_msg);
            //     println!("PostMessage method failed");
            //     Err(error_msg)
            // }
            Err("PostMessage method is disabled".to_string())
        }
        3 => {
            // Extended PostMessage only (COMMENTED OUT)
            // let result = send_f10_with_extended_postmessage();
            // if result.is_ok() {
            //     log::info!("F10 key sent successfully using Extended PostMessage method");
            //     println!("F10 key sent successfully using Extended PostMessage method");
            //     Ok(())
            // } else {
            //     let error_msg = format!("Extended PostMessage method failed: {:?}", result.err());
            //     log::error!("{}", error_msg);
            //     println!("Extended PostMessage method failed");
            //     Err(error_msg)
            // }
            Err("Extended PostMessage method is disabled".to_string())
        }
        4 => {
            // Legacy keybd_event only
            let result = send_f10_with_legacy_keybd_event();
            if result.is_ok() {
                log::info!("F10 key sent successfully using Legacy keybd_event method");
                println!("F10 key sent successfully using Legacy keybd_event method");
                Ok(())
            } else {
                let error_msg = format!("Legacy keybd_event method failed: {:?}", result.err());
                log::error!("{}", error_msg);
                println!("Legacy keybd_event method failed");
                Err(error_msg)
            }
        }
        5 => {
            // All methods (COMMENTED OUT - only legacy enabled)
            // let result1 = send_f10_with_hardware_input();
            // if result1.is_ok() {
            //     std::thread::sleep(Duration::from_millis(50));
            // }
            //
            // let result2 = send_f10_with_sendinput();
            // if result2.is_ok() {
            //     std::thread::sleep(Duration::from_millis(10));
            // }
            //
            // let result3 = send_f10_with_postmessage();
            // let result4 = send_f10_with_extended_postmessage();
            let result5 = send_f10_with_legacy_keybd_event();

            if result5.is_ok() {
                log::info!(
                    "F10 key sent successfully using Legacy keybd_event method (all methods mode)"
                );
                println!("F10 key sent successfully using Legacy keybd_event method");
                Ok(())
            } else {
                let error_msg = format!("Legacy keybd_event method failed: {:?}", result5.err());
                log::error!("{}", error_msg);
                println!("Failed to send F10 key - legacy method failed\n");
                Err(error_msg)
            }
        }
        _ => Err("Invalid F10 method selection".to_string()),
    }
}

// #[cfg(windows)]
// /// Send F10 using hardware input simulation (most aggressive method) - DISABLED
// fn send_f10_with_hardware_input() -> Result<(), String> {
//     unsafe {
//         let hwnd = GetForegroundWindow();
//         if hwnd.is_null() {
//             return Err("No focused window found".to_string());
//         }
//
//         // Force window to foreground
//         SetForegroundWindow(hwnd);
//         std::thread::sleep(Duration::from_millis(10));
//
//         // Try to attach to the window's thread for better input delivery
//         let current_thread = GetCurrentThreadId();
//         let window_thread = GetWindowThreadProcessId(hwnd, std::ptr::null_mut());
//
//         if window_thread != 0 && window_thread != current_thread {
//             AttachThreadInput(current_thread, window_thread, 1);
//         }
//
//         // Use hardware input type with raw scan code
//         let scan_code = 0x44; // F10 scan code
//
//         let mut input = INPUT {
//             type_: INPUT_HARDWARE,
//             u: std::mem::zeroed(),
//         };
//
//         // Simulate hardware keypress
//         let hardware = input.u.hi_mut();
//         hardware.uMsg = WM_KEYDOWN;
//         hardware.wParamL = VK_F10 as u16;
//         hardware.wParamH = scan_code;
//
//         let result = SendInput(1, &mut input, std::mem::size_of::<INPUT>() as i32);
//
//         // Detach thread if we attached
//         if window_thread != 0 && window_thread != current_thread {
//             AttachThreadInput(current_thread, window_thread, 0);
//         }
//
//         if result == 1 {
//             log::debug!("F10 sent via hardware input simulation");
//             Ok(())
//         } else {
//             Err(format!("Hardware input failed, returned: {}", result))
//         }
//     }
// }

// #[cfg(windows)]
// /// Send F10 using SendInput with enhanced scan codes - DISABLED
// fn send_f10_with_sendinput() -> Result<(), String> {
//     unsafe {
//         // Get the scan code for F10
//         let scan_code = MapVirtualKeyW(VK_F10 as u32, MAPVK_VK_TO_VSC);
//
//         let mut inputs = [INPUT {
//             type_: INPUT_KEYBOARD,
//             u: std::mem::zeroed(),
//         }; 2];
//
//         // Key down with scan code
//         let ki_down = inputs[0].u.ki_mut();
//         ki_down.wVk = VK_F10 as u16;
//         ki_down.wScan = scan_code as u16;
//         ki_down.dwFlags = KEYEVENTF_SCANCODE;
//         ki_down.time = 0;
//         ki_down.dwExtraInfo = 0;
//
//         // Key up with scan code
//         let ki_up = inputs[1].u.ki_mut();
//         ki_up.wVk = VK_F10 as u16;
//         ki_up.wScan = scan_code as u16;
//         ki_up.dwFlags = KEYEVENTF_KEYUP | KEYEVENTF_SCANCODE;
//         ki_up.time = 0;
//         ki_up.dwExtraInfo = 0;
//
//         let result = SendInput(2, inputs.as_mut_ptr(), std::mem::size_of::<INPUT>() as i32);
//
//         if result == 2 {
//             log::debug!("F10 sent via SendInput with scan code: {}", scan_code);
//             Ok(())
//         } else {
//             Err(format!("SendInput failed, returned: {}", result))
//         }
//     }
// }

// #[cfg(windows)]
// /// Send F10 using PostMessage to the focused window (alternative method) - DISABLED
// fn send_f10_with_postmessage() -> Result<(), String> {
//     unsafe {
//         let hwnd = GetForegroundWindow();
//         if hwnd.is_null() {
//             return Err("No focused window found".to_string());
//         }
//
//         // Send WM_KEYDOWN
//         let result_down = PostMessageW(hwnd, WM_KEYDOWN, VK_F10 as usize, 0x00440001);
//         if result_down == 0 {
//             return Err("PostMessage WM_KEYDOWN failed".to_string());
//         }
//
//         // Small delay between down and up
//         std::thread::sleep(Duration::from_millis(5));
//
//         // Send WM_KEYUP
//         let result_up = PostMessageW(hwnd, WM_KEYUP, VK_F10 as usize, 0xC0440001);
//         if result_up == 0 {
//             return Err("PostMessage WM_KEYUP failed".to_string());
//         }
//
//         log::debug!("F10 sent via PostMessage to window: {:?}", hwnd);
//         Ok(())
//     }
// }

// #[cfg(windows)]
// /// Send F10 using extended PostMessage with multiple message types - DISABLED
// fn send_f10_with_extended_postmessage() -> Result<(), String> {
//     unsafe {
//         let hwnd = GetForegroundWindow();
//         if hwnd.is_null() {
//             return Err("No focused window found".to_string());
//         }
//
//         // Force focus first
//         SetForegroundWindow(hwnd);
//         std::thread::sleep(Duration::from_millis(10));
//
//         // Try different lParam values for F10
//         let lparam_variations = [
//             0x00440001, // Standard
//             0x00440000, // Without repeat count
//             0x20440001, // With alt key context
//             0x00440041, // Different scan code format
//         ];
//
//         let mut success_count = 0;
//
//         for &lparam in &lparam_variations {
//             // Send WM_KEYDOWN
//             if PostMessageW(hwnd, WM_KEYDOWN, VK_F10 as usize, lparam) != 0 {
//                 std::thread::sleep(Duration::from_millis(2));
//
//                 // Send WM_KEYUP with corresponding up flags
//                 let lparam_up = lparam | 0xC0000000; // Add key up flags
//                 if PostMessageW(hwnd, WM_KEYUP, VK_F10 as usize, lparam_up) != 0 {
//                     success_count += 1;
//                 }
//
//                 std::thread::sleep(Duration::from_millis(5));
//             }
//         }
//
//         if success_count > 0 {
//             log::debug!("F10 sent via extended PostMessage ({}/{} variations succeeded)",
//                        success_count, lparam_variations.len());
//             Ok(())
//         } else {
//             Err("All extended PostMessage variations failed".to_string())
//         }
//     }
// }

#[cfg(windows)]
/// Send F10 using legacy keybd_event (bypasses some modern filtering)
fn send_f10_with_legacy_keybd_event() -> Result<(), String> {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() {
            return Err("No focused window found".to_string());
        }

        // Force focus first
        SetForegroundWindow(hwnd);
        std::thread::sleep(Duration::from_millis(20));

        // Get scan code for F10
        let scan_code = MapVirtualKeyW(VK_F10 as u32, MAPVK_VK_TO_VSC) as u8;

        // Send key down
        keybd_event(VK_F10 as u8, scan_code, 0, 0);

        // Small delay
        std::thread::sleep(Duration::from_millis(10));

        // Send key up
        keybd_event(VK_F10 as u8, scan_code, KEYEVENTF_KEYUP as u32, 0);

        log::debug!(
            "F10 sent via legacy keybd_event with scan code: {}",
            scan_code
        );
        Ok(())
    }
}

#[cfg(windows)]
/// Check if a window title or process name contains "game" (case-insensitive)
fn is_game_window(title: &str, process_name: &str) -> bool {
    let title_lower = title.to_lowercase();
    let process_lower = process_name.to_lowercase();

    // Check for various game-related patterns
    let game_patterns = [
        "wuwa-mod-manager",
        // "wuthering waves  ",
    ];
    for pattern in &game_patterns {
        if title_lower.contains(pattern) || process_lower.contains(pattern) {
            return true;
        }
    }

    false
}

#[cfg(windows)]
/// Main monitoring loop that runs in the background
async fn window_monitor_loop() {
    let mut last_game_state = false;
    let mut f10_press_count = 0;

    while MONITORING_ACTIVE.load(Ordering::SeqCst) {
        // Only proceed if hotreload is enabled
        if !HOTRELOAD_ENABLED.load(Ordering::SeqCst) {
            tokio::time::sleep(Duration::from_millis(1000)).await;
            continue;
        }

        // Get current focused window info
        let window_title = get_focused_window_title().unwrap_or_default();
        let process_name = get_focused_window_process_name().unwrap_or_default();

        let is_game = is_game_window(&window_title, &process_name);

        // Log window changes for debugging
        if is_game != last_game_state {
            if is_game {
                log::info!(
                    "Game window detected - Title: '{}', Process: '{}'",
                    window_title,
                    process_name
                );
            } else {
                log::info!("Game window lost focus - now focused: '{}'", window_title);
            }
            last_game_state = is_game;
        }

        // Send F10 if game window is focused
        if is_game && CHANGE.load(Ordering::SeqCst) {
            // Reset change trigger
            CHANGE.store(false, Ordering::SeqCst);
            if let Err(e) = send_f10_key() {
                log::error!("Failed to send F10 key: {}", e);
            } else {
                f10_press_count += 1;
                if f10_press_count % 10 == 0 {
                    log::debug!("F10 pressed {} times for game window", f10_press_count);
                }
            }
        }

        // Check every 100ms for responsive hotreload
        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    log::info!(
        "Window monitoring stopped. Total F10 presses: {}",
        f10_press_count
    );
}

/// Get information about the currently focused window (for debugging)
#[tauri::command]
pub fn get_focused_window_info() -> Result<String, String> {
    #[cfg(windows)]
    {
        let title = get_focused_window_title().unwrap_or("Unknown".to_string());
        let process = get_focused_window_process_name().unwrap_or("Unknown".to_string());
        let is_game = is_game_window(&title, &process);

        Ok(format!(
            "Title: '{}', Process: '{}', Is Game: {}",
            title, process, is_game
        ))
    }
    #[cfg(not(windows))]
    {
        Err("Window info is only available on Windows".to_string())
    }
}

/// Test F10 key sending (for debugging)
#[tauri::command]
pub fn test_f10_key() -> Result<(), String> {
    #[cfg(windows)]
    {
        send_f10_key()
    }
    #[cfg(not(windows))]
    {
        Err("F10 key sending is only supported on Windows".to_string())
    }
}

/// Test F10 key sending with detailed method results (for debugging)
#[tauri::command]
pub fn test_f10_key_detailed() -> Result<String, String> {
    #[cfg(windows)]
    {
        let mut results = Vec::new();

        // Test Hardware Input method (DISABLED)
        results.push("Hardware: DISABLED".to_string());

        // Test SendInput method (DISABLED)
        results.push("SendInput: DISABLED".to_string());

        // Test PostMessage method (DISABLED)
        results.push("PostMessage: DISABLED".to_string());

        // Test Extended PostMessage method (DISABLED)
        results.push("Extended: DISABLED".to_string());

        std::thread::sleep(Duration::from_millis(100));

        // Test Legacy keybd_event method (ONLY ENABLED)
        match send_f10_with_legacy_keybd_event() {
            Ok(_) => results.push("Legacy: SUCCESS".to_string()),
            Err(e) => results.push(format!("Legacy: FAILED - {}", e)),
        }

        let result_text = results.join(" | ");
        log::info!("F10 test results (Legacy only): {}", result_text);
        Ok(result_text)
    }
    #[cfg(not(windows))]
    {
        Err("F10 key testing is only supported on Windows".to_string())
    }
}
