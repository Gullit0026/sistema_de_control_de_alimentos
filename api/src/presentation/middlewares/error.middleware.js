const { AppError } = require('../../domain/errors/app.error');

/**
 * Middleware central de errores.
 * Express lo activa cuando un handler llama a next(err).
 *
 * - Errores de dominio (AppError y subclases): responde con su statusCode.
 * - Errores inesperados: responde 500 sin exponer el stack al cliente.
 */
function manejarError(err, req, res, next) { // eslint-disable-line no-unused-vars
  const esErrorDominio = err instanceof AppError;

  const statusCode = esErrorDominio ? err.statusCode : 500;
  const mensaje = esErrorDominio
    ? err.message
    : 'Error interno del servidor';

  // Solo mostrar el stack en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${err.name || 'Error'}] ${err.message}`);
    if (!esErrorDominio) console.error(err.stack);
  }

  res.status(statusCode).json({
    ok: false,
    error: mensaje,
  });
}

module.exports = { manejarError };
