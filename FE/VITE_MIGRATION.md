# Migration to Vite - IoT Dashboard

## Tổng quan
Dự án đã được chuyển đổi từ Create React App sang Vite để có hiệu suất tốt hơn và trải nghiệm phát triển nhanh hơn.

## Thay đổi chính

### 1. Cấu hình Vite
- **File**: `vite.config.js`
- **Tính năng**:
  - Hot Module Replacement (HMR) nhanh hơn
  - Proxy cho API backend (port 5000)
  - WebSocket proxy cho real-time updates
  - Code splitting tự động
  - Build optimization

### 2. Biểu đồ mới với Chart.js
- **Thay thế**: Recharts → Chart.js + react-chartjs-2
- **Tính năng mới**:
  - Animation mượt mà hơn
  - Tooltip tùy chỉnh
  - Time scale với date-fns adapter
  - Responsive design tốt hơn
  - Dark mode support
  - Gradient backgrounds
  - Modern styling

### 3. Scripts mới
```bash
# Development server
npm run dev
# hoặc
npm start

# Build for production
npm run build

# Preview production build
npm run preview
```

## Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
cd FE
npm install
```

### 2. Chạy development server
```bash
npm run dev
```

### 3. Build cho production
```bash
npm run build
```

## Tính năng biểu đồ mới

### 1. Thiết kế hiện đại
- Gradient backgrounds
- Smooth animations
- Modern typography (Inter font)
- Glass morphism effects
- Responsive design

### 2. Tương tác tốt hơn
- Hover effects
- Custom tooltips
- Real-time updates
- Loading states
- Error handling

### 3. Performance
- Lazy loading
- Code splitting
- Optimized rendering
- Memory efficient

## Cấu trúc file mới

```
FE/
├── vite.config.js          # Cấu hình Vite
├── index.html              # Entry point cho Vite
├── package.json            # Scripts và dependencies mới
└── src/
    └── components/
        └── Dashboard/
            ├── TemperatureHumidityChart.js  # Biểu đồ mới
            └── TemperatureHumidityChart.css # Styling mới
```

## Lợi ích của Vite

1. **Faster Development**:
   - Cold start nhanh hơn 10-100x
   - HMR instant
   - Native ES modules

2. **Better Performance**:
   - Tree shaking tốt hơn
   - Code splitting tự động
   - Optimized builds

3. **Modern Tooling**:
   - TypeScript support
   - CSS preprocessing
   - Plugin ecosystem

## Troubleshooting

### Lỗi thường gặp

1. **Port đã được sử dụng**:
   ```bash
   # Thay đổi port trong vite.config.js
   server: { port: 3001 }
   ```

2. **Proxy không hoạt động**:
   - Kiểm tra backend server đang chạy trên port 5000
   - Kiểm tra cấu hình proxy trong vite.config.js

3. **Chart không hiển thị**:
   - Kiểm tra console errors
   - Đảm bảo data format đúng
   - Kiểm tra Chart.js registration

## Migration Notes

- **Recharts** → **Chart.js**: Thay đổi API và cấu hình
- **CSS Modules**: Không cần thiết với Vite
- **Environment Variables**: Sử dụng `import.meta.env` thay vì `process.env`
- **Public Assets**: Đặt trong thư mục `public/`

## Next Steps

1. Test tất cả tính năng
2. Optimize bundle size
3. Add TypeScript support
4. Implement PWA features
5. Add unit tests với Vitest
