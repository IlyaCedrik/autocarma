-- Создаем составной индекс для быстрой проверки дневных ограничений
-- user_id + car_karma_id + created_at (дата) для быстрого поиска действий пользователя за день
CREATE INDEX idx_karma_actions_user_car_date ON karma_actions(user_id, car_karma_id, created_at);

-- Создаем индекс только по дате создания для быстрой фильтрации по времени  
CREATE INDEX idx_karma_actions_created_at_date ON karma_actions(DATE(created_at));
