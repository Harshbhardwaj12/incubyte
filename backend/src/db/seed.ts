import bcrypt from 'bcrypt';
import { config, normalizeEmail } from '../config.js';
import { pool } from './pool.js';
import { migrate } from './migrate.js';

const SAMPLE_VEHICLES = [
  {
    make: 'BMW',
    model: 'M4 Competition',
    category: 'Sports',
    price: 84900,
    quantity: 3,
    year: 2024,
    description: 'Twin-turbo inline-six coupe with track-tuned chassis.',
    image_url:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Porsche',
    model: '911 Carrera',
    category: 'Sports',
    price: 114400,
    quantity: 2,
    year: 2024,
    description: 'Iconic rear-engine sports car with everyday usability.',
    image_url:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Mercedes-Benz',
    model: 'S-Class S500',
    category: 'Luxury',
    price: 118450,
    quantity: 4,
    year: 2024,
    description: 'Flagship sedan with executive rear-seat comfort.',
    image_url:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Audi',
    model: 'A8 L',
    category: 'Luxury',
    price: 92500,
    quantity: 0,
    year: 2023,
    description: 'Long-wheelbase luxury sedan — currently sold out.',
    image_url:
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Toyota',
    model: 'RAV4 Hybrid',
    category: 'SUV',
    price: 34200,
    quantity: 8,
    year: 2025,
    description: 'Efficient compact SUV for daily commuting.',
    image_url:
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Land Rover',
    model: 'Range Rover Sport',
    category: 'SUV',
    price: 83900,
    quantity: 3,
    year: 2024,
    description: 'Capable luxury SUV with commanding presence.',
    image_url:
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Tesla',
    model: 'Model 3 Long Range',
    category: 'Electric',
    price: 47500,
    quantity: 6,
    year: 2025,
    description: 'All-electric sedan with long-range dual motor.',
    image_url:
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Ford',
    model: 'Mustang Mach-E',
    category: 'Electric',
    price: 42995,
    quantity: 5,
    year: 2024,
    description: 'Electric crossover with Mustang styling cues.',
    image_url:
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Honda',
    model: 'Civic Sport',
    category: 'Sedan',
    price: 25250,
    quantity: 10,
    year: 2025,
    description: 'Reliable compact sedan with sport trim accents.',
    image_url:
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Toyota',
    model: 'Camry XSE',
    category: 'Sedan',
    price: 31200,
    quantity: 7,
    year: 2024,
    description: 'Midsize sedan with bold styling and hybrid option.',
    image_url:
      'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Chevrolet',
    model: 'Corvette Stingray',
    category: 'Sports',
    price: 69995,
    quantity: 0,
    year: 2024,
    description: 'Mid-engine American sports car — sold out.',
    image_url:
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    make: 'Lexus',
    model: 'RX 350',
    category: 'SUV',
    price: 48950,
    quantity: 4,
    year: 2024,
    description: 'Quiet luxury crossover with refined ride quality.',
    image_url:
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80',
  },
];

export async function seed(): Promise<void> {
  await migrate();

  const passwordHash = await bcrypt.hash(config.adminPassword, config.bcryptRounds);
  const adminResult = await pool.query<{ id: string }>(
    `INSERT INTO users (email, email_normalized, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email_normalized) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           role = 'admin',
           updated_at = NOW()
     RETURNING id`,
    [config.adminEmail, normalizeEmail(config.adminEmail), passwordHash],
  );
  const adminId = adminResult.rows[0].id;

  const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM vehicles');
  if (Number(rows[0].count) === 0) {
    for (const v of SAMPLE_VEHICLES) {
      const vehicleResult = await pool.query<{ id: string }>(
        `INSERT INTO vehicles
          (make, model, category, price, quantity, year, description, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [
          v.make,
          v.model,
          v.category,
          v.price,
          v.quantity,
          v.year,
          v.description,
          v.image_url,
        ],
      );
      if (v.quantity > 0) {
        await pool.query(
          `INSERT INTO stock_movements
            (vehicle_id, vehicle_make, vehicle_model, vehicle_category,
             movement_type, quantity_change, previous_quantity, new_quantity,
             acting_user_id, reason)
           VALUES ($1,$2,$3,$4,'adjustment',$5,0,$5,$6,'Opening balance')`,
          [
            vehicleResult.rows[0].id,
            v.make,
            v.model,
            v.category,
            v.quantity,
            adminId,
          ],
        );
      }
    }
    console.log(`Seeded ${SAMPLE_VEHICLES.length} vehicles`);
  } else {
    console.log('Vehicles already present; skipping vehicle seed');
  }

  console.log(`Admin ready: ${config.adminEmail}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
