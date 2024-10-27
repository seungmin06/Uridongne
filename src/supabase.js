// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://exqvxjiedqobvwvhbdbb.supabase.co'; // 여기에 Supabase URL 입력
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cXZ4amllZHFvYnZ3dmhiZGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg1MTE3MTEsImV4cCI6MjAyNDA4NzcxMX0.gPgZRq0LXMvn9BHNnNBr6K2m0wiM8sU-IGSX5sOvvmo'; // 여기에 Supabase 익명 키 입력

export const supabase = createClient(supabaseUrl, supabaseKey);
