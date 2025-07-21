# 💳 Настройка платежей в Telegram Bot

## 🚀 Быстрая настройка (для тестирования)

1. **Откройте [@BotFather](https://t.me/BotFather)**
2. **Отправьте:** `/mybots`
3. **Выберите вашего бота**
4. **Bot Settings → Payments**
5. **Выберите "Stripe TEST"** (для тестирования)
6. **Скопируйте полученный токен**

## 📝 Подробная инструкция

### 1. Тестовый провайдер (для разработки)

```bash
# В BotFather:
/mybots → Ваш бот → Bot Settings → Payments → Stripe TEST

# Получите токен вида:
284685063:TEST:YWY0NGJlMzEwMmI2
```

### 2. YooKassa (для России)

1. **Регистрация:**
   - Зайдите на [yookassa.ru](https://yookassa.ru)
   - Создайте магазин
   - Пройдите модерацию

2. **Получение ключей:**
   ```
   Shop ID: 123456
   Secret Key: test_ABCDEF123456789
   ```

3. **Настройка в BotFather:**
   ```
   /mybots → Ваш бот → Bot Settings → Payments → YooKassa
   Введите Shop ID и Secret Key
   ```

### 3. Stripe (международный)

1. **Регистрация:**
   - Зайдите на [stripe.com](https://stripe.com)
   - Создайте аккаунт
   - Подтвердите данные

2. **Получение ключей:**
   ```
   Publishable key: pk_test_ABCDEF123456789
   Secret key: sk_test_ABCDEF123456789
   ```

3. **Настройка в BotFather:**
   ```
   /mybots → Ваш бот → Bot Settings → Payments → Stripe
   Введите Publishable key и Secret key
   ```

## ⚡ Обновление .env файла

После получения токена обновите `.env`:

```bash
# Замените:
TELEGRAM_PAYMENT_TOKEN=test_payment_token

# На реальный токен:
TELEGRAM_PAYMENT_TOKEN=284685063:TEST:YWY0NGJlMzEwMmI2
```

## 🧪 Тестирование платежей

```bash
# 1. Обновите .env файл
# 2. Перезапустите бота
npm run dev

# 3. В Telegram:
/start → Категории → Выберите категорию → Оплатить
```

## 💡 Тестовые карты

### Stripe TEST:
```
Номер: 4242 4242 4242 4242
MM/YY: 12/34
CVC: 123
```

### YooKassa TEST:
```
Номер: 5555 5555 5555 4444
MM/YY: 12/24
CVC: 123
```

## 🚨 Важные моменты

1. **Тестовые токены** работают только с тестовыми картами
2. **Продакшен токены** требуют настоящие карты и модерацию
3. **Webhook'и** настраиваются автоматически через Telegram
4. **Комиссии** зависят от выбранного провайдера

## 📊 Сравнение провайдеров

| Провайдер | Комиссия | Регионы | Модерация |
|-----------|----------|---------|-----------|
| **Stripe TEST** | 0% | 🌍 | Нет |
| **YooKassa** | 2.8% | 🇷🇺 | Да |
| **Stripe** | 2.9% + $0.30 | 🌍 | Да |

## 🔧 Отладка проблем

| Ошибка | Решение |
|--------|---------|
| `PAYMENT_PROVIDER_INVALID` | Неверный токен в `.env` |
| `Bad Request: CURRENCY_TOTAL_AMOUNT_INVALID` | Проверьте сумму (в копейках) |
| `Bad Request: PROVIDER_DATA_INVALID` | Неверные данные провайдера | 