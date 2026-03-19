import * as analyticsModel from './analytics.model.js';

export async function trackEvent(req, res, next) {
  try {
    const { productId } = req.body;
    if (productId && req.store?.id) {
      // fire-and-forget — don't block the HTTP response
      analyticsModel.recordEvent(req.store.id, productId).catch(() => {});
    }
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function getStats(req, res, next) {
  try {
    const stats = await analyticsModel.getStoreStats(req.store.id);
    res.json(stats);
  } catch (err) { next(err); }
}
