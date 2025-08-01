// Карта для хранения последних сообщений пользователей
const userMessages = new Map();

/**
 * Удаляет предыдущие сообщения пользователя
 * @param {Object} ctx - Контекст Telegram бота
 * @param {number} keepLast - Количество последних сообщений, которые нужно оставить (по умолчанию 0)
 */
const deletePreviousMessages = async (ctx, keepLast = 0) => {
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;
  
  if (!userMessages.has(userId)) {
    return;
  }

  const messages = userMessages.get(userId);
  const messagesToDelete = messages.slice(0, -keepLast);

  for (const messageId of messagesToDelete) {
    try {
      await ctx.telegram.deleteMessage(chatId, messageId);
    } catch (error) {
      // Игнорируем ошибки удаления (сообщение может быть уже удалено)
      console.log(`Could not delete message ${messageId}:`, error.message);
    }
  }

  // Оставляем только keepLast сообщений
  if (keepLast > 0) {
    userMessages.set(userId, messages.slice(-keepLast));
  } else {
    userMessages.delete(userId);
  }
};

/**
 * Добавляет ID сообщения в список для отслеживания
 * @param {number} userId - ID пользователя
 * @param {number} messageId - ID сообщения
 */
const trackMessage = (userId, messageId) => {
  if (!userMessages.has(userId)) {
    userMessages.set(userId, []);
  }
  
  const messages = userMessages.get(userId);
  
  // Добавляем только если такого ID еще нет
  if (!messages.includes(messageId)) {
    messages.push(messageId);
    
    // Ограничиваем количество отслеживаемых сообщений (последние 5)
    if (messages.length > 5) {
      messages.shift();
    }
  }
};

/**
 * Получает последнее сообщение бота для пользователя
 * @param {number} userId - ID пользователя
 */
const getLastBotMessage = (userId) => {
  if (!userMessages.has(userId)) {
    return null;
  }
  
  const messages = userMessages.get(userId);
  return messages.length > 0 ? messages[messages.length - 1] : null;
};

/**
 * Отправляет сообщение с автоматическим удалением предыдущих
 * @param {Object} ctx - Контекст Telegram бота
 * @param {string} text - Текст сообщения
 * @param {Object} extra - Дополнительные параметры (клавиатура и т.д.)
 * @param {boolean} deletePrevious - Удалять ли предыдущие сообщения
 */
const sendMessage = async (ctx, text, extra = {}, deletePrevious = true) => {
  if (deletePrevious) {
    await deletePreviousMessages(ctx);
  }

  const sentMessage = await ctx.reply(text, extra);
  trackMessage(ctx.from.id, sentMessage.message_id);
  
  return sentMessage;
};

/**
 * Редактирует сообщение с автоматическим удалением предыдущих
 * @param {Object} ctx - Контекст Telegram бота
 * @param {string} text - Новый текст сообщения
 * @param {Object} extra - Дополнительные параметры (клавиатура и т.д.)
 * @param {boolean} deletePrevious - Удалять ли предыдущие сообщения (кроме редактируемого)
 */
const editMessage = async (ctx, text, extra = {}, deletePrevious = true) => {
  try {
    // Получаем ID текущего сообщения из callback query
    const currentMessageId = ctx.callbackQuery?.message?.message_id;
    
    if (deletePrevious && currentMessageId) {
      // Удаляем все предыдущие сообщения, кроме текущего
      const userId = ctx.from.id;
      if (userMessages.has(userId)) {
        const messages = userMessages.get(userId);
        const filteredMessages = messages.filter(id => id !== currentMessageId);
        
        for (const messageId of filteredMessages) {
          try {
            await ctx.telegram.deleteMessage(ctx.chat.id, messageId);
          } catch (error) {
            console.log(`Could not delete message ${messageId}:`, error.message);
          }
        }
        
        // Оставляем только текущее сообщение в трекинге
        userMessages.set(userId, [currentMessageId]);
      }
    }

    const editedMessage = await ctx.editMessageText(text, extra);
    
    // Убеждаемся, что ID сообщения отслеживается
    const messageId = editedMessage?.message_id || currentMessageId;
    if (messageId) {
      trackMessage(ctx.from.id, messageId);
    }
    
    return editedMessage;
  } catch (error) {
    // Если не удалось редактировать (сообщение не найдено), отправляем новое
    if (error.description && error.description.includes('message to edit not found')) {
      console.log('Message to edit not found, sending new message instead');
      return await sendMessage(ctx, text, extra, deletePrevious);
    }
    
    // Если текст не изменился
    if (error.description && error.description.includes('message is not modified')) {
      console.log('Message text is the same, skipping edit');
      return ctx.callbackQuery?.message;
    }
    
    // Перебрасываем другие ошибки
    throw error;
  }
};

/**
 * Умная функция - пытается редактировать если возможно, иначе отправляет новое
 * @param {Object} ctx - Контекст Telegram бота
 * @param {string} text - Текст сообщения
 * @param {Object} extra - Дополнительные параметры (клавиатура и т.д.)
 * @param {boolean} deletePrevious - Удалять ли предыдущие сообщения
 */
const editOrSendMessage = async (ctx, text, extra = {}, deletePrevious = true) => {
  try {
    // Если есть callback query - всегда пытаемся редактировать
    if (ctx.callbackQuery && ctx.callbackQuery.message) {
      return await editMessage(ctx, text, extra, deletePrevious);
    }
    
    // Если это обычное сообщение, но у нас есть последнее сообщение бота - пытаемся редактировать его
    const lastBotMessageId = getLastBotMessage(ctx.from.id);
    if (lastBotMessageId && deletePrevious) {
      try {
        // Создаем mock callback query для редактирования
        const mockCtx = {
          ...ctx,
          callbackQuery: {
            message: {
              message_id: lastBotMessageId
            }
          }
        };
        
        const editedMessage = await mockCtx.editMessageText(text, extra);
        trackMessage(ctx.from.id, lastBotMessageId);
        return editedMessage;
      } catch (editError) {
        // Если редактирование не удалось, отправляем новое сообщение
        console.log('Could not edit last message, sending new one:', editError.message);
      }
    }
    
    // Иначе отправляем новое сообщение
    return await sendMessage(ctx, text, extra, deletePrevious);
    
  } catch (error) {
    // В случае любой ошибки - отправляем новое сообщение
    console.log('Failed to edit message, sending new one:', error.message);
    return await sendMessage(ctx, text, extra, deletePrevious);
  }
};

/**
 * Очищает все отслеживаемые сообщения пользователя
 * @param {number} userId - ID пользователя
 */
const clearUserMessages = (userId) => {
  userMessages.delete(userId);
};

export default {
  deletePreviousMessages,
  trackMessage,
  sendMessage,
  editMessage,
  editOrSendMessage,
  clearUserMessages,
  getLastBotMessage
}; 