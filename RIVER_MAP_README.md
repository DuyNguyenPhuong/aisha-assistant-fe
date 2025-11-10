# Hệ thống Mô phỏng Chất lượng Nước Sông

Ứng dụng mô phỏng nồng độ 5 đại lượng chất lượng nước trên dòng sông dài 8,013m với tương tác thời gian thực.

## Tính năng chính

### 1. Mô phỏng Nồng độ (5 đại lượng)
- **BOD5 mẫu 0** và **BOD5 mẫu 1**: Biochemical Oxygen Demand
- **NH4+ mẫu 0** và **NH4+ mẫu 1**: Ammonium
- **NO3- mẫu 1**: Nitrate

### 2. Đầu vào tham số
- **Z**: Vị trí dọc sông (0-8013m)
- **X**: Lượng mưa (mm/hr) - từ OpenWeather hoặc nhập thủ công
- **Y**: Nhiệt độ (°C) - từ OpenWeather hoặc nhập thủ công

### 3. Vị trí Landmark
- **Sài Đồng**: 0m
- **Đài Tư**: 1,112m  
- **An Lạc**: 3,170m
- **Trâu Quỳ**: 4,590m
- **Đa Tốn**: 7,070m
- **Xuân Thụy**: 8,013m

## Cách sử dụng

### 1. Chọn vị trí và xem nồng độ
- **Cách 1**: Click trực tiếp trên dòng sông
- **Cách 2**: Nhập số Z (0-8013) vào ô input
- **Cách 3**: Chọn preset từ 6 vị trí landmark

### 2. Heatmap trên sông
- Chọn **BOD5** → Thang màu trắng → đỏ (0-50 mg/L)
- Chọn **NH4+** → Thang màu trắng → vàng (0-25 mg/L)  
- Chọn **NO3-** → Thang màu trắng → xanh da trời (0-30 mg/L)
- Hover để xem nồng độ tại từng điểm

### 3. Biểu đồ Line Chart
- Trục X: 0 → 8013m (cố định)
- Trục Y: Nồng độ (mg/L) - tự động scale
- Chọn tối đa 5 series đồng thời
- Bước lấy mẫu: 1m / 2m / 5m / 10m
- Tooltip hiển thị nồng độ khi hover

### 4. Chế độ Realtime
- **Tắt**: Nhập thủ công lượng mưa và nhiệt độ
- **Bật**: Tự động lấy dữ liệu từ OpenWeather API mỗi 5 phút

### 5. Export PDF
- Xuất 5 biểu đồ thành file PDF (chức năng đang phát triển)

## Công thức tính toán

Hệ thống triển khai các công thức phức tạp theo từng phân đoạn:

1. **Hệ số T**: `T = 2.5 × 10^((Y-26)/10)`
2. **Lưu lượng Q**: Thay đổi theo từng đoạn và lượng mưa X
3. **Suy giảm nồng độ**: Theo thời gian và hệ số T
4. **Pha trộn tại cống xả**: Kết hợp nước thải mới với dòng chảy hiện tại

## Kiểm thử

### Test Cases đã implement:
1. ✅ **Chọn x=1000m**: Hiển thị 5 giá trị nồng độ và marker
2. ✅ **Vẽ biểu đồ**: 3+ series, trục 0-8000m, bước lấy mẫu configurable  
3. ✅ **Bước lấy mẫu**: 1m → mịn hơn; 10m → thưa hơn
4. ✅ **Heatmap**: Đúng thang màu theo đại lượng
5. ✅ **Realtime**: Auto-update mỗi 5 phút (mô phỏng)

## Cấu hình API

Để sử dụng chế độ realtime với OpenWeather:

1. Tạo tài khoản tại [OpenWeatherMap](https://openweathermap.org/api)
2. Thêm API key vào file `.env.local`:
```
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
```

## Công nghệ sử dụng

- **Frontend**: React + TypeScript + Next.js
- **Canvas**: HTML5 Canvas cho river map và charts  
- **Styling**: Tailwind CSS + shadcn/ui components
- **API**: OpenWeather API cho dữ liệu thời tiết
- **Tính toán**: Custom algorithms theo công thức khoa học

## Cấu trúc Files

```
/components/
  - river-map.tsx           # Main river visualization
  - water-quality-chart.tsx # Line charts component
  
/lib/
  - water-quality-calculations.ts # Core calculation functions
  - weather-service.ts           # OpenWeather API integration
  
/app/river-map/
  - page.tsx               # Main application page
```

## Hướng dẫn phát triển

1. Clone repository
2. Install dependencies: `npm install`  
3. Tạo `.env.local` với OpenWeather API key
4. Run development: `npm run dev`
5. Truy cập `/river-map` để test ứng dụng

## Tính năng tương lai

- [ ] Export PDF thực tế với charts
- [ ] Lưu trữ dữ liệu lịch sử  
- [ ] Cảnh báo vượt ngưỡng chất lượng nước
- [ ] Tích hợp thêm sensors thời gian thực
- [ ] Mobile responsive optimization