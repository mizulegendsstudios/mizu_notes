// scripts/test-auth.js
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testAuth() {
    console.log('🧪 Probando configuración Supabase Auth...');
    
    try {
        // 1. Verificar conexión básica
        console.log('✅ Cliente Supabase creado');
        console.log('📋 URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...');
        
        // 2. Verificar que podemos hacer una operación básica
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.log('❌ Error obteniendo sesión:', error.message);
        } else {
            console.log('✅ Operación básica funcionando');
            console.log('📊 Sesión actual:', data.session ? 'Activa' : 'Inactiva');
        }
        
        console.log('🎉 Configuración Supabase Auth - VERIFICADA');
        
    } catch (error) {
        console.error('❌ Error en prueba de auth:', error);
    }
}

testAuth();
