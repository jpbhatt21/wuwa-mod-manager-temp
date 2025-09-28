import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

let imageServerUrl: string | null = null;

/**
 * Get the image server URL
 * This function will be called automatically when the app starts
 */
export async function getImageServerUrl(): Promise<string> {
  if (imageServerUrl) {
    return imageServerUrl;
  }
  
  try {
    imageServerUrl = await invoke<string>('get_image_server_url');
    return imageServerUrl;
  } catch (error) {
    console.error('Failed to get image server URL:', error);
    // Fallback to default
    return 'http://127.0.0.1:5000';
  }
}

/**
 * Build a preview image URL for a given directory path
 * @param directoryPath - The directory path containing the preview image
 * @returns Complete URL to the preview image
 */
export async function buildPreviewImageUrl(directoryPath: string): Promise<string> {
  const baseUrl = await getImageServerUrl();
  // Encode the path to handle special characters and spaces
  const encodedPath = encodeURIComponent(directoryPath);
  return `${baseUrl}/preview/${encodedPath}`;
}

/**
 * Check if the image server is healthy
 * @returns Promise that resolves to true if healthy, false otherwise
 */
export async function checkImageServerHealth(): Promise<boolean> {
  try {
    const baseUrl = await getImageServerUrl();
    const response = await fetch(`${baseUrl}/health`);
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Image server health check failed:', error);
    return false;
  }
}

/**
 * Listen for image server events
 * Call this in your app initialization
 */
export function setupImageServerListeners() {
  // Listen for server ready event
  listen<string>('image-server-ready', (event) => {
    console.log('Image server is ready:', event.payload);
    imageServerUrl = event.payload;
  });

  // Listen for server error event
  listen<string>('image-server-error', (event) => {
    console.error('Image server error:', event.payload);
  });
}

/**
 * Preload image with error handling
 * @param url - The image URL to preload
 * @returns Promise that resolves when image is loaded or rejects on error
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Get preview image with fallback handling
 * @param directoryPath - Directory path containing preview image
 * @param fallbackSrc - Optional fallback image source
 * @returns Promise resolving to image URL or fallback
 */
export async function getPreviewImageWithFallback(
  directoryPath: string,
  fallbackSrc?: string
): Promise<string> {
  try {
    const imageUrl = await buildPreviewImageUrl(directoryPath);
    
    // Try to preload the image to verify it exists
    await preloadImage(imageUrl);
    return imageUrl;
  } catch (error) {
    console.warn(`Failed to load preview image for ${directoryPath}:`, error);
    
    if (fallbackSrc) {
      return fallbackSrc;
    }
    
    // Return a default placeholder or throw
    throw new Error(`No preview image available for ${directoryPath}`);
  }
}