const { MongoClient } =require("mongodb")
//initail db config
let db = {state:null}
//export main
module.exports.connect= async ()=>{
    try {
        const uri ="mongodb://127.0.0.1:27017"
        const database ="shopping"
        const client = new MongoClient(uri)
        await client.connect()
        db.state = client.db(database)
        console.log("Database connected successfully")
    } catch (error) {
        console.error(error)
    }
}
module.exports.get = () => db.state