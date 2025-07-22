-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создаем таблицу пользователей
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  username VARCHAR(100),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  language_code VARCHAR(10) DEFAULT 'ru',
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем таблицу для кармы автомобилей
CREATE TABLE car_karma (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plate_number VARCHAR(20) NOT NULL UNIQUE,
  karma INTEGER DEFAULT 0,
  total_positive INTEGER DEFAULT 0,
  total_negative INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем таблицу для логирования действий пользователей
CREATE TABLE karma_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  car_karma_id UUID NOT NULL REFERENCES car_karma(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('positive', 'negative')),
  karma_change INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы для оптимизации
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_car_karma_plate_number ON car_karma(plate_number);
CREATE INDEX idx_car_karma_karma ON car_karma(karma);
CREATE INDEX idx_karma_actions_car_karma_id ON karma_actions(car_karma_id);
CREATE INDEX idx_karma_actions_user_id ON karma_actions(user_id);
CREATE INDEX idx_karma_actions_created_at ON karma_actions(created_at);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Добавляем триггеры для обновления updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_car_karma_updated_at 
  BEFORE UPDATE ON car_karma 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();