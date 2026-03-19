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

export async function updateAbout(storeId, ownerId, about) {
  const stores = await StoreModel.findByOwnerId(ownerId);
  const owns = stores.some(s => s.id === storeId);
  if (!owns) throw Object.assign(new Error('No autorizado'), { status: 403 });
  return StoreModel.updateAbout(storeId, about);
}

function slugify(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 60) || 'tienda';
}

export async function updateInfo(storeId, ownerId, { name, updateSlug }) {
  const stores = await StoreModel.findByOwnerId(ownerId);
  const store = stores.find(s => s.id === storeId);
  if (!store) throw Object.assign(new Error('No autorizado'), { status: 403 });

  let slug = store.slug;
  if (updateSlug) {
    const baseSlug = slugify(name);
    slug = baseSlug;
    let suffix = 1;
    while (true) {
      const existing = await StoreModel.findBySlug(slug);
      if (!existing || existing.id === storeId) break;
      slug = `${baseSlug}-${suffix++}`;
    }
  }

  return StoreModel.updateInfo(storeId, { name, slug });
}
