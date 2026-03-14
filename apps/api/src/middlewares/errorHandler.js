export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor único' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
}
