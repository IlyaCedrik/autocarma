import CarKarma from '../../database/models/CarKarma.js';
import User from '../../database/models/User.js';
import { mainMenuKeyboard, karmaActionKeyboard, backToMenuKeyboard, ratingOptionsKeyboard } from '../keyboards/karma.js';
import messageManager from '../utils/messageManager.js';

class KarmaHandler {
  static async startHandler(ctx) {
    const welcomeText = `
🚗 *Добро пожаловать в AutoKarma Bot!*

Оценивайте водителей и проверяйте карму автомобилей по номерам.

*Как это работает:*
• Введите номер авто для проверки кармы
• Оцените водителя: хорошо (+1) или плохо (-1) 
• Смотрите топы лучших и худших водителей

Выберите действие:
    `;

    await messageManager.editOrSendMessage(ctx, welcomeText, {
      reply_markup: mainMenuKeyboard().reply_markup,
      parse_mode: 'Markdown'
    });
  }

  static async checkKarmaHandler(ctx) {
    const message = `
🔍 *Проверить карму автомобиля*

Введите номер автомобиля для проверки его кармы.

*Примеры форматов:*
• А123ВС77
• M456KX199  
• a123bc77 (регистр не важен)

Просто отправьте номер в следующем сообщении:
    `;

    await messageManager.editOrSendMessage(ctx, message, {
      reply_markup: backToMenuKeyboard().reply_markup,
      parse_mode: 'Markdown'
    });

    // Устанавливаем состояние ожидания номера
    ctx.session.waitingFor = 'plate_number_check';
  }

  static async rateDriverHandler(ctx) {
    const message = `
📝 *Оценить водителя*

Введите номер автомобиля, водителя которого хотите оценить.

*Примеры форматов:*
• А123ВС77
• M456KX199
• a123bc77 (регистр не важен)

Просто отправьте номер в следующем сообщении:
    `;

    await messageManager.editOrSendMessage(ctx, message, {
      reply_markup: backToMenuKeyboard().reply_markup,
      parse_mode: 'Markdown'
    });

    // Устанавливаем состояние ожидания номера для оценки
    ctx.session.waitingFor = 'plate_number_rate';
  }

  static async handlePlateNumberInput(ctx) {
    const plateNumber = ctx.message.text.trim();
    
    if (!CarKarma.validatePlateNumber(plateNumber)) {
      await messageManager.sendMessage(ctx, '❌ Неверный формат номера. Попробуйте еще раз или вернитесь в главное меню.', {
        reply_markup: backToMenuKeyboard().reply_markup
      });
      return;
    }

    const waitingFor = ctx.session.waitingFor;
    
    if (waitingFor === 'plate_number_check') {
      await this.showCarKarma(ctx, plateNumber);
    } else if (waitingFor === 'plate_number_rate') {
      await this.showRatingOptions(ctx, plateNumber);
    }

    ctx.session.waitingFor = null;
  }

  static async showCarKarma(ctx, plateNumber) {
    try {
      const carKarma = await CarKarma.findByPlateNumber(plateNumber);
      
      let message;
      if (carKarma) {
        const karmaEmoji = carKarma.karma > 0 ? '😊' : carKarma.karma < 0 ? '😞' : '😐';
        
        message = `
🚗 *Номер:* \`${carKarma.plate_number}\`

${karmaEmoji} *Карма:* ${carKarma.karma}

📊 *Статистика:*
👍 Положительных оценок: ${carKarma.total_positive}
👎 Отрицательных оценок: ${carKarma.total_negative}

*Хотите оценить этого водителя?*
        `;
        
        await messageManager.sendMessage(ctx, message, {
          reply_markup: ratingOptionsKeyboard(carKarma.plate_number).reply_markup,
          parse_mode: 'Markdown'
        });
      } else {
        message = `
🚗 *Номер:* \`${CarKarma.normalizePlateNumber(plateNumber)}\`

😐 *Карма:* 0 (новый автомобиль)

Пока никто не оценивал этого водителя.

*Хотите быть первым?*
        `;
        
        await messageManager.sendMessage(ctx, message, {
          reply_markup: ratingOptionsKeyboard(CarKarma.normalizePlateNumber(plateNumber)).reply_markup,
          parse_mode: 'Markdown'
        });
      }
    } catch (error) {
      console.error('Error showing car karma:', error);
      await messageManager.sendMessage(ctx, '❌ Произошла ошибка при получении информации о карме. Попробуйте позже.', {
        reply_markup: backToMenuKeyboard().reply_markup
      });
    }
  }

  static async showRatingOptions(ctx, plateNumber) {
    const message = `
📝 *Оценить водителя*

🚗 *Номер:* \`${CarKarma.normalizePlateNumber(plateNumber)}\`

Как бы вы оценили поведение этого водителя?
    `;

    await messageManager.sendMessage(ctx, message, {
      reply_markup: ratingOptionsKeyboard(CarKarma.normalizePlateNumber(plateNumber)).reply_markup,
      parse_mode: 'Markdown'
    });
  }

  static async addKarma(ctx, plateNumber, action) {
    try {
      const user = ctx.state.user;
      
      // Определяем изменение кармы в зависимости от действия
      let karmaChange;
      let actionText;
      
      switch (action) {
        case 'excellent':
          karmaChange = 3;
          actionText = 'очень хорошую';
          break;
        case 'positive':
          karmaChange = 1;
          actionText = 'положительную';
          break;
        case 'negative':
          karmaChange = -1;
          actionText = 'отрицательную';
          break;
        case 'terrible':
          karmaChange = -3;
          actionText = 'очень плохую';
          break;
        default:
          throw new Error('Invalid action type');
      }

      const updatedCar = await CarKarma.createOrUpdate(
        plateNumber, 
        karmaChange, 
        user.id, 
        action === 'excellent' || action === 'positive' ? 'positive' : 'negative'
      );

      const karmaEmoji = updatedCar.karma > 0 ? '😊' : updatedCar.karma < 0 ? '😞' : '😐';
      
      const message = `
✅ *Оценка добавлена!*

🚗 *Номер:* \`${updatedCar.plate_number}\`
📊 *Карма:* ${updatedCar.karma} ${karmaEmoji}

Вы добавили ${actionText} оценку (${karmaChange > 0 ? '+' : ''}${karmaChange}).

Спасибо за вашу активность! 🙏
      `;

      await messageManager.editOrSendMessage(ctx, message, {
        reply_markup: backToMenuKeyboard().reply_markup,
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Error adding karma:', error);
      
      if (error.message === 'USER_ALREADY_RATED_TODAY') {
        const message = `
⏰ *Уже оценено сегодня*

🚗 *Номер:* \`${CarKarma.normalizePlateNumber(plateNumber)}\`

Вы уже оценивали этот автомобиль сегодня. Попробуйте завтра или оцените другой номер.

*Ограничение:* один номер - одна оценка в день.
        `;
        
        await messageManager.editOrSendMessage(ctx, message, {
          reply_markup: backToMenuKeyboard().reply_markup,
          parse_mode: 'Markdown'
        });
      } else {
        await messageManager.sendMessage(ctx, '❌ Произошла ошибка при добавлении оценки. Попробуйте позже.', {
          reply_markup: backToMenuKeyboard().reply_markup
        });
      }
    }
  }

  static async showTopCars(ctx) {
    try {
      const topCars = await CarKarma.getTopCars(10);
      
      if (topCars.length === 0) {
        await messageManager.editOrSendMessage(ctx, 'Пока нет оценок автомобилей.', {
          reply_markup: backToMenuKeyboard().reply_markup
        });
        return;
      }

      let message = '🏆 *Топ лучших водителей:*\n\n';
      
      topCars.forEach((car, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        message += `${medal} \`${car.plate_number}\` — ${car.karma} 😊\n`;
      });

      await messageManager.editOrSendMessage(ctx, message, {
        reply_markup: backToMenuKeyboard().reply_markup,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Error showing top cars:', error);
      await messageManager.sendMessage(ctx, '❌ Произошла ошибка при получении топа. Попробуйте позже.', {
        reply_markup: backToMenuKeyboard().reply_markup
      });
    }
  }

  static async showWorstCars(ctx) {
    try {
      const worstCars = await CarKarma.getWorstCars(10);
      
      if (worstCars.length === 0) {
        await messageManager.editOrSendMessage(ctx, 'Пока нет оценок автомобилей.', {
          reply_markup: backToMenuKeyboard().reply_markup
        });
        return;
      }

      let message = '💩 *Топ худших водителей:*\n\n';
      
      worstCars.forEach((car, index) => {
        message += `${index + 1}. \`${car.plate_number}\` — ${car.karma} 😞\n`;
      });

      await messageManager.editOrSendMessage(ctx, message, {
        reply_markup: backToMenuKeyboard().reply_markup,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Error showing worst cars:', error);
      await messageManager.sendMessage(ctx, '❌ Произошла ошибка при получении топа. Попробуйте позже.', {
        reply_markup: backToMenuKeyboard().reply_markup
      });
    }
  }

  static async showUserActivity(ctx) {
    try {
      const user = ctx.state.user;
      const userActions = await CarKarma.getUserActions(user.id);
      
      if (userActions.length === 0) {
        await messageManager.editOrSendMessage(ctx, 'У вас пока нет активности. Начните оценивать водителей!', {
          reply_markup: backToMenuKeyboard().reply_markup
        });
        return;
      }

      let message = '📈 *Ваша активность:*\n\n';
      
      userActions.slice(0, 10).forEach((action, index) => {
        const emoji = action.action_type === 'positive' ? '👍' : '👎';
        const date = new Date(action.created_at).toLocaleDateString('ru-RU');
        message += `${emoji} \`${action.car_karma.plate_number}\` (${action.karma_change > 0 ? '+' : ''}${action.karma_change}) — ${date}\n`;
      });

      if (userActions.length > 10) {
        message += `\n... и еще ${userActions.length - 10} оценок`;
      }

      await messageManager.editOrSendMessage(ctx, message, {
        reply_markup: backToMenuKeyboard().reply_markup,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Error showing user activity:', error);
      await messageManager.sendMessage(ctx, '❌ Произошла ошибка при получении активности. Попробуйте позже.', {
        reply_markup: backToMenuKeyboard().reply_markup
      });
    }
  }

  static async showHelp(ctx) {
    const helpText = `
ℹ️ *Помощь*

*Что такое AutoKarma?*
Это система оценки водителей по номерам их автомобилей. Вы можете:

🔍 *Проверить карму* - узнать репутацию водителя
📝 *Оценить водителя* - добавить положительную или отрицательную оценку
🏆 *Посмотреть топы* - лучшие и худшие водители

*Система оценок:*
😇 Очень хорошо: +3 к карме
👍 Хорошо: +1 к карме  
👎 Плохо: -1 к карме
😡 Очень плохо: -3 к карме

*Форматы номеров:*
• А123ВС77 (российские)
• M456KX199 (латинские)
• Регистр не важен
• Пробелы игнорируются

Помогите создать более вежливое сообщество водителей! 🚗💙
    `;

    await messageManager.editOrSendMessage(ctx, helpText, {
      reply_markup: backToMenuKeyboard().reply_markup,
      parse_mode: 'Markdown'
    });
  }
}

export default KarmaHandler; 