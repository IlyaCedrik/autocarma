import 'dotenv/config';
import { supabase } from '../config/supabase.js';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Очищаем существующие данные
    console.log('🧹 Cleaning existing data...');
    await supabase.from('karma_actions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('car_karma').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Добавляем тестовых пользователей (если их нет)
    console.log('👥 Adding test users...');
    const testUsers = [
      {
        telegram_id: 123456789,
        username: 'test_user1',
        first_name: 'Тест',
        last_name: 'Пользователь1'
      },
      {
        telegram_id: 987654321,
        username: 'test_user2',
        first_name: 'Тест',
        last_name: 'Пользователь2'
      }
    ];

    for (const user of testUsers) {
      const { error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'telegram_id' });
      
      if (error) {
        console.log(`User ${user.username} already exists or error:`, error.message);
      }
    }

    // Добавляем тестовые данные кармы автомобилей
    console.log('🚗 Adding test car karma data...');
    const testCarKarma = [
      {
        plate_number: 'А123ВС777',
        karma: 15,
        total_positive: 20,
        total_negative: 5
      },
      {
        plate_number: 'М456КХ199',
        karma: -8,
        total_positive: 2,
        total_negative: 10
      },
      {
        plate_number: 'С789НН777',
        karma: 0,
        total_positive: 3,
        total_negative: 3
      },
      {
        plate_number: 'Е111РР177',
        karma: 25,
        total_positive: 30,
        total_negative: 5
      },
      {
        plate_number: 'К999АА199',
        karma: -15,
        total_positive: 1,
        total_negative: 16
      },
      {
        plate_number: 'Н555ММ777',
        karma: 8,
        total_positive: 10,
        total_negative: 2
      },
      {
        plate_number: 'Р777ОО199',
        karma: -3,
        total_positive: 4,
        total_negative: 7
      },
      {
        plate_number: 'Т333УУ777',
        karma: 12,
        total_positive: 15,
        total_negative: 3
      },
      {
        plate_number: 'У888ИИ199',
        karma: -20,
        total_positive: 0,
        total_negative: 20
      },
      {
        plate_number: 'Ф222ЛЛ777',
        karma: 30,
        total_positive: 35,
        total_negative: 5
      }
    ];

    const { data: carKarmaData, error: carKarmaError } = await supabase
      .from('car_karma')
      .insert(testCarKarma)
      .select();

    if (carKarmaError) {
      console.error('Error inserting car karma:', carKarmaError);
      return;
    }

    console.log(`✅ Added ${carKarmaData.length} car karma records`);

    // Получаем пользователей для создания действий
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(2);

    if (users && users.length > 0) {
      console.log('📊 Adding test karma actions...');
      
      // Добавляем несколько тестовых действий
      const testActions = [];
      
      carKarmaData.slice(0, 5).forEach((car, index) => {
        const userId = users[index % users.length].id;
        
        // Добавляем положительное действие
        testActions.push({
          car_karma_id: car.id,
          user_id: userId,
          action_type: 'positive',
          karma_change: 1,
          description: 'Вежливый водитель'
        });
        
        // Добавляем отрицательное действие для некоторых
        if (index % 2 === 0) {
          testActions.push({
            car_karma_id: car.id,
            user_id: userId,
            action_type: 'negative',
            karma_change: -1,
            description: 'Неаккуратное вождение'
          });
        }
      });

      const { data: actionsData, error: actionsError } = await supabase
        .from('karma_actions')
        .insert(testActions);

      if (actionsError) {
        console.error('Error inserting karma actions:', actionsError);
      } else {
        console.log(`✅ Added ${testActions.length} karma actions`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Car karma records: ${carKarmaData.length}`);
    console.log(`- Test users: ${testUsers.length}`);
    console.log('- Sample license plates with karma ready for testing');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Запускаем, если файл выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

export default seedDatabase; 