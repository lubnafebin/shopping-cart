var express = require('express');
const { log } = require('handlebars');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelper.getAllproducts().then((products) => {
    console.log(products);
    res.render('admin/view-products', { admin: true, products })
  })
});
router.get('/add-product', function (req, res) {
  res.render('admin/add-product')
})
router.post('/add-product', (req, res) => {
  productHelper.addProduct(req.body, (id) => {
    console.log("Id", id.insertedId);

    let image = req.files.image
    image.mv('public/product-images/' + id.insertedId + '.jpg', (err, done) => {
      if (!err) {
        res.render("admin/add-product")
      } else {
        console.log(err);
      }
    })
  })
})
router.get('/delete-product:id', (req, res) => {
  let proId = req.params.id
  productHelper.deleteProduct(proId).then((response) => {
    res.redirect('/admin/')
  })
})
router.get('/edit-product:id', async (req, res) => {
  let product = await productHelper.getAllproductDetails(req.params.id)
  res.render('admin/edit-product', { product })
})
router.post('/edit-product:id', (req, res) => {
  let id=req.params.id
  productHelper.updateProduct(id, req.body).then(() => {
    res.redirect('/admin/')
    if (req.files.image) {
      let image=req.files.image
      image.mv('public/product-images/' + id + '.jpg')
    }
  })
})


module.exports = router;
