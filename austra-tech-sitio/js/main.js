
// Menú hamburguesa (móvil)
const menuBtn = document.getElementById('menuBtn');
const menu = document.getElementById('menu');
if (menuBtn) menuBtn.addEventListener('click', () => menu.classList.toggle('abierto'));


const form = document.getElementById('formContacto');
if (form) {
  const alerta = document.getElementById('alerta');

  function setError(input, texto) {
    const campo = input.closest('.campo');
    campo.classList.toggle('error', !!texto);
    campo.querySelector('.msg-error').textContent = texto || '';
    return !texto;
  }

  function validar() {
    const f = form.elements;
    let ok = true;
    ok = setError(f.nombre, f.nombre.value.trim() ? '' : 'El nombre es obligatorio') && ok;
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim());
    ok = setError(f.email, emailValido ? '' : 'Ingresá un email válido') && ok;
    ok = setError(f.asunto, f.asunto.value.trim() ? '' : 'El asunto es obligatorio') && ok;
    ok = setError(f.mensaje, f.mensaje.value.trim().length >= 10 ? '' : 'El mensaje debe tener al menos 10 caracteres') && ok;
    return ok;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alerta.className = 'alerta';
    if (!validar()) return;
    // TODO (más adelante): enviar los datos con fetch('/api/consultas', ...)
    alerta.textContent = 'Formulario válido. (Por ahora no se envía: falta conectar el backend.)';
    alerta.className = 'alerta ok';
    form.reset();
  });
}
