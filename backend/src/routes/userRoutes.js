import Router from 'koa-router';
import userController from '../controllers/userController.js';

const router = new Router({
    prefix: '/api/user'
});

router.post('/login', userController.login);
router.get('/list', userController.list);
router.post('/create', userController.create);
router.post('/update', userController.update);
router.post('/change-status', userController.changeStatus);
router.post('/delete', userController.deleteUser);

export default router;
