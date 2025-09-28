import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(), 
		tailwindcss()
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	
	// Build optimizations
	build: {
		// Enable minification
		minify: 'terser',
		// Generate sourcemaps for debugging (disabled for smaller bundle)
		sourcemap: false,
		// Optimize bundle splitting
		rollupOptions: {
			output: {
				// Manual chunk splitting for better caching
				manualChunks: {
					'react-vendor': ['react', 'react-dom'],
					'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-checkbox'],
					'tauri-vendor': ['@tauri-apps/api', '@tauri-apps/plugin-dialog', '@tauri-apps/plugin-fs', '@tauri-apps/plugin-http'],
					'state-vendor': ['jotai'],
					'motion-vendor': ['motion', 'embla-carousel-react', 'embla-carousel-autoplay']
				},
				// Optimize chunk file naming
				chunkFileNames: 'assets/js/[name]-[hash].js',
				entryFileNames: 'assets/js/[name]-[hash].js',
				assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
			}
		},
		// Increase chunk size warning limit for large libraries
		chunkSizeWarningLimit: 1000,
		// Target modern browsers for smaller bundles
		target: 'esnext'
	},

	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: "ws",
					host,
					port: 1421,
			  }
			: undefined,
		watch: {
			// 3. tell vite to ignore watching `src-tauri` and other non-essential directories
			ignored: ["**/src-tauri/**", "**/src-py/**", "**/node_modules/**"],
		},
	},
	
	// Optimize dependencies
	optimizeDeps: {
		include: [
			'react',
			'react-dom',
			'@tauri-apps/api',
			'jotai',
			'motion'
		],
		// Exclude heavy dependencies that should be loaded on demand
		exclude: ['@tauri-apps/cli']
	}
});
