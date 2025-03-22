'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          "wastewaterAssistant": "Wastewater Assistant",
          "askAnything": "Ask anything about water quality, treatment processes, or generate reports",
          "generalAssistanceTitle": "General Assistance",
          "generalAssistance": "How can I help with your wastewater operations today?",
          "waterQualityTitle": "Water Quality",
          "waterQuality": "Check water quality parameters and treatment recommendations",
          "waterQualityPrompt": "Check water quality parameters",
          "reportsTitle": "Reports",
          "reports": "Generate water quality reports and compliance documentation",
          "reportsPrompt": "Generate water quality reports",
          "knowledgeBaseTitle": "Knowledge Base",
          "knowledgeBase": "Explain wastewater treatment processes and best practices",
          "knowledgeBasePrompt": "Explain wastewater treatment processes",
          "askAboutWastewaterTreatment": "Ask about wastewater treatment...",
          "TSSOutput": "TSS Output",
          "CODOutput": "COD Output",
          "NH4Output": "NH4 Output",
          "pHLevel": "pH Level",
          "normal": "Normal",
          "alert": "Alert",
          "thinking": "Thinking...",
          "craftingResponse": "Crafting response...",
          "almostThere": "Almost there..."
        },
      },
      ru: {
        translation: {
          wastewaterAssistant: "Ассистент по очистке сточных вод",
          "askAnything": "Спросите что угодно о качестве воды, процессах очистки или создании отчетов",
          "generalAssistanceTitle": "общая помощь",
          "generalAssistance": "Как я могу помочь с вашими операциями по очистке сточных вод сегодня?",
          "waterQualityTitle": "качество воды",
          "waterQuality": "Проверьте параметры качества воды и рекомендации по очистке",
          "waterQualityPrompt": "Проверьте параметры качества воды",
          "reportsTitle": "отчеты",
          "reports": "Сгенерируйте отчеты о качестве воды и документы по соблюдению нормативов",
          "reportsPrompt": "Сгенерируйте отчеты о качестве воды",
          "knowledgeBaseTitle": "база знаний",
          "knowledgeBase": "Объясните процессы очистки сточных вод и лучшие практики",
          "knowledgeBasePrompt": "Объясните процессы очистки сточных вод",
          "askAboutWastewaterTreatment": "Спросите об очистке сточных вод...",
          "TSSOutput": "Показатель TSS",
          "CODOutput": "Показатель COD",
          "NH4Output": "Показатель NH4",
          "pHLevel": "Уровень pH",
          "normal": "Нормально",
          "alert": "Предупреждение",
          "thinking": "Думаю...",
          "craftingResponse": "Формирую ответ...",
          "almostThere": "Почти готово..."
        },
      },
      "vi": {
        "translation": {
          "wastewaterAssistant": "Trợ lý xử lý nước thải",
          "askAnything": "Hãy hỏi bất cứ điều gì về chất lượng nước, quy trình xử lý hoặc tạo báo cáo",
          "generalAssistanceTitle": "Trợ giúp chung",
          "generalAssistance": "Hôm nay tôi có thể giúp gì cho hoạt động xử lý nước thải của bạn?",
          "waterQualityTitle": "Chất lượng nước",
          "waterQuality": "Kiểm tra các thông số chất lượng nước và khuyến nghị xử lý",
          "waterQualityPrompt": "Kiểm tra các thông số chất lượng nước",
          "reportsTitle": "Báo cáo",
          "reports": "Tạo báo cáo chất lượng nước và tài liệu tuân thủ",
          "reportsPrompt": "Tạo báo cáo chất lượng nước",
          "knowledgeBaseTitle": "Cơ sở tri thức",
          "knowledgeBase": "Giải thích các quy trình xử lý nước thải và các thực tiễn tốt nhất",
          "knowledgeBasePrompt": "Giải thích các quy trình xử lý nước thải",
          "askAboutWastewaterTreatment": "Hỏi về xử lý nước thải...",
          "TSSOutput": "Đầu ra TSS",
          "CODOutput": "Đầu ra COD",
          "NH4Output": "Đầu ra NH4",
          "pHLevel": "Mức pH",
          "normal": "Bình thường",
          "alert": "Cảnh báo",
          "thinking": "Đang suy nghĩ...",
          "craftingResponse": "Đang soạn câu trả lời...",
          "almostThere": "Sắp xong..."
        }
      }
    },
  });

export default i18n;
