import Router from 'koa-router';
import assetController from '../controllers/assetController.js';

const router = new Router({
    prefix: '/api/asset'
});

router.get('/list', assetController.list);
router.post('/create', assetController.create);
router.put('/:id', assetController.update);
router.delete('/:id', assetController.delete);
router.get('/last-items', assetController.getLastItems);

export default router;
