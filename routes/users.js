var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const userHelper = require('../helpers/user-helpers');
const { response } = require('../app');

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  productHelper.getAllproducts().then((products) => {
    res.render('user/view-products', { products, user, cartCount })
  })
});
router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    // window.location.href = "/"
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.loginErr })
    req.session.loginErr = false
  }
})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})
router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response);
    req.session.loggedIn = true
    req.session.user = response
    res.redirect('/')
  })
})
router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginErr = true
      res.redirect('/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})
router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelper.getCartProducts(req.session.user._id)
  let totalValue = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/cart', { products, user: req.session.user, totalValue })
})
router.get('/add-to-cart/:id', (req, res) => {
  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})
router.post('/change-product-quantity', (req, res, next) => {
  userHelper.changeProductQuantity(req.body).then((response) => {
    res.json(response)
  })
})
router.get('/cart/:cartId/product/:productId/delete', (req, res, next) => {
  const { cartId, productId } = req.params
  userHelper.removeCartProduct(cartId, productId).then((response) => {
    res.redirect('/cart')
  })
})
router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order', { total, user: req.session.user })

})
router.post('/place-order', async (req, res) => {
  let products = await userHelper.getCartProductList(req.body.userId)
  let totalPrice = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body, products, totalPrice).then((response) => {
    res.json({ status: true, orderId: response.insertedId.toString() })
  })

})
router.get('/order-placed/:orderId', async (req, res) => {
  let order = await userHelper.getOrder(req.params.orderId)
  res.render('user/order-placed', { order })

})

module.exports = router;
