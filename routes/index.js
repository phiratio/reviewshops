const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const express = require('express');
const router = express.Router();

const {catchErrors} = require('../handlers/errorHandlers');

router.get('/', catchErrors(storeController.getStores));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/add',
    authController.isLoggedIn,
    storeController.addStore);
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.post('/add',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.createStore));
router.post('/add/:id',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore));
router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));
router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);
//1 validate the registration data
//2 register the user
//3 log in the registered user
router.post('/register',
    userController.validateRegister,
    userController.register,
    authController.login
);
router.get('/logout', authController.logout);
router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
    authController.confirmedPasswords,
    catchErrors(authController.update));
//router.get('/', storeController.myMiddleware, storeController.homePage);
router.get('/map', storeController.mapPage);
router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getHearts));
router.post('/reviews/:id', authController.isLoggedIn, catchErrors(reviewController.addReview));
/*
router.get('/', (req, res) => {
    const bob = {name: 'bob', age: 69, iscool: true};
    //res.send('Hey! It works!');
    //res.json(bob);
    //res.send(req.query.name);
    //res.json(req.query);
    res.render('hello',{
        name: 'bob',
        dog: 'balo',
        title: 'shano',
        cat: req.query.cat
    });
});
*/

/*router.get('/reverse/:name', (req, res) => {
   const reverse = [...req.params.name].reverse().join('');
   res.send(reverse);
});*/

/*
*  API
*/

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));
router.get('/top', catchErrors(storeController.getTopStores));

module.exports = router;
