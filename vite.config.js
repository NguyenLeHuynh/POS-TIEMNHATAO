import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TIỆM NHÀ TÁO POS',
        short_name: 'Nhà Táo POS',
        description: 'Ứng dụng quản lý bán hàng Tiệm Nhà Táo',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone', // Bật chế độ app tràn màn hình (mất thanh trình duyệt)
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/2935/2935307.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/2935/2935307.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})