var db = require('../config/connections')
var collection = require('../config/collections')
const { Collection } = require('mongodb')
const { response } = require('express')
var objectId = require('mongodb').ObjectId
module.exports = {
    addProduct: (product, callback) => {
        const newProduct = {
            ...product,
            price: product.price && parseInt(product.price)
        }
        db.get().collection('product').insertOne(newProduct).then((data) => {
            callback(data)
        }).catch((error) => {
            callback(error)
        })
    },
    getAllproducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new objectId(proId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getAllproductDetails: (proId) => {
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:new objectId(proId)},{
                $set:{
                    name:proDetails.name,
                    catogary:proDetails.catogary,
                    description:proDetails.description,
                    price:proDetails.price
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}