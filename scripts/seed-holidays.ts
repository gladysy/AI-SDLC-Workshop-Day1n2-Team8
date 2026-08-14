// Seed Singapore public holidays for 2024-2027 (PRP 10)
// Run with: npx tsx scripts/seed-holidays.ts

import { holidayDB } from '../lib/db';

const SINGAPORE_HOLIDAYS = [
  // 2024
  { date: '2024-01-01', name: 'New Year Day' },
  { date: '2024-02-10', name: 'Chinese New Year' },
  { date: '2024-02-11', name: 'Chinese New Year (in lieu)' },
  { date: '2024-03-29', name: 'Good Friday' },
  { date: '2024-04-10', name: 'Hari Raya Puasa' },
  { date: '2024-05-01', name: "Workers' Day" },
  { date: '2024-05-22', name: 'Vesak Day' },
  { date: '2024-06-17', name: 'Hari Raya Haji' },
  { date: '2024-08-09', name: 'National Day' },
  { date: '2024-10-31', name: 'Deepavali' },
  { date: '2024-12-25', name: 'Christmas Day' },

  // 2025
  { date: '2025-01-01', name: 'New Year Day' },
  { date: '2025-01-29', name: 'Chinese New Year' },
  { date: '2025-01-30', name: 'Chinese New Year (in lieu)' },
  { date: '2025-04-18', name: 'Good Friday' },
  { date: '2025-03-31', name: 'Hari Raya Puasa' },
  { date: '2025-05-01', name: "Workers' Day" },
  { date: '2025-05-13', name: 'Vesak Day' },
  { date: '2025-06-07', name: 'Hari Raya Haji' },
  { date: '2025-08-09', name: 'National Day' },
  { date: '2025-10-01', name: 'Deepavali' },
  { date: '2025-12-25', name: 'Christmas Day' },

  // 2026
  { date: '2026-01-01', name: 'New Year Day' },
  { date: '2026-02-17', name: 'Chinese New Year' },
  { date: '2026-02-18', name: 'Chinese New Year (in lieu)' },
  { date: '2026-04-10', name: 'Good Friday' },
  { date: '2026-03-21', name: 'Hari Raya Puasa' },
  { date: '2026-05-01', name: "Workers' Day" },
  { date: '2026-05-03', name: 'Vesak Day' },
  { date: '2026-05-27', name: 'Hari Raya Haji' },
  { date: '2026-08-09', name: 'National Day' },
  { date: '2026-10-29', name: 'Deepavali' },
  { date: '2026-12-25', name: 'Christmas Day' },

  // 2027
  { date: '2027-01-01', name: 'New Year Day' },
  { date: '2027-02-06', name: 'Chinese New Year' },
  { date: '2027-02-07', name: 'Chinese New Year (in lieu)' },
  { date: '2027-03-26', name: 'Good Friday' },
  { date: '2027-03-10', name: 'Hari Raya Puasa' },
  { date: '2027-05-01', name: "Workers' Day" },
  { date: '2027-05-21', name: 'Vesak Day' },
  { date: '2027-05-16', name: 'Hari Raya Haji' },
  { date: '2027-08-09', name: 'National Day' },
  { date: '2027-10-28', name: 'Deepavali' },
  { date: '2027-12-25', name: 'Christmas Day' },
];

async function seedHolidays() {
  console.log('Seeding Singapore public holidays...');
  
  try {
    for (const holiday of SINGAPORE_HOLIDAYS) {
      const existing = holidayDB.findByDate(holiday.date);
      if (!existing) {
        holidayDB.create(holiday);
        console.log(`✓ Added: ${holiday.date} - ${holiday.name}`);
      }
    }
    console.log(`\n✓ Seeding complete! ${SINGAPORE_HOLIDAYS.length} holidays processed.`);
  } catch (error) {
    console.error('Error seeding holidays:', error);
    process.exit(1);
  }
}

seedHolidays();
