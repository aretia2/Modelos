/**
 * Compone el primer mensaje de cita. No envía ni almacena datos: el texto solo
 * sale de la página cuando la persona lo pega o lo manda desde su propia cuenta.
 */
const form = document.querySelector<HTMLFormElement>('[data-brief]');

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

if (form) {
  const status = form.querySelector<HTMLElement>('[data-brief-status]')!;
  const msg = form.querySelector<HTMLElement>('[data-brief-msg]')!;
  const out = form.querySelector<HTMLElement>('[data-brief-text]')!;
  const channel = form.dataset.channel;
  const artistSelect = form.querySelector<HTMLSelectElement>('#f-artist')!;
  let lastText = '';

  // "Pedir con X" desde la lista de residentes preselecciona al artista.
  document.querySelectorAll<HTMLAnchorElement>('[data-pick-artist]').forEach((a) =>
    a.addEventListener('click', () => {
      artistSelect.value = a.dataset.pickArtist ?? '';
    }),
  );

  const rules: Record<string, (v: string) => boolean> = {
    name: (v) => v.trim().length >= 2,
    idea: (v) => v.trim().length >= 10,
  };

  const validate = (field: HTMLInputElement | HTMLTextAreaElement) => {
    const rule = rules[field.name];
    if (!rule) return true;
    const ok = rule(field.value);
    field.setAttribute('aria-invalid', String(!ok));
    const err = document.getElementById(`${field.id}-err`);
    if (err) err.hidden = ok;
    return ok;
  };

  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]').forEach((f) => {
    f.addEventListener('blur', () => f.value && validate(f));
    f.addEventListener('input', () => f.getAttribute('aria-invalid') === 'true' && validate(f));
  });

  const compose = (data: FormData) => {
    const get = (k: string) => String(data.get(k) ?? '').trim();
    const lines = [`¡Hola! Soy ${get('name')} y me gustaría pedir cita.`, '', `Idea: ${get('idea')}`];
    if (get('zone')) lines.push(`Zona: ${get('zone')}`);
    if (get('size')) lines.push(`Tamaño: ${get('size')}`);
    lines.push(`Artista: ${get('artist') || 'que me aconsejéis'}`);
    lines.push('', 'Si os viene bien, os mando fotos de referencia por aquí.');
    return lines.join('\n');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]')];
    const invalid = fields.filter((f) => !validate(f));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    lastText = compose(new FormData(form));
    out.textContent = lastText;
    status.hidden = false;

    if (channel === 'whatsapp') {
      window.open(`https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(lastText)}`, '_blank', 'noopener');
      msg.textContent = 'Te hemos abierto WhatsApp con el mensaje. Revísalo y envíalo cuando quieras.';
      return;
    }

    // Instagram no admite mensajes precompletados: copiamos el texto y abrimos el chat.
    const copyPromise = copy(lastText);
    window.open(form.dataset.dm, '_blank', 'noopener');
    const copied = await copyPromise;
    msg.textContent = copied
      ? 'Mensaje copiado. Pégalo en el chat de Instagram que se ha abierto y envíalo.'
      : 'No hemos podido copiarlo automáticamente: selecciona el texto de abajo y cópialo.';
  });

  form.querySelector('[data-brief-copy]')?.addEventListener('click', async () => {
    const ok = await copy(lastText);
    msg.textContent = ok ? 'Copiado de nuevo.' : 'Selecciona el texto y cópialo a mano.';
  });
}
