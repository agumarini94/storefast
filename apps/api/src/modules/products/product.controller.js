import * as productService from './product.service.js';

export async function getProducts(req, res, next) {
  try {
    const { category, search } = req.query;
    const products = await productService.getProducts(req.store.id, { category, search });
    res.json(products);
  } catch (err) { next(err); }
}

export async function createProduct(req, res, next) {
  try {
    const product = await productService.createProduct(
      req.store.id, req.user.userId, req.body
    );
    res.status(201).json(product);
  } catch (err) { next(err); }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await productService.updateProduct(
      req.params.productId, req.store.id, req.user.userId, req.body
    );
    res.json(product);
  } catch (err) { next(err); }
}

export async function deleteProduct(req, res, next) {
  try {
    await productService.deleteProduct(
      req.params.productId, req.store.id, req.user.userId
    );
    res.status(204).send();
  } catch (err) { next(err); }
}
