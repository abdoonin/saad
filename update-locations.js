import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://laugvyfgmxlbliwwcuao.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdWd2eWZnbXhsYmxpd3djdWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwODMsImV4cCI6MjA4NjE0OTA4M30.unrKvt4m5UlD1phmj0tM6zOUW5oY3XECqEa3gSJTMZA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateLocations() {
  // Update the first pharmacy with a dummy location in Riyadh
  const { data, error } = await supabase
    .from('pharmacies')
    .update({ latitude: 24.7136, longitude: 46.6753 })
    .not('id', 'is', null);

  if (error) {
    console.error('Error updating locations:', error);
  } else {
    console.log('Successfully updated pharmacy locations!');
  }
}

updateLocations();
