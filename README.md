# 🏞️ Hệ thống Mô phỏng Chất lượng Nước Sông

Ứng dụng mô phỏng chất lượng nước sông Cầu Bây với tích hợp thời tiết thực tế và bản đồ tương tác.

## ✨ Tính năng chính

- **🌊 Mô phỏng chất lượng nước:** Tính toán 5 thông số chất lượng nước (BOD5, NH4+, NO3-)
- **🌡️ Thời tiết thực tế:** Tự động cập nhật dữ liệu thời tiết mỗi 5 phút từ OpenWeather API
- **🗺️ Bản đồ tương tác:** Leaflet/OpenStreetMap miễn phí với nhiều lớp bản đồ
- **📊 Heatmap thời gian thực:** Visualize nồng độ chất ô nhiễm từ dữ liệu mô phỏng
- **📈 Biểu đồ realtime:** Line chart với 6 điểm quan trắc
- **🎨 Canvas visualization:** River map với heatmap tương tác

## 🚀 Cài đặt và chạy

```bash
# Clone project
git clone <repository-url>
cd aisha-assistant-fe

# Cài đặt dependencies
pnpm install

# Tạo file environment (optional)
cp .env.example .env.local
# Chỉnh sửa API keys trong .env.local nếu cần

# Chạy development server
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) trong browser.

## 🔧 Cấu hình API Keys (Tùy chọn)

### OpenWeather API (Cho thời tiết realtime)
1. Đăng ký miễn phí tại [OpenWeatherMap](https://openweathermap.org/api)
2. Thêm vào `.env.local`:
```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
```

## 🎯 Tính năng Heatmap

- **Dữ liệu thực tế:** Heatmap hiển thị nồng độ từ mô phỏng khoa học, không phải dữ liệu mẫu
- **Tương tác:** Chọn thông số BOD5/NH4/NO3 để thay đổi màu sắc heatmap
- **Thời gian thực:** Tự động cập nhật theo thời tiết và thông số môi trường

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
