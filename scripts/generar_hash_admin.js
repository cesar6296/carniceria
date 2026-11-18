const bcrypt = require('bcryptjs');

const entrada = process.stdin;
let password = '';
let finalizado = false;

if (!entrada.isTTY || typeof entrada.setRawMode !== 'function') {
  console.error('Ejecuta este comando directamente en una terminal interactiva.');
  process.exit(1);
}

entrada.setEncoding('utf8');
entrada.setRawMode(true);
entrada.resume();
process.stdout.write('Escribe una contraseña nueva (mínimo 12 caracteres; no se mostrará): ');

entrada.on('data', async tecla => {
  if (finalizado) return;
  if (tecla === '\u0003') {
    finalizado = true;
    entrada.setRawMode(false);
    process.stdout.write('\nCancelado.\n');
    process.exit(1);
  }

  if (tecla === '\r' || tecla === '\n') {
    finalizado = true;
    entrada.setRawMode(false);
    entrada.pause();
    process.stdout.write('\n');
    if (password.length < 12) {
      password = '';
      console.error('La contraseña debe tener al menos 12 caracteres.');
      process.exitCode = 1;
      return;
    }

    try {
      const hash = await bcrypt.hash(password, 12);
      password = '';
      console.log(`ADMIN_PASSWORD_HASH=${hash}`);
      console.log('Guarda solo este hash en tu archivo .env y en Vercel.');
    } catch (error) {
      password = '';
      console.error('No se pudo generar el hash:', error.message);
      process.exitCode = 1;
    }
    return;
  }

  if (tecla === '\u007f' || tecla === '\b') {
    password = password.slice(0, -1);
    return;
  }

  if (tecla >= ' ' && tecla !== '\u007f') password += tecla;
});