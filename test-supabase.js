import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://laugvyfgmxlbliwwcuao.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdWd2eWZnbXhsYmxpd3djdWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwODMsImV4cCI6MjA4NjE0OTA4M30.unrKvt4m5UlD1phmj0tM6zOUW5oY3XECqEa3gSJTMZA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id,
      price,
      quantity,
      medicines!inner (
        trade_name,
        scientific_name
      ),
      pharmacies!inner (
        name,
        address,
        phone,
        is_open,
        latitude,
        longitude
      )
    `)
    .limit(1);

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Success:', data);
  }
}

test();
