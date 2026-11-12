import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

dotenv.config();

async function runSeed() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/chess_db';

  console.log('Connecting to database for seeding...');
  const isSsl =
    connectionString.includes('sslmode=require') ||
    connectionString.includes('neon.tech');

  const sql = postgres(connectionString, {
    max: 1,
    ssl: isSsl ? 'require' : false,
  });
  const db = drizzle(sql, { schema });

  console.log('Clearing existing data...');
  await db.delete(schema.matches);
  await db.delete(schema.tournamentParticipants);
  await db.delete(schema.tournaments);
  await db.delete(schema.users);

  console.log('Seeding users...');
  const coachPasswordHash = await bcrypt.hash('CoachPass123!', 10);
  const studentPasswordHash = await bcrypt.hash('StudentPass123!', 10);
  const traderPasswordHash = await bcrypt.hash('Password123!', 10);

  const [coach] = await db
    .insert(schema.users)
    .values({
      email: 'coach@kingdom.chess',
      passwordHash: coachPasswordHash,
      name: 'Coach Magnus',
      role: 'COACH',
    })
    .returning();

  const studentsData = [
    { name: 'Trader (Student)', email: 'tradercompany@gmail.com' },
    { name: 'Aryan Sharma', email: 'student1@kingdom.chess' },
    { name: 'Diya Patel', email: 'student2@kingdom.chess' },
    { name: 'Rohan Gupta', email: 'student3@kingdom.chess' },
    { name: 'Ananya Iyer', email: 'student4@kingdom.chess' },
  ];

  const students = [];
  for (const s of studentsData) {
    const [inserted] = await db
      .insert(schema.users)
      .values({
        email: s.email,
        passwordHash: s.email === 'tradercompany@gmail.com' ? traderPasswordHash : studentPasswordHash,
        name: s.name,
        role: 'STUDENT',
      })
      .returning();
    students.push(inserted);
  }

  console.log('Seeding sample tournament...');
  const [tournament] = await db
    .insert(schema.tournaments)
    .values({
      name: 'Kingdom Blitz Championship 2026',
      timeControl: '5+0',
      initialTimeSeconds: 300,
      incrementSeconds: 0,
      startDateTime: new Date(),
      status: 'OPEN',
      createdBy: coach.id,
    })
    .returning();

  console.log('Adding students as participants...');
  for (const student of students) {
    await db.insert(schema.tournamentParticipants).values({
      tournamentId: tournament.id,
      userId: student.id,
      scoreMillipoints: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      buchholzScore: 0,
    });
  }

  console.log('Seed completed successfully!');
  console.log('Credentials:');
  console.log('  Personal: tradercompany@gmail.com / StudentPass123! (or Password123!)');
  console.log('  Coach: coach@kingdom.chess / CoachPass123!');
  console.log('  Student 1: student1@kingdom.chess / StudentPass123!');
  console.log('  Student 2: student2@kingdom.chess / StudentPass123!');
  console.log('  Student 3: student3@kingdom.chess / StudentPass123!');
  console.log('  Student 4: student4@kingdom.chess / StudentPass123!');

  await sql.end();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

