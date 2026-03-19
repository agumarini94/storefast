import * as storeService from './store.service.js';

export async function getPublicStore(req, res, next) {
  try {
    const store = await storeService.getPublicStore(req.params.slug);
    res.json(store);
  } catch (err) { next(err); }
}

export async function getMyStores(req, res, next) {
  try {
    const stores = await storeService.getMyStores(req.user.userId);
    res.json(stores);
  } catch (err) { next(err); }
}

export async function createStore(req, res, next) {
  try {
    const store = await storeService.createStore({
      ...req.body,
      ownerId: req.user.userId,
    });
    res.status(201).json(store);
  } catch (err) { next(err); }
}

export async function updateTheme(req, res, next) {
  try {
    const store = await storeService.updateTheme(
      req.params.storeId,
      req.user.userId,
      req.body
    );
    res.json(store);
  } catch (err) { next(err); }
}

export async function updateContact(req, res, next) {
  try {
    const store = await storeService.updateContact(
      req.params.storeId,
      req.user.userId,
      req.body
    );
    res.json(store);
  } catch (err) { next(err); }
}

export async function updateAbout(req, res, next) {
  try {
    const store = await storeService.updateAbout(
      req.params.storeId,
      req.user.userId,
      req.body
    );
    res.json(store);
  } catch (err) { next(err); }
}

export async function updateInfo(req, res, next) {
  try {
    const store = await storeService.updateInfo(
      req.params.storeId,
      req.user.userId,
      req.body
    );
    res.json(store);
  } catch (err) { next(err); }
}
