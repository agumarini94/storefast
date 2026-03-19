import * as authService from './auth.service.js';

export async function registerHandler(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordHandler(req, res, next) {
  try {
    await authService.requestPasswordReset(req.body);
    // Always 200 to prevent email enumeration
    res.json({ message: 'Si el email está registrado, recibirás un enlace.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(req, res, next) {
  try {
    await authService.resetPassword(req.body);
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    next(err);
  }
}

export async function updateProfileHandler(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.userId, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function changePasswordHandler(req, res, next) {
  try {
    await authService.changePassword({ userId: req.user.userId, ...req.body });
    res.json({ message: 'Contraseña actualizada.' });
  } catch (err) {
    next(err);
  }
}
