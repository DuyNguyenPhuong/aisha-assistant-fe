"use client";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
i18n.use(initReactI18next).init({
  fallbackLng: "en",
  debug: process.env.NODE_ENV === "development",
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        wastewaterAssistant: "Wastewater Assistant",
        askAnything:
          "Ask anything about water quality, treatment processes, or generate reports.",
        generalAssistanceTitle: "General Assistance",
        generalAssistance:
          "How can I help with your wastewater operations today?",
        waterQualityTitle: "Water Quality",
        waterQuality:
          "Check water quality parameters and treatment recommendations",
        waterQualityPrompt: "Check water quality parameters",
        reportsTitle: "Reports",
        reports: "Generate water quality reports and compliance documentation",
        reportsPrompt: "Generate water quality reports",
        knowledgeBaseTitle: "Knowledge Base",
        knowledgeBase:
          "Explain wastewater treatment processes and best practices",
        knowledgeBasePrompt: "Explain wastewater treatment processes",
        askAboutWastewaterTreatment: "Ask about wastewater treatment...",
        TSSOutput: "TSS Output",
        CODOutput: "COD Output",
        NH4Output: "NH4 Output",
        pHLevel: "pH Level",
        normal: "Normal",
        alert: "Alert",
        thinking: "Thinking...",
        craftingResponse: "Crafting response...",
        almostThere: "Almost there...",
        errorSavingContext: "Failed to save context",
        contextSaved: "Context saved successfully",
        remember: "Remember",
        rememberDialogTitle: "Remember Context",
        rememberDialogDescription:
          "Add information you want the assistant to remember for this conversation.",
        rememberDialogPlaceholder: "Enter context to remember...",
        rememberButton: "Remember",
        cancel: "Cancel",
        ourLocationTitle: "Our Location",
        ourLocationSubTitle:
          "Our factory is marked on the map below. Explore the area and get a sense of where we are located.",
        riverMapTitle: "River Map Simulation",
        riverMapSubTitle:
          "Interactive river map showing coordinates along an 8000m waterway",
        riverMapFeature1Title: "Interactive Navigation",
        riverMapFeature1Desc:
          "Move your mouse over the river to see precise coordinates",
        riverMapFeature2Title: "8000m Length",
        riverMapFeature2Desc:
          "Simulated river spanning 8 kilometers with natural curves",
        riverMapFeature3Title: "Real Coordinates",
        riverMapFeature3Desc:
          "Live latitude and longitude display based on Hanoi region",
        address: "Address",
        phoneNumber: "Phone Number",
        rememberListTitle: "Remember List",
        rememberListSubtitle:
          "Here are the things you’ve asked me to remember.",
        File: "File",
        Length: "Length",
        lastUpdated: "Last Updated",
        Updated: "Updated",
        characters: "characters",
        Limit: "Limit",
        realAddress:
          "Bishkek Wastewater Treatment Plant, Yubileynaya Street, Bishkek, Kyrgyzstan",
      },
    },
    ru: {
      translation: {
        wastewaterAssistant: "Ассистент по очистке сточных вод",
        askAnything:
          "Задавайте вопросы о качестве воды, процессах очистки или создании отчетов.",
        generalAssistanceTitle: "общая помощь",
        generalAssistance:
          "Как я могу помочь с вашими операциями по очистке сточных вод сегодня?",
        waterQualityTitle: "качество воды",
        waterQuality:
          "Проверьте параметры качества воды и рекомендации по очистке",
        waterQualityPrompt: "Проверьте параметры качества воды",
        reportsTitle: "отчеты",
        reports:
          "Сгенерируйте отчеты о качестве воды и документы по соблюдению нормативов",
        reportsPrompt: "Сгенерируйте отчеты о качестве воды",
        knowledgeBaseTitle: "база знаний",
        knowledgeBase:
          "Объясните процессы очистки сточных вод и лучшие практики",
        knowledgeBasePrompt: "Объясните процессы очистки сточных вод",
        askAboutWastewaterTreatment: "Спросите об очистке сточных вод...",
        TSSOutput: "Показатель TSS",
        CODOutput: "Показатель COD",
        NH4Output: "Показатель NH4",
        pHLevel: "Уровень pH",
        normal: "Нормально",
        alert: "Предупреждение",
        thinking: "Думаю...",
        craftingResponse: "Формирую ответ...",
        almostThere: "Почти готово...",
        errorSavingContext: "Не удалось сохранить контекст",
        contextSaved: "Контекст успешно сохранен",
        remember: "Запомнить",
        rememberDialogTitle: "Запомнить контекст",
        rememberDialogDescription:
          "Добавьте информацию, которую вы хотите, чтобы ассистент запомнил для этого разговора.",
        rememberDialogPlaceholder: "Введите контекст для запоминания...",
        rememberButton: "Запомнить",
        cancel: "Отмена",
        ourLocationTitle: "Наше местоположение",
        ourLocationSubTitle:
          "Наш завод отмечен на карте ниже. Изучите окрестности, чтобы лучше понять, где мы находимся.",
        riverMapTitle: "Симуляция карты реки",
        riverMapSubTitle:
          "Интерактивная карта реки с координатами вдоль 8000-метрового водного пути",
        riverMapFeature1Title: "Интерактивная навигация",
        riverMapFeature1Desc:
          "Наведите курсор на реку, чтобы увидеть точные координаты",
        riverMapFeature2Title: "Длина 8000м",
        riverMapFeature2Desc:
          "Симулированная река протяженностью 8 км с естественными изгибами",
        riverMapFeature3Title: "Реальные координаты",
        riverMapFeature3Desc:
          "Отображение широты и долготы в реальном времени для региона Ханоя",
        address: "Адрес",
        phoneNumber: "Номер телефона",
        rememberListTitle: "Список запомненного",
        rememberListSubtitle: "Вот что вы просили меня запомнить.",
        File: "файл",
        Length: "Длина",
        lastUpdated: "Последнее обновление",
        Updated: "Обновлено",
        characters: "символы",
        Limit: "Лимит",
        realAddress:
          "Бишкекские очистные сооружения, ул. Юбилейная, Бишкек, Кыргызстан",
      },
    },
    vi: {
      translation: {
        wastewaterAssistant: "Trợ lý xử lý nước thải",
        askAnything:
          "Hãy hỏi bất kỳ điều gì về chất lượng nước, quy trình xử lý, hoặc tạo báo cáo.",
        generalAssistanceTitle: "Trợ giúp chung",
        generalAssistance:
          "Hôm nay tôi có thể giúp gì cho hoạt động xử lý nước thải của bạn?",
        waterQualityTitle: "Chất lượng nước",
        waterQuality:
          "Kiểm tra các thông số chất lượng nước và khuyến nghị xử lý",
        waterQualityPrompt: "Kiểm tra các thông số chất lượng nước",
        reportsTitle: "Báo cáo",
        reports: "Tạo báo cáo chất lượng nước và tài liệu tuân thủ",
        reportsPrompt: "Tạo báo cáo chất lượng nước",
        knowledgeBaseTitle: "Cơ sở tri thức",
        knowledgeBase:
          "Giải thích các quy trình xử lý nước thải và các thực tiễn tốt nhất",
        knowledgeBasePrompt: "Giải thích các quy trình xử lý nước thải",
        askAboutWastewaterTreatment: "Hỏi về xử lý nước thải...",
        TSSOutput: "Đầu ra TSS",
        CODOutput: "Đầu ra COD",
        NH4Output: "Đầu ra NH4",
        pHLevel: "Mức pH",
        normal: "Bình thường",
        alert: "Cảnh báo",
        thinking: "Đang suy nghĩ...",
        craftingResponse: "Đang soạn câu trả lời...",
        almostThere: "Sắp xong...",
        errorSavingContext:
          "Ghi nhớ thông tin không thành công, vui lòng thử lại",
        contextSaved: "Ghi nhớ thông tin thành công",
        ourLocationTitle: "Vị trí của chúng tôi",
        ourLocationSubTitle:
          "Nhà máy của chúng tôi được đánh dấu trên bản đồ bên dưới. Hãy khám phá khu vực xung quanh để hiểu rõ hơn về vị trí của chúng tôi.",
        riverMapTitle: "Mô phỏng Bản đồ Sông",
        riverMapSubTitle:
          "Bản đồ sông tương tác hiển thị tọa độ dọc theo dòng sông dài 8000m",
        riverMapFeature1Title: "Điều hướng Tương tác",
        riverMapFeature1Desc:
          "Di chuyển chuột qua sông để xem tọa độ chính xác",
        riverMapFeature2Title: "Dài 8000m",
        riverMapFeature2Desc:
          "Mô phỏng dòng sông trải dài 8 km với các khúc cua tự nhiên",
        riverMapFeature3Title: "Tọa độ Thực",
        riverMapFeature3Desc:
          "Hiển thị kinh độ và vĩ độ trực tiếp dựa trên khu vực Hà Nội",
        address: "Địa chỉ",
        phoneNumber: "Số điện thoại",
        rememberListTitle: "Danh sách đã ghi nhớ",
        rememberListSubtitle:
          "Dưới đây là những điều bạn đã yêu cầu tôi ghi nhớ.",
        File: "Tệp",
        Length: "Độ dài",
        lastUpdated: "Cập nhật lần cuối",
        Updated: "Cập nhật",
        characters: "ký tự",
        Limit: "Giới hạn",
        realAddress:
          "Nhà máy xử lý nước thải Bishkek, Đường Yubileynaya, Bishkek, Kyrgyzstan",
      },
    },
  },
});
export default i18n;
