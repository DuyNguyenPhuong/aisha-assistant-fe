# Hướng dẫn khắc phục lỗi Google Maps

## Vấn đề: "For development purposes only"

Khi sử dụng Google Maps mà thấy watermark "For development purposes only", điều này có nghĩa là:

### Nguyên nhân:
1. **Chưa có API key**: Thiếu hoặc API key không đúng
2. **Chưa enable billing**: Google Maps yêu cầu kích hoạt billing (thanh toán)
3. **API key bị hạn chế**: Domain hiện tại không được phép sử dụng

### Cách khắc phục:

#### Option 1: Sửa Google Maps (Phức tạp, tốn phí)
1. **Tạo API key:**
   - Vào [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Tạo project mới hoặc chọn project có sẵn
   - Enable "Maps JavaScript API"
   - Tạo API key và copy vào file `.env.local`:
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
     ```

2. **Kích hoạt Billing:**
   - Vào [Google Cloud Billing](https://console.cloud.google.com/billing)
   - Thêm phương thức thanh toán (thẻ tín dụng)
   - Liên kết với project đang dùng

3. **Cấu hình restrictions:**
   - Hạn chế API key theo domain
   - Thêm `localhost:3000` và domain production

#### Option 2: Dùng Leaflet/OpenStreetMap (Khuyên dùng, Miễn phí)
✅ **Ưu điểm:**
- Hoàn toàn miễn phí
- Không cần API key
- Nhiều loại bản đồ: đường phố, vệ tinh, địa hình
- Hỗ trợ heatmap mạnh mẽ
- Không có giới hạn requests
- Open source

✅ **Cách sử dụng:**
1. Trong app, chọn tab "🗺️ OpenStreetMap (Miễn phí)"
2. Tất cả tính năng đều hoạt động bình thường
3. Có thêm demo heatmap cho chất lượng nước

## So sánh chi tiết:

| Tính năng | Google Maps | Leaflet/OpenStreetMap |
|-----------|-------------|----------------------|
| **Giá cả** | Tốn phí sau 28,500 loads/tháng | Hoàn toàn miễn phí |
| **API Key** | Bắt buộc + Billing | Không cần |
| **Chất lượng hình ảnh** | Rất cao | Cao |
| **Bản đồ vệ tinh** | Có | Có (ArcGIS) |
| **3D Buildings** | Có | Không |
| **Heatmap** | Có (phức tạp) | Có (dễ dùng) |
| **Tùy chỉnh** | Hạn chế | Rất linh hoạt |
| **Offline** | Không | Có thể cache |
| **Performance** | Tốt | Rất tốt |

## Khuyến nghị:

🎯 **Cho dự án này:** Dùng Leaflet/OpenStreetMap
- Tiết kiệm chi phí
- Đáp ứng đủ tất cả yêu cầu
- Heatmap tốt hơn cho data visualization
- Không phụ thuộc vào API của bên thứ 3

📱 **Cách chuyển đổi:**
- Click tab "🗺️ OpenStreetMap (Miễn phí)" trong app
- Tất cả tính năng sẽ hoạt động tốt hơn

## Lưu ý về Leaflet:

- Tự động load thư viện từ CDN (không cần cài đặt)
- Hỗ trợ multiple tile layers
- Plugin heatmap mạnh mẽ
- Responsive trên mobile
- Có thể tùy chỉnh marker, popup, style