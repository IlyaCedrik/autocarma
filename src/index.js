import 'dotenv/config';
import { Telegraf, session } from 'telegraf';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

// Services
import { supabase } from './config/supabase.js';

// Bot handlers
import KarmaHandler from './bot/handlers/karma.js';

// Middleware
import authMiddleware from './bot/middleware/auth.js';

// Utils
import messageManager from './bot/utils/messageManager.js';

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Bot middleware
bot.use(session({
  defaultSession: () => ({
    waitingFor: null
  })
}));
bot.use(authMiddleware);

// Global error handler для бота
bot.catch((err, ctx) => {
  console.error('Bot error occurred:', err);
  
  // Логируем информацию о пользователе для отладки
  if (ctx.from) {
    console.error('Error for user:', {
      id: ctx.from.id,
      username: ctx.from.username,
      first_name: ctx.from.first_name
    });
  }
  
  // Не показываем техническую ошибку пользователю
  messageManager.sendMessage(ctx, '❌ Произошла ошибка. Попробуйте позже или обратитесь в поддержку.').catch(() => {});
});

// Bot commands
bot.start(KarmaHandler.startHandler);
bot.command('help', KarmaHandler.showHelp);

// Bot actions - основная логика кармы
bot.action('check_karma', KarmaHandler.checkKarmaHandler);
bot.action('rate_driver', KarmaHandler.rateDriverHandler);
bot.action('top_cars', KarmaHandler.showTopCars);
bot.action('worst_cars', KarmaHandler.showWorstCars);
bot.action('my_activity', KarmaHandler.showUserActivity);
bot.action('help', KarmaHandler.showHelp);
bot.action('main_menu', KarmaHandler.startHandler);

// Karma rating actions
bot.action(/^karma_(excellent|positive|negative|terrible)_(.+)$/, async (ctx) => {
  const action = ctx.match[1];
  const plateNumber = ctx.match[2];
  await KarmaHandler.addKarma(ctx, plateNumber, action);
});

// Text message handler для обработки номеров машин
bot.on('text', async (ctx) => {
  // Проверяем, ожидаем ли мы ввод номера
  if (ctx.session && (ctx.session.waitingFor === 'plate_number_check' || ctx.session.waitingFor === 'plate_number_rate')) {
    await KarmaHandler.handlePlateNumberInput(ctx);
  } else {
    // Если не ожидаем ввод, показываем главное меню
    await KarmaHandler.startHandler(ctx);
  }
});

// Глобальный обработчик для неизвестных callback queries
bot.on('callback_query', async (ctx) => {
  // Если callback query не был обработан выше, обрабатываем здесь
  if (!ctx.callbackQuery.answered) {
    console.log(`❓ Unknown callback query: ${ctx.callbackQuery.data} from user ${ctx.from.id}`);
    
    try {
      await ctx.answerCbQuery('❌ Неизвестная команда');
      await messageManager.sendMessage(ctx, '❌ Неизвестная команда. Попробуйте /start');
    } catch (error) {
      console.error('Error handling unknown callback query:', error);
    }
  }
});

// Express server for webhooks
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Webhook endpoint
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Health check with bot metrics
app.get('/health', async (req, res) => {
  try {
    // Проверяем соединение с Telegram
    const botInfo = await bot.telegram.getMe();
    
    // Проверяем соединение с базой данных
    const { data, error } = await supabase.from('users').select('count').single();
    
    res.json({ 
      status: 'ok',
      bot: botInfo.username,
      database: error ? 'error' : 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  // Use webhooks in production
  bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/webhook`);
  
  app.listen(PORT, () => {
    console.log(`🚀 AutoKarma Bot server running on port ${PORT}`);
    console.log(`📡 Webhook URL: ${process.env.WEBHOOK_URL}/webhook`);
  });
} else {
  // Use polling in development
  bot.launch(() => {
    console.log('🤖 AutoKarma Bot started in polling mode');
  });
  
  app.listen(PORT, () => {
    console.log(`🚀 AutoKarma Bot dev server running on port ${PORT}`);
  });
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 