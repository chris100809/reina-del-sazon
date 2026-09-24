// Un handler lanza PermanentError cuando reintentar no tiene sentido
// (p. ej. link de proveedor inválido). Cualquier otro error se reintenta.
export class PermanentError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'PermanentError';
  }
}
