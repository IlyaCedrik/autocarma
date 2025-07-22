# 🛠 Настройка AutoKarma Bot

Пошаговая инструкция по настройке и запуску AutoKarma Bot для оценки водителей.

## 📋 Предварительные требования

- **Node.js** 18+ ([скачать](https://nodejs.org/))
- **Telegram Bot Token** (создать через [@BotFather](https://t.me/BotFather))
- **Supabase аккаунт** ([создать](https://supabase.com/))

## 🚀 Быстрая настройка

### 1. Создание Telegram бота

1. Открыть [@BotFather](https://t.me/BotFather) в Telegram
2. Отправить `/newbot`
3. Указать имя бота: `AutoKarma Bot`
4. Указать username: `@your_autokarma_bot`
5. Скопировать токен бота

### 2. Настройка Supabase

1. Создать новый проект в [Supabase](https://supabase.com/dashboard)
2. Перейти в **Settings** → **API**
3. Скопировать:
   - `Project URL`
   - `anon public` ключ

### 3. Конфигурация проекта

Создать файл `.env` в корне проекта:

```env
# Telegram Bot
BOT_TOKEN=1234567890:ABCDefGhIjKlMnOpQrStUvWxYz

# Supabase
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server
PORT=3000
NODE_ENV=development

# Production only (для деплоя)
WEBHOOK_URL=https://your-domain.com
```

### 4. Установка зависимостей

```bash
npm install
```

### 5. Настройка базы данных

```bash
# Применить миграции (создать таблицы)
# Если используете Supabase CLI:
supabase migration up

# Или выполнить SQL вручную из файла:
# supabase/migrations/002_car_karma_schema.sql
```

### 6. Заполнение тестовыми данными

```bash
npm run seed
```

### 7. Запуск бота

```bash
# Режим разработки (polling)
npm run dev

# Продакшен
npm start
```

## 🔧 Расширенная настройка

### Supabase настройка

1. **Выполнить миграции:**
   - Перейти в **SQL Editor** в Supabase Dashboard
   - Выполнить содержимое `supabase/migrations/001_initial_schema.sql`
   - Выполнить содержимое `supabase/migrations/002_car_karma_schema.sql`

2. **Проверить таблицы:**
   - `users` - пользователи Telegram
   - `car_karma` - карма автомобилей
   - `karma_actions` - история действий

### Webhook настройка (Production)

Для продакшена нужно настроить webhook:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/webhook"}'
```

## 🔍 Проверка настройки

### 1. Проверка подключения к БД

```bash
# Запустить бота в dev режиме
npm run dev

# Открыть в браузере
http://localhost:3000/health
```

Должен вернуться JSON с информацией о состоянии.

### 2. Проверка бота

1. Найти бота в Telegram
2. Отправить `/start`
3. Проверить работу меню

### 3. Тестирование функций

1. **Проверка кармы:** Введите `А123ВС777`
2. **Оценка водителя:** Введите номер и выберите оценку
3. **Топы:** Проверьте списки лучших/худших

## 🚀 Деплой

### Railway
1. Подключить GitHub репозиторий
2. Добавить переменные окружения
3. Деплой автоматический

### Render
1. Создать Web Service
2. Подключить репозиторий
3. Настроить переменные окружения
4. Установить Start Command: `npm start`

### Heroku
```bash
heroku create your-autokarma-bot
heroku config:set BOT_TOKEN=your_token
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_ANON_KEY=your_key
heroku config:set WEBHOOK_URL=https://your-autokarma-bot.herokuapp.com
git push heroku main
```

## 🔧 Решение проблем

### Бот не отвечает
- Проверить BOT_TOKEN в .env
- Убедиться что бот запущен через @BotFather
- Проверить логи в консоли

### Ошибки базы данных
- Проверить SUPABASE_URL и SUPABASE_ANON_KEY
- Убедиться что миграции выполнены
- Проверить подключение к интернету

### Webhook не работает
- Проверить HTTPS сертификат
- Убедиться что webhook URL доступен
- Проверить правильность установки webhook

## 📚 Полезные команды

```bash
# Разработка
npm run dev              # Запуск в режиме разработки
npm run seed            # Заполнение тестовыми данными

# Проверка
curl localhost:3000/health  # Проверка здоровья сервиса

# База данных  
supabase start          # Локальный Supabase (если установлен)
supabase migration up   # Применить миграции
```

## 🔐 Безопасность

- Никогда не коммитьте `.env` файл
- Используйте переменные окружения в продакшене
- Регулярно обновляйте зависимости: `npm audit`

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте эту инструкцию еще раз
2. Посмотрите логи в консоли
3. Создайте Issue в GitHub репозитории

---

🚗 Удачного использования AutoKarma Bot! 💙 