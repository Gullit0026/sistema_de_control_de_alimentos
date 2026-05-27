/**
 * Error de dominio con código HTTP asociado.
 * Permite que la capa de presentación responda con el status correcto
 * sin saber nada de la lógica del proyecto.
 */
class AppError extends Error {
  constructor(mensaje, statusCode = 500) {
    super(mensaje);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

class ErrorValidacion extends AppError {
  constructor(mensaje) {
    super(mensaje, 400);
    this.name = 'ErrorValidacion';
  }
}

class ErrorNoEncontrado extends AppError {
  constructor(mensaje) {
    super(mensaje, 404);
    this.name = 'ErrorNoEncontrado';
  }
}

module.exports = { AppError, ErrorValidacion, ErrorNoEncontrado };
