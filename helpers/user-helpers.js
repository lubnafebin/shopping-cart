var db = require('../config/connections')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
var objectId = require('mongodb').ObjectId
module.exports = {
    doSignup: (userdata) => {
        return new Promise(async (resolve, reject) => {
            userdata.password = await bcrypt.hash(userdata.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userdata).then((response) => {
                resolve(response)

            })
        })
    },
    doLogin: (userdata) => {
        return new Promise(async (resolve, reject) => {
            let loginstatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userdata.email })
            if (user) {
                bcrypt.compare(userdata.password, user.password).then((status) => {
                    if (status) {
                        console.log("Login success");
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("Login failed");
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("Login failed");
                resolve({ status: false })
            }
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: new objectId(proId),
            quantity: 1
        }

        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.find(product => product.item.toString() == proId)
                if (proExist) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: new objectId(userId), 'products.item': new objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }

                            })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: new objectId(userId) },
                        {
                            $push: { products: proObj }
                        }
                    ).then((response) => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: new objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(cartItems)
        })

    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new objectId(details.cart) },
                    {
                        $pull: { products: { item: new objectId(details.product) } }
                    }).then((response) => {
                        resolve({ success: true, message: "Product removed successfully", removeCart: true })
                    }).catch((err) => reject({ success: false, message: 'Faild remove the product from cart' }))
            } else {

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: new objectId(details.cart), 'products.item': new objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }

                        }).then((response) => {
                            resolve({ success: true, message: 'Cart count updated' })
                        }).catch((err) => reject({ success: false, message: 'Faild update the cart' }))
            }

        })

    },
    removeCartProduct: async (cartId, productId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CART_COLLECTION)
                .updateOne(
                    { _id: new objectId(cartId) },
                    {
                        $pull: { products: { item: new objectId(productId) } }
                    }).then((response) => {
                        resolve({ success: true, message: "Product removed successfully", removeCart: true })
                    }).catch((err) => reject({ success: false, message: 'Faild remove the product from cart' }))
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }

            ]).toArray()
            resolve(total[0]?.total)
        })

    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order['payment-method'] === 'Cash on delivery' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: new objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                status: status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: new objectId(order.userId) })
                resolve(response)
            })

        })

    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userId) })
            console.log(cart);
            resolve(cart.products)

        })

    },
    getOrder: async (orderId) => {
        try {
            const order = await db.get()
                .collection(collection.ORDER_COLLECTION)
                .findOne({ _id: new objectId(orderId) });

            if (!order) {
                // Handle case where order is not found
                return null;
            }

            // Fetch product details for each item in the order
            const productDetails = await Promise.all(order.products.map(async (product) => {
                const productInfo = await db.get()
                    .collection(collection.PRODUCT_COLLECTION)
                    .findOne({ _id: new objectId(product.item) });

                // Concatenate product details with the order
                return {
                    ...product,
                    ...productInfo,
                };
            }));

            // Update the order with product details
            order.products = productDetails;

            return order;
        } catch (error) {
            // Handle any errors (e.g., database connection issues)
            console.error('Error fetching order:', error);
            throw error;
        }
    }







}




