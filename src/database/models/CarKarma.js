import { supabase } from '../../config/supabase.js';

class CarKarma {
  static async findByPlateNumber(plateNumber) {
    const normalizedPlate = this.normalizePlateNumber(plateNumber);
    
    const { data, error } = await supabase
      .from('car_karma')
      .select('*')
      .eq('plate_number', normalizedPlate)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data;
  }

  static async checkUserDailyAction(plateNumber, userId) {
    const normalizedPlate = this.normalizePlateNumber(plateNumber);
    
    // Получаем начало текущего дня (00:00:00)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000); // Завтра 00:00:00
    
    const { data, error } = await supabase
      .from('karma_actions')
      .select(`
        id,
        car_karma!inner(plate_number)
      `)
      .eq('user_id', userId)
      .eq('car_karma.plate_number', normalizedPlate)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());
    
    if (error) {
      throw error;
    }
    
    return data && data.length > 0;
  }

  static async createOrUpdate(plateNumber, karmaChange, userId, action, description = null) {
    const normalizedPlate = this.normalizePlateNumber(plateNumber);
    
    // Проверяем, оценивал ли пользователь этот номер сегодня
    const hasActionToday = await this.checkUserDailyAction(plateNumber, userId);
    if (hasActionToday) {
      throw new Error('USER_ALREADY_RATED_TODAY');
    }
    
    // Сначала пытаемся найти существующую запись
    let existingCar = await this.findByPlateNumber(plateNumber);
    
    if (existingCar) {
      // Обновляем существующую запись
      const newKarma = existingCar.karma + karmaChange;
      const { data, error } = await supabase
        .from('car_karma')
        .update({ 
          karma: newKarma,
          total_positive: action === 'positive' ? existingCar.total_positive + 1 : existingCar.total_positive,
          total_negative: action === 'negative' ? existingCar.total_negative + 1 : existingCar.total_negative,
          updated_at: new Date().toISOString()
        })
        .eq('plate_number', normalizedPlate)
        .select()
        .single();

      if (error) throw error;
      existingCar = data;
    } else {
      // Создаем новую запись
      const { data, error } = await supabase
        .from('car_karma')
        .insert([{
          plate_number: normalizedPlate,
          karma: karmaChange,
          total_positive: action === 'positive' ? 1 : 0,
          total_negative: action === 'negative' ? 1 : 0
        }])
        .select()
        .single();

      if (error) throw error;
      existingCar = data;
    }

    // Записываем действие в лог
    await this.logAction(existingCar.id, userId, action, karmaChange, description);
    
    return existingCar;
  }

  static async logAction(carKarmaId, userId, action, karmaChange, description = null) {
    const { error } = await supabase
      .from('karma_actions')
      .insert([{
        car_karma_id: carKarmaId,
        user_id: userId,
        action_type: action,
        karma_change: karmaChange,
        description: description
      }]);

    if (error) throw error;
  }

  static async getTopCars(limit = 10, orderBy = 'karma') {
    const { data, error } = await supabase
      .from('car_karma')
      .select('*')
      .order(orderBy, { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getWorstCars(limit = 10) {
    const { data, error } = await supabase
      .from('car_karma')
      .select('*')
      .order('karma', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getUserActions(userId, limit = 20) {
    const { data, error } = await supabase
      .from('karma_actions')
      .select(`
        *,
        car_karma(plate_number)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static normalizePlateNumber(plateNumber) {
    // Убираем пробелы и приводим к верхнему регистру
    // Также можно добавить дополнительную нормализацию
    return plateNumber.toString().replace(/\s+/g, '').toUpperCase();
  }

  static validatePlateNumber(plateNumber) {
    const normalized = this.normalizePlateNumber(plateNumber);
    
    // Простая проверка для российских номеров
    // Можно расширить под разные форматы
    const russianPlateRegex = /^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/;
    const simpleRegex = /^[A-Z0-9]{5,10}$/;
    
    return russianPlateRegex.test(normalized) || simpleRegex.test(normalized);
  }
}

export default CarKarma; 