import User from '../../database/models/User.js';

const authMiddleware = async (ctx, next) => {
  try {
    if (ctx.from) {
      // Находим или создаем пользователя
      let user = await User.findByTelegramId(ctx.from.id);
      
      if (!user) {
        // Создаем нового пользователя
        user = await User.create({
          telegramId: ctx.from.id,
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
          languageCode: ctx.from.language_code
        });
      } else {
        // Обновляем активность существующего пользователя
        await User.updateActivity(ctx.from.id);
      }
      
      // Сохраняем пользователя в контексте
      ctx.state = ctx.state || {};
      ctx.state.user = user;
    }
    
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return next();
  }
};

export default authMiddleware; 