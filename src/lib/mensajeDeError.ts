/**
 * Convierte cualquier fallo en algo que una persona pueda leer.
 *
 * Un error de base de datos viene en ingles y con la plomeria adentro:
 * «new row violates row-level security policy for table "assets"», o el nombre
 * literal de una restriccion. Esta escrito para nosotros, no para quien usa la
 * app. Antes eso se imprimia tal cual en la pantalla del cliente.
 *
 * OJO con lo que esta funcion NO debe tocar: los errores de inicio de sesion
 * SI estan escritos para el usuario final («la contrasena debe tener al menos
 * 6 caracteres», «ese correo ya esta registrado»). Taparlos con un «algo salio
 * mal» generico dejaria a la persona sin saber que arreglar. Por eso esta
 * funcion se aplica en los guardados contra la base, no en autenticacion.
 */

type Idioma = 'es' | 'en';

function idiomaActual(): Idioma {
  try {
    const guardado = localStorage.getItem('language');
    if (guardado === 'en' || guardado === 'es') return guardado;
  } catch {
    // navegador con el almacenamiento bloqueado: se sigue con el idioma por defecto
  }
  return 'en';
}

export function mensajeDeError(error: unknown, es?: boolean): string {
  const enEspanol = es ?? idiomaActual() === 'es';

  // La causa real se sigue registrando: es la que sirve para arreglarlo.
  console.error('[fallo]', error);

  const crudo = (
    (error as { message?: string })?.message ??
    (error as { error?: string })?.error ??
    ''
  ).toLowerCase();

  if (crudo.includes('duplicate key') || crudo.includes('already exists') || crudo.includes('unique constraint')) {
    return enEspanol ? 'Ya tienes algo registrado con ese nombre.' : 'You already have something with that name.';
  }
  if (crudo.includes('row-level security') || crudo.includes('permission denied') || crudo.includes('not authorized')) {
    return enEspanol ? 'No tienes permiso para hacer eso.' : "You don't have permission to do that.";
  }
  if (crudo.includes('failed to fetch') || crudo.includes('network') || crudo.includes('timeout')) {
    return enEspanol ? 'Parece que se cortó la conexión. Revisa tu internet y vuelve a intentarlo.' : 'The connection seems to have dropped. Check your internet and try again.';
  }
  if (crudo.includes('rate limit') || crudo.includes('too many requests')) {
    return enEspanol ? 'Vas muy rápido. Espera un momento y vuelve a intentarlo.' : "You're going too fast. Wait a moment and try again.";
  }

  return enEspanol ? 'No se pudo guardar. Vuelve a intentarlo en un momento.' : "It couldn't be saved. Please try again in a moment.";
}
