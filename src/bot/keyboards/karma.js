import { Markup } from 'telegraf';

export const mainMenuKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🔍 Проверить карму авто', 'check_karma'),
      Markup.button.callback('📝 Оценить водителя', 'rate_driver')
    ],
    [
      Markup.button.callback('🏆 Топ лучших', 'top_cars'),
      Markup.button.callback('💩 Топ худших', 'worst_cars')
    ],
    [
      Markup.button.callback('📈 Моя активность', 'my_activity'),
      Markup.button.callback('ℹ️ Помощь', 'help')
    ]
  ]);
};

export const karmaActionKeyboard = (plateNumber) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('👍 Хорошо (+1)', `karma_positive_${plateNumber}`),
      Markup.button.callback('👎 Плохо (-1)', `karma_negative_${plateNumber}`)
    ],
    [
      Markup.button.callback('🔙 Назад', 'main_menu')
    ]
  ]);
};

export const backToMenuKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Главное меню', 'main_menu')]
  ]);
};

export const confirmActionKeyboard = (action, plateNumber) => {
  const actionText = action === 'positive' ? 'положительную' : 'отрицательную';
  
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(`✅ Да, добавить ${actionText}`, `confirm_${action}_${plateNumber}`),
      Markup.button.callback('❌ Отмена', 'main_menu')
    ]
  ]);
};

export const ratingOptionsKeyboard = (plateNumber) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('😇 Очень хорошо (+3)', `karma_excellent_${plateNumber}`),
      Markup.button.callback('👍 Хорошо (+1)', `karma_positive_${plateNumber}`)
    ],
    [
      Markup.button.callback('👎 Плохо (-1)', `karma_negative_${plateNumber}`),
      Markup.button.callback('😡 Очень плохо (-3)', `karma_terrible_${plateNumber}`)
    ],
    [
      Markup.button.callback('🔙 Назад', 'main_menu')
    ]
  ]);
}; 