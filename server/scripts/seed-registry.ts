import 'dotenv/config';
import { seedComponentRegistry } from '../supabaseService.js';

console.log('🌱 Executando seed do component_registry...');
seedComponentRegistry().then(() => console.log('Concluído.'));
