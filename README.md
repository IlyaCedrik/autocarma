# Freelance Telegram Bot

Telegram бот для уведомлений о новых фриланс заказах с системой подписок и платежей.

## 🚀 Функции

- 📂 Подписка на категории заказов
- 💰 Система платежей через Telegram Payments
- 📱 Ежедневные уведомления о новых заказах
- 🔄 Автоматический парсинг заказов с freelance.ru, fl.ru и других платформ
- 📊 Отслеживание подписок и платежей

## 🛠 Технологии

- **Node.js** - Runtime
- **Telegraf.js** - Telegram Bot Framework
- **Supabase** - База данных и бэкенд
- **Express.js** - Веб-сервер для webhook'ов
- **node-cron** - Планировщик задач

## 📦 Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd freelance_bot
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте переменные окружения:
```bash
cp .env.example .env
# Отредактируйте .env файл
```

4. Настройте Supabase:
- Создайте проект в [Supabase](https://supabase.com)
- Выполните миграции из `supabase/migrations/`
- Заполните базу тестовыми данными:
```bash
npm run db:seed
```

5. Запустите бота:
```bash
# Development
npm run dev

# Production
npm start
```

## ⚙️ Настройка

### Telegram Bot
1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен и добавьте в `.env`
3. Настройте платежи через [@BotFather](https://t.me/BotFather)

### Supabase
1. Создайте проект в Supabase
2. Скопируйте URL и ключи в `.env`
3. Выполните SQL миграции
4. Настройте RLS политики (если нужно)

### Webhook (Production)
```bash
# Установите webhook URL
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/webhook"}'
```

## 📁 Структура проекта

```
src/
├── bot/                 # Telegram bot логика
│   ├── handlers/        # Обработчики команд
│   ├── keyboards/       # Клавиатуры
│   ├── middleware/      # Мидлвари
│   └── scenes/         # Сцены диалогов
├── database/           # Модели и миграции
│   └── models/         # Модели данных
├── services/           # Бизнес-логика
└── config/            # Конфигурация
```

## 🔄 Планировщик

Бот автоматически:
- Отправляет уведомления каждый день в 9:00
- Парсит новые заказы каждый час
- Проверяет истекающие подписки

## 💳 Платежи

Поддерживается:
- Telegram Payments API
- Оплата банковскими картами
- Автоматическая активация подписок

## 🚀 Деплой

### Railway
1. Подключите GitHub репозиторий
2. Добавьте переменные окружения
3. Деплой произойдет автоматически

### Render
1. Создайте новый веб-сервис
2. Подключите репозиторий
3. Настройте переменные окружения

## 📝 API

### Основные команды
- `/start` - Начало работы
- `/categories` - Просмотр категорий
- `/settings` - Настройки
- `/help` - Справка

### Callback действия
- `subscribe_{categoryId}` - Подписка на категорию
- `pay_{categoryId}` - Оплата подписки
- `unsubscribe_{categoryId}` - Отписка

## 🔧 Разработка

### Запуск в режиме разработки
```bash
npm run dev
```

### Тестирование
```bash
npm test
```

### Линтинг
```bash
npm run lint
```

## 📊 Мониторинг

Логи доступны:
- В консоли (development)
- В файлах (production)
- В Supabase Dashboard

## 🤝 Поддержка

Для вопросов и поддержки:
- Создайте Issue в GitHub
- Напишите в Telegram: @your_support_username

## 📄 Лицензия

MIT License 