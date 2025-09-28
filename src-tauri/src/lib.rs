// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use futures_util::StreamExt;
use reqwest::Client;
use sevenz_rust2::decompress_file;
use std::fs::{remove_file, File};
use std::io::{self, BufWriter, Write};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::Emitter;
use unrar::Archive as RarArchive;
use zip::ZipArchive;

mod hotreload;
mod image_server;

// Constants for better maintainability
const PROGRESS_UPDATE_THRESHOLD: u64 = 1024; // Update progress every 1KB
const BUFFER_SIZE: usize = 8192; // 8KB buffer for file operations
const IMAGE_SERVER_PORT: u16 = 5000; // Port for the image server

// Global session ID for tracking active sessions
static SESSION_ID: AtomicU64 = AtomicU64::new(0);
// Optimized MIME type to extension mapping with const lookup
const MIME_EXTENSIONS: &[(&str, &str)] = &[
    ("image/jpeg", "jpg"),
    ("image/jpg", "jpg"),
    ("image/png", "png"),
    ("image/gif", "gif"),
    ("application/pdf", "pdf"),
    ("text/plain", "txt"),
    ("text/html", "html"),
    ("application/json", "json"),
    ("application/zip", "zip"),
    ("application/x-tar", "tar"),
    ("application/gzip", "gz"),
    ("application/x-bzip2", "bz2"),
    ("application/x-xz", "xz"),
    ("text/csv", "csv"),
    ("application/vnd.ms-excel", "xls"),
    (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xlsx",
    ),
    ("application/vnd.ms-powerpoint", "ppt"),
    (
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "pptx",
    ),
    ("application/msword", "doc"),
    (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "docx",
    ),
];

fn mime_to_extension(mime_type: &str) -> Option<&'static str> {
    let clean_mime = mime_type.split(';').next().unwrap_or("").trim();
    MIME_EXTENSIONS
        .iter()
        .find(|(mime, _)| *mime == clean_mime)
        .map(|(_, ext)| *ext)
}
#[tauri::command]
async fn download_and_unzip(
    app_handle: tauri::AppHandle,
    file_name: String,
    download_url: String,
    save_path: String,
    emit: bool,
) -> Result<(), String> {
    // Capture current session ID at the start of download
    let current_sid = SESSION_ID.load(Ordering::SeqCst);
    log::info!(
        "Starting download for session ID: {}, file: {}",
        current_sid,
        file_name
    );

    println!("Starting download - Session ID: {}", current_sid);
    // Create HTTP client
    let client = Client::new();
    let save_path2 = save_path.to_owned();
    println!("HTTP client created");

    // Send GET request
    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    println!("test3");

    let ext = response
        .url()
        .path_segments()
        .and_then(|segments| segments.last())
        .and_then(|name| std::path::Path::new(name).extension())
        .and_then(|ext| ext.to_str())
        .or_else(|| {
            response
                .headers()
                .get("content-type")
                .and_then(|ct| ct.to_str().ok())
                .and_then(|ct| mime_to_extension(ct))
        })
        .unwrap_or("")
        .to_owned();

    let file_name = if !ext.is_empty() {
        format!("{}.{}", file_name, ext)
    } else {
        file_name
    };
    println!("test4");

    // Get content length for progress
    let total_size = response
        .content_length()
        .ok_or("Failed to get content length")?;
    println!("test5");
    // Prepare file path
    let file_path = Path::new(&save_path).join(&file_name);
    println!("{}", file_path.to_str().unwrap());
    // Create buffered file writer for better performance
    let file = File::create(&file_path).map_err(|e| e.to_string())?;
    let mut writer = BufWriter::with_capacity(BUFFER_SIZE, file);

    // Stream the response body
    let mut stream = response.bytes_stream();
    let mut downloaded: u64 = 0;
    let mut last_progress_update: u64 = 0;

    while let Some(item) = stream.next().await {
        // Check if session has changed - if so, abort download
        let global_sid = SESSION_ID.load(Ordering::SeqCst);
        if global_sid != current_sid {
            log::info!(
                "Session changed during download (was: {}, now: {}), aborting download of: {}",
                current_sid,
                global_sid,
                file_name
            );
            // Clean up partial file
            drop(writer);
            let _ = remove_file(&file_path);
            return Err(format!(
                "Download cancelled due to session change (file: {})",
                file_name
            ));
        }

        let chunk = item.map_err(|e| e.to_string())?;
        writer.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        // Emit progress event to frontend (throttled for performance)
        if emit && (downloaded - last_progress_update) >= PROGRESS_UPDATE_THRESHOLD {
            let progress = (downloaded as f64 / total_size as f64) * 100.0;
            app_handle
                .emit("download-progress", progress)
                .map_err(|e| e.to_string())?;
            last_progress_update = downloaded;
        }
    }

    // Final session check before processing the downloaded file
    let global_sid = SESSION_ID.load(Ordering::SeqCst);
    if global_sid != current_sid {
        log::info!("Session changed after download completed (was: {}, now: {}), aborting processing of: {}", current_sid, global_sid, file_name);
        // Clean up downloaded file
        drop(writer);
        let _ = remove_file(&file_path);
        return Err(format!(
            "Download cancelled due to session change after completion (file: {})",
            file_name
        ));
    }

    // Flush the buffer before proceeding
    writer.flush().map_err(|e| e.to_string())?;

    // Explicitly drop the writer to ensure file is closed
    drop(writer);

    log::info!(
        "Download completed successfully for session {}: {}",
        current_sid,
        file_name
    );

    // Unzip the file
    if ext == "zip" {
        let zip_file = File::open(&file_path).map_err(|e| e.to_string())?;
        let mut archive = ZipArchive::new(zip_file).map_err(|e| e.to_string())?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            let outpath = Path::new(&save_path).join(file.mangled_name());

            if file.name().ends_with('/') {
                std::fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
            } else {
                if let Some(p) = outpath.parent() {
                    if !p.exists() {
                        std::fs::create_dir_all(&p).map_err(|e| e.to_string())?;
                    }
                }
                let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
                io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
            }
        }

        // Delete the zip file
        remove_file(&file_path).map_err(|e| e.to_string())?;
    } else if ext == "rar" {
        let mut archive = RarArchive::new(&file_path)
            .open_for_processing()
            .map_err(|e| e.to_string())?;

        loop {
            let header = match archive.read_header().map_err(|e| e.to_string())? {
                Some(header) => header,
                None => break,
            };

            let entry = header.entry();
            let outpath = Path::new(&save_path).join(&entry.filename);

            if entry.is_directory() {
                std::fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
                archive = header.skip().map_err(|e| e.to_string())?;
            } else if entry.is_file() {
                if let Some(parent) = outpath.parent() {
                    if !parent.exists() {
                        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                    }
                }
                let data = header.read().map_err(|e| e.to_string())?;
                let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
                outfile.write_all(&data.0).map_err(|e| e.to_string())?;
                archive = data.1; // Use the new archive state
            } else {
                archive = header.skip().map_err(|e| e.to_string())?;
            }
        }
        remove_file(file_path).map_err(|e| e.to_string())?;
    } else if ext == "7z" {
        let del = file_path.to_owned();
        decompress_file(file_path, save_path).expect("complete");
        remove_file(del).map_err(|e| e.to_string())?;
    }
    // Final session check before emitting completion
    let global_sid = SESSION_ID.load(Ordering::SeqCst);
    if global_sid != current_sid {
        log::info!("Session changed during file processing (was: {}, now: {}), not emitting completion for: {}", current_sid, global_sid, file_name);
        return Err(format!(
            "Session changed during processing, operation cancelled (file: {})",
            file_name
        ));
    }

    if emit {
        log::info!(
            "Emitting completion event for session {}: {}",
            current_sid,
            file_name
        );
        app_handle
            .emit("fin", save_path2)
            .map_err(|e| e.to_string())?;
    }

    log::info!(
        "Download and extraction completed successfully for session {}: {}",
        current_sid,
        file_name
    );
    Ok(())
}
#[tauri::command]
fn get_username() -> String {
    // Increment session ID when get_username is called (indicating session change/refresh)
    let new_sid = SESSION_ID.fetch_add(1, Ordering::SeqCst) + 1;
    log::info!("Session changed, new session ID: {}", new_sid);

    let username = std::env::var("USERNAME").unwrap_or_else(|_| "Unknown".to_string());
    println!("Username: {}, Session ID: {}", username, new_sid);
    username
}
#[tauri::command]
fn exit_app() {
    std::process::exit(0x0);
}

/// Get the image server URL
#[tauri::command]
fn get_image_server_url() -> String {
    format!("http://127.0.0.1:{}", IMAGE_SERVER_PORT)
}

/// Get the current session ID
#[tauri::command]
fn get_session_id() -> u64 {
    SESSION_ID.load(Ordering::SeqCst)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Start the image server in a background task
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = image_server::start_image_server(IMAGE_SERVER_PORT).await {
                    log::error!("Failed to start image server: {}", e);
                    // Emit an error event to the frontend
                    if let Err(emit_err) = app_handle.emit(
                        "image-server-error",
                        format!("Failed to start image server: {}", e),
                    ) {
                        log::error!("Failed to emit image server error: {}", emit_err);
                    }
                } else {
                    log::info!(
                        "Image server started successfully on port {}",
                        IMAGE_SERVER_PORT
                    );
                    // Emit a success event to the frontend
                    if let Err(emit_err) =
                        app_handle.emit("image-server-ready", get_image_server_url())
                    {
                        log::error!("Failed to emit image server ready event: {}", emit_err);
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            exit_app,
            get_username,
            download_and_unzip,
            get_image_server_url,
            get_session_id,
            hotreload::set_hotreload,
            hotreload::get_hotreload,
            hotreload::start_window_monitoring,
            hotreload::stop_window_monitoring,
            hotreload::get_focused_window_info,
            hotreload::test_f10_key,
            hotreload::test_f10_key_detailed,
            hotreload::set_change,
            hotreload::get_change,
            hotreload::trigger_change,
            hotreload::set_f10_method,
            hotreload::get_f10_method,
            hotreload::get_f10_method_name
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
