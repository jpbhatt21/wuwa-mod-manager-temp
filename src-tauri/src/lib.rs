// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use futures_util::StreamExt;
use reqwest::Client;
use sevenz_rust2::decompress_file;
use std::fs::{remove_file, File};
use std::io::{self, Write};
use std::path::Path;
use tauri::{Emitter, Manager};
use tokio::io::AsyncWriteExt;
use unrar::Archive as RarArchive;
use zip::ZipArchive;
fn mime_to_extension(mime_type: &str) -> Option<&'static str> {
    match mime_type.split(';').next().unwrap_or("").trim() {
        "image/jpeg" => Some("jpg"),
        "image/jpg" => Some("jpg"),
        "image/png" => Some("png"),
        "image/gif" => Some("gif"),
        "application/pdf" => Some("pdf"),
        "text/plain" => Some("txt"),
        "text/html" => Some("html"),
        "application/json" => Some("json"),
        "application/zip" => Some("zip"),
        "application/x-tar" => Some("tar"),
        "application/gzip" => Some("gz"),
        "application/x-bzip2" => Some("bz2"),
        "application/x-xz" => Some("xz"),
        "text/csv" => Some("csv"),
        "application/vnd.ms-excel" => Some("xls"),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => Some("xlsx"),
        "application/vnd.ms-powerpoint" => Some("ppt"),
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" => Some("pptx"),
        "application/msword" => Some("doc"),
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => Some("docx"),
        _ => None,
    }
}
#[tauri::command]
async fn download_and_unzip(
    app_handle: tauri::AppHandle,
    file_name: String,
    download_url: String,
    save_path: String,
    emit: bool,
) -> Result<(), String> {
    println!("test");
    // Create HTTP client
    let client = Client::new();
    let save_path2 = save_path.to_owned();
    // Send GET request
    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
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

    // Get content length for progress
    let total_size = response
        .content_length()
        .ok_or("Failed to get content length")?;

    // Prepare file path
    let file_path = Path::new(&save_path).join(&file_name);
    // Create file to write
    let mut file = File::create(&file_path).map_err(|e| e.to_string())?;

    // Stream the response body
    let mut stream = response.bytes_stream();
    let mut downloaded: u64 = 0;

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        // Emit progress event to frontend
        let progress = (downloaded as f64 / total_size as f64) * 100.0;
        if emit {
            app_handle
                .emit("download-progress", progress)
                .map_err(|e| e.to_string())?;
        }
    }

    // Close the file
    drop(file);

    // Unzip the file
    if ext == "zip" {
        let zip_file = File::open(&file_path).map_err(|e| e.to_string())?;
        let mut archive = ZipArchive::new(zip_file).map_err(|e| e.to_string())?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            let outpath = Path::new(&save_path).join(file.sanitized_name());

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
    if emit{
    app_handle
        .emit("fin", save_path2)
        .map_err(|e| e.to_string())?;}
    Ok(())
}
#[tauri::command]
fn get_username() -> String {
    std::env::var("USERNAME").unwrap_or_else(|_| "Unknown".to_string()) 
}
#[tauri::command]
fn exit_app() {
    std::process::exit(0x0);
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            exit_app,
            get_username,
            download_and_unzip
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
