import * as StoreModel from './store.model.js';

export async function getPublicStore(slug) {
  const store = await StoreModel.findBySlug(slug);
  if (!store) throw Object.assign(new Error('Tienda no encontrada'), { status: 404 });
  return store;
}

export async function getMyStores(ownerId) {
  return StoreModel.findByOwnerId(ownerId);
}

export async function createStore({ name, slug, ownerId }) {
  const existing = await StoreModel.findBySlug(slug);
  if (existing) throw Object.assign(new Error('El slug ya está en uso'), { status: 409 });
  return StoreModel.create({ slug, name, ownerId });
}

export async function updateTheme(storeId, ownerId, theme) {
  // Verificar que la tienda pertenece al owner
  const stores = await StoreModel.findByOwnerId(ownerId);
  const owns = stores.some(s => s.id === storeId);
  if (!owns) throw Object.assign(new Error('No autorizado'), { status: 403 });
  return StoreModel.updateTheme(storeId, theme);
}

export async function updateContact(storeId, ownerId, contact) {
  const stores = await StoreModel.findByOwnerId(ownerId);
  const owns = stores.some(s => s.id === storeId);
  if (!owns) throw Object.assign(new Error('No autorizado'), { status: 403 });
  return StoreModel.updateContact(storeId, contact);
}
