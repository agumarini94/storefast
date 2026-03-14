import * as ProductModel from './product.model.js';
import * as StoreModel from '../stores/store.model.js';

async function assertOwnership(storeId, ownerId) {
  const stores = await StoreModel.findByOwnerId(ownerId);
  const owns = stores.some(s => s.id === storeId);
  if (!owns) throw Object.assign(new Error('No autorizado'), { status: 403 });
}

export async function getProducts(storeId, filters) {
  return ProductModel.findByStore(storeId, filters);
}

export async function createProduct(storeId, ownerId, data) {
  await assertOwnership(storeId, ownerId);
  return ProductModel.create(storeId, data);
}

export async function updateProduct(productId, storeId, ownerId, data) {
  await assertOwnership(storeId, ownerId);
  const product = await ProductModel.update(productId, storeId, data);
  if (!product) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  return product;
}

export async function deleteProduct(productId, storeId, ownerId) {
  await assertOwnership(storeId, ownerId);
  const deleted = await ProductModel.remove(productId, storeId);
  if (!deleted) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  return deleted;
}
