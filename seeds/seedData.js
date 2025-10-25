// seeds/seedData.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seeding...\n');

    await client.query('BEGIN');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM jobs');
    await client.query('DELETE FROM manufacturers');
    await client.query('DELETE FROM hauliers');
    await client.query('DELETE FROM logistics_companies');
    await client.query('DELETE FROM users');
    console.log('✅ Existing data cleared\n');

    // Hash password for all test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // ========================================
    // CREATE MANUFACTURERS
    // ========================================
    console.log('👨‍🏭 Creating manufacturers...');
    
    const manufacturer1 = await client.query(`
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, ['John', 'Smith', 'john.manufacturer@test.com', hashedPassword, 'manufacturer']);
    
    await client.query(`
      INSERT INTO manufacturers (user_id, years_in_business, product_type, target_areas)
      VALUES ($1, $2, $3, $4)
    `, [manufacturer1.rows[0].id, 5, 'Steel, Metal Components', 'London, Birmingham, Manchester']);

    const manufacturer2 = await client.query(`
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, ['Sarah', 'Johnson', 'sarah.manufacturer@test.com', hashedPassword, 'manufacturer']);
    
    await client.query(`
      INSERT INTO manufacturers (user_id, years_in_business, product_type, target_areas)
      VALUES ($1, $2, $3, $4)
    `, [manufacturer2.rows[0].id, 8, 'Food Products, Beverages', 'Bristol, Leeds, Newcastle']);

    const manufacturer3 = await client.query(`
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, ['David', 'Chen', 'david.manufacturer@test.com', hashedPassword, 'manufacturer']);
    
    await client.query(`
      INSERT INTO manufacturers (user_id, years_in_business, product_type, target_areas)
      VALUES ($1, $2, $3, $4)
    `, [manufacturer3.rows[0].id, 3, 'Electronics, Technology', 'London, Edinburgh, Glasgow']);

    console.log('✅ 3 manufacturers created\n');

    // ========================================
    // CREATE HAULIERS
    // ========================================
    console.log('🚚 Creating hauliers...');

    const haulier1 = await client.query(`
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, ['Mike', 'Wilson', 'mike.haulier@test.com', hashedPassword, 'haulier']);
    
    await client.query(`
      INSERT INTO hauliers (user_id, fleet_size, preferred_routes, insurance_valid_until)
      VALUES ($1, $2, $3, $4)
    `, [haulier1.rows[0].id, 15, 'London to Manchester, Birmingham to Leeds, Bristol to London', '2026-12-31']);

    const haulier2 = await client.query(`
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, ['Emma', 'Brown', 'emma.haulier@test.com', hashedPassword, 'haulier']);
    
    await client.query(`
      INSERT INTO hauliers (user_id, fleet_size, preferred_routes, insurance_valid_until)
      VALUES ($1, $2, $3, $4)
    `, [haulier2.rows[0].id, 25, 'Edinburgh to Glasgow, Newcastle to Leeds, Manchester to Liverpool', '2027-06-30']);

    const haulier3 = await client.query(`
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, ['James', 'Taylor', 'james.haulier@test.com', hashedPassword, 'haulier']);
    
    await client.query(`
      INSERT INTO hauliers (user_id, fleet_size, preferred_routes, insurance_valid_until)
      VALUES ($1, $2, $3, $4)
    `, [haulier3.rows[0].id, 8, 'Bristol to Cardiff, London to Southampton, Birmingham to Nottingham', '2026-09-15']);

    console.log('✅ 3 hauliers created\n');

    // ========================================
    // CREATE LOGISTICS COMPANIES
    // ========================================
    console.log('📦 Creating logistics companies...');

    const logistics1 = await client.query(`
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, ['Robert', 'Anderson', 'robert.logistics@test.com', hashedPassword, 'logistics_company']);
    
    await client.query(`
      INSERT INTO logistics_companies (user_id, company_size, specialties, target_lanes)
      VALUES ($1, $2, $3, $4)
    `, [logistics1.rows[0].id, 50, 'Refrigerated, Hazardous Materials, Fragile Goods', 'London, Manchester, Birmingham, Leeds']);

    const logistics2 = await client.query(`
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, ['Lisa', 'Martinez', 'lisa.logistics@test.com', hashedPassword, 'logistics_company']);
    
    await client.query(`
      INSERT INTO logistics_companies (user_id, company_size, specialties, target_lanes)
      VALUES ($1, $2, $3, $4)
    `, [logistics2.rows[0].id, 30, 'Heavy Machinery, Construction Materials, Oversized Loads', 'Bristol, Cardiff, Southampton, Plymouth']);

    console.log('✅ 2 logistics companies created\n');

    // ========================================
    // CREATE JOBS
    // ========================================
    console.log('📋 Creating jobs...');

    // Job 1 - Should match haulier1 (London to Manchester route)
    await client.query(`
      INSERT INTO jobs (
        title, description, weight, price,
        origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        deadline, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      'Steel Beams Delivery',
      'Urgent delivery of steel beams for construction project',
      5000,
      650,
      'London',
      51.5074, -0.1278,
      'Manchester',
      53.4808, -2.2426,
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      'available',
      manufacturer1.rows[0].id
    ]);

    // Job 2 - Should match logistics1 (refrigerated specialty)
    await client.query(`
      INSERT INTO jobs (
        title, description, weight, price,
        origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        deadline, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      'Refrigerated Food Transport',
      'Temperature-controlled delivery of fresh produce and refrigerated goods',
      3000,
      500,
      'Bristol',
      51.4545, -2.5879,
      'Birmingham',
      52.4862, -1.8904,
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      'available',
      manufacturer2.rows[0].id
    ]);

    // Job 3 - Should match haulier2 (Edinburgh to Glasgow route)
    await client.query(`
      INSERT INTO jobs (
        title, description, weight, price,
        origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        deadline, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      'Electronics Equipment',
      'Fragile electronics and computer equipment',
      1500,
      400,
      'Edinburgh',
      55.9533, -3.1883,
      'Glasgow',
      55.8642, -4.2518,
      new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      'available',
      manufacturer3.rows[0].id
    ]);

    // Job 4 - High-paying job
    await client.query(`
      INSERT INTO jobs (
        title, description, weight, price,
        origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        deadline, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      'Heavy Machinery Transport',
      'Oversized construction equipment and heavy machinery',
      8000,
      1200,
      'Birmingham',
      52.4862, -1.8904,
      'Leeds',
      53.8008, -1.5491,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      'available',
      manufacturer1.rows[0].id
    ]);

    // Job 5 - Short distance job
    await client.query(`
      INSERT INTO jobs (
        title, description, weight, price,
        origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        deadline, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      'Local Delivery',
      'Short distance delivery within city limits',
      500,
      150,
      'London',
      51.5074, -0.1278,
      'London Heathrow',
      51.4700, -0.4543,
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      'available',
      manufacturer2.rows[0].id
    ]);

    // Job 6 - Hazardous materials (should match logistics1)
    await client.query(`
      INSERT INTO jobs (
        title, description, weight, price,
        origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        deadline, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      'Chemical Transport',
      'Hazardous materials requiring special handling and certification',
      4000,
      850,
      'Manchester',
      53.4808, -2.2426,
      'Liverpool',
      53.4084, -2.9916,
      new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      'available',
      manufacturer3.rows[0].id
    ]);

    // Job 7 - Should match haulier3 (Bristol to Cardiff)
    await client.query(`
      INSERT INTO jobs (
        title, description, weight, price,
        origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        deadline, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      'General Freight',
      'Mixed cargo pallets',
      2500,
      350,
      'Bristol',
      51.4545, -2.5879,
      'Cardiff',
      51.4816, -3.1791,
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      'available',
      manufacturer1.rows[0].id
    ]);

    // Job 8 - Long distance, high value
    await client.query(`
      INSERT INTO jobs (
        title, description, weight, price,
        origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        deadline, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      'Premium Electronics',
      'High-value fragile electronics requiring careful handling',
      1000,
      900,
      'London',
      51.5074, -0.1278,
      'Edinburgh',
      55.9533, -3.1883,
      new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      'available',
      manufacturer3.rows[0].id
    ]);

    console.log('✅ 8 jobs created\n');

    await client.query('COMMIT');

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📧 Test user credentials (all passwords: password123):');
    console.log('   Manufacturers:');
    console.log('   - john.manufacturer@test.com');
    console.log('   - sarah.manufacturer@test.com');
    console.log('   - david.manufacturer@test.com');
    console.log('\n   Hauliers:');
    console.log('   - mike.haulier@test.com');
    console.log('   - emma.haulier@test.com');
    console.log('   - james.haulier@test.com');
    console.log('\n   Logistics Companies:');
    console.log('   - robert.logistics@test.com');
    console.log('   - lisa.logistics@test.com');
    console.log('\n🧪 You can now test the matching system!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('\n✨ Seeding process finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Seeding failed:', err);
    process.exit(1);
  });