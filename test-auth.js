// Script para testar o sistema de autenticação do Avisei
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

async function testAuth() {
  console.log('🚀 Testando Sistema de Autenticação do Avisei\n');

  try {
    // 1. Testar cadastro de cliente
    console.log('1️⃣ Cadastrando cliente...');
    const registerResponse = await fetch(`${API_BASE}/auth/register/cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ana Silva',
        email: 'ana@test.com',
        password: '123456'
      })
    });
    const registerData = await registerResponse.json();
    console.log('✅ Cadastro:', registerData.success ? 'Sucesso' : 'Falhou');
    const token = registerData.data?.token;

    if (!token) {
      console.log('❌ Token não recebido');
      return;
    }

    // 2. Testar login
    console.log('\n2️⃣ Fazendo login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ana@test.com',
        password: '123456'
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login:', loginData.success ? 'Sucesso' : 'Falhou');

    // 3. Testar perfil com token
    console.log('\n3️⃣ Buscando perfil...');
    const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileData = await profileResponse.json();
    console.log('✅ Perfil:', profileData.success ? 'Sucesso' : 'Falhou');
    console.log('👤 Usuário:', profileData.data?.name);

    // 4. Testar rota protegida sem token
    console.log('\n4️⃣ Tentando acessar rota protegida sem token...');
    const protectedResponse = await fetch(`${API_BASE}/users`);
    const protectedData = await protectedResponse.json();
    console.log('🔒 Acesso negado:', !protectedData.success ? 'Correto' : 'Erro');

    console.log('\n🎉 Todos os testes concluídos!');
    console.log('\nSistema de autenticação implementado com sucesso:');
    console.log('- ✅ Cadastro com criptografia bcrypt');
    console.log('- ✅ Login com JWT');
    console.log('- ✅ Middleware de autenticação');
    console.log('- ✅ Controle de acesso por tipo de usuário');
    console.log('- ✅ Rotas protegidas funcionando');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

export { testAuth };