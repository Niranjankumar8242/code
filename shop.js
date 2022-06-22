const express = require('express');
const bcrypt = require('bcrypt');
const redis = require('redis');
const cors = require('cors');

const JWTR = require('jwt-redis').default;
const jwt = require('jsonwebtoken');
const saltRounds = 10;
app = express();
app.use(express.json());
const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const redisClient = redis.createClient(6379, '127.0.0.1');
redisClient.connect();
redisClient.on('connect', function (err) {
    console.log("Redis Connected");
})
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    credentials: true
}))

mongoose.connect("mongodb://localhost:27017/jsonwebtoken")
    .then(() => console.log('connected to db'))
    .catch((err) => console.log(err))
var userschema = new mongoose.Schema({
    name: { type: String },
    age: { type: Number },
    username: { type: String, unique: true, dropDups: true },
    mobile: { type: Number },
    password: { type: String },
    address: { type: String }
});
var user = mongoose.model('user', userschema);

var productschema=new mongoose.Schema({
  productname:{type:String},
  productprice:{type:Number}  
});
var product = mongoose.model('product',productschema);

var cartschema= new mongoose.Schema({
    username :{type:String},
    productid:{type:ObjectId},
    amount:{type:Number}
});
var cart=mongoose.model('card',cartschema);


app.post('/register', async (req, res) => {
    var name = req.query.name;
    var age = req.query.age;
    var username = req.query.username;
    var mobile = req.query.mobile;
    var password = req.query.password;
    var confirmpassword = req.query.password;
    var finduser = await user.findOne({ username: username });

    console.log(finduser);
    if (!finduser) {
        // console.log(name, age, username, mobile, password, confirmpassword);
        bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(password, salt, function (err, hash) {
                // hashpassword = hash;
                // console.log("inside",hash)
                var user1 = new user({
                    name: name,
                    age: age,
                    username: username,
                    mobile: mobile,
                    password: hash
                })
                var result = user.insertMany([user1]);
                console.log(result);
            })
        });
        res.send("Stored");
    }
    else {
        res.send("User Already exist");
    }
})
// console.log("outside",hashpassword)

app.get('/login', async (req, res) => {
    var username = req.query.username;
    var password = req.query.password;
    try {
        username = await user.findOne({ username: username });
        const ismatch = await bcrypt.compare(password, username.password);
        if (ismatch) {
            // tokenid(username._id,);
            let id = username.username;
            console.log("username id", id);
            const token = await jwt.sign({ id }, "mynameisniranjankumarfromgayabihar");
            // console.log("token", token)
            let key = 'tokens';
            let getCacheData = await redisClient.get(key);
            let data = { token }
            let response = '';
            if (getCacheData) {
                response = JSON.parse(getCacheData);
                console.log('GETcache');
                // console.log(response);
            } else {
                console.log("SET cache");
                redisClient.set(key, JSON.stringify(data), { EX: 6000 });
                response = data;
                // console.log("respose",response)
            }

            res.status(200).send(token);
        }
        else {
            res.send("Invalid Password")
        }
    }
    catch {
        res.send("Invalid Username")
    }
})
app.get('/verify', async (req, res) => {
    let getCacheData = await redisClient.get('tokens');
    let response = '';
    if (getCacheData) {
        response = JSON.parse(getCacheData);
        // console.log('GETcache');
        // console.log(response);
        // var decoded = jwt.verify(response.token, 'mynameisniranjankumarfromgayabihar');
        try {
            jwt.verify(response.token, 'mynameisniranjankumarfromgayabihar');
            res.send("Token verified");
        }
        catch {
            res.send("Invalid Token/Secret Key");
        }
        //    .then((result,error)=>{
        //         if(result){
        //             res.send("Token verified");
        //         }
        //         else{
        //             res.send(error)
        //         }
        //     })
        // console.log("result", decoded);

    }
    else {
        res.send("Session Expired Please Login To Verify Token");
    }
})
// app.get('/address', async (req, res) => {
//     var token = req.headers.token;
//     let getCacheData = await redisClient.get('tokens');
//     let response = '';
//     if (getCacheData) {
//         response = JSON.parse(getCacheData);
//         var redistoken = response.token;
//         try {
//             var decoded = jwt.verify(response.token, 'mynameisniranjankumarfromgayabihar');

//             if (token == redistoken) {
//                 var userid = decoded.id;
//                 console.log(req.query.address);
//                 console.log("before");
//                 var userdata = await user.findOne({ username:userid });
//                 res.send(userdata.address)
//                 // var userdata = await user.updateOne({ username: userid },
//                 //     { $set: { address: req.query.address } },{upsert:true}
//                 // )
//                 //     console.log("after");
//                 // res.send("userdata");
//             }
//             else {
//                 res.send("Token Not Verified")
//             }
//         }
//         catch {
//             res.send("Invalid Token/Secret Key");
//         }
//     }
//     else {
//         res.send("Session Expired Please Login To Verify Token");
//     }
// })

app.post("/product",async(req,res)=>{
    var productname=req.query.name;
    var productprice=req.query.price;
    var product1 = await new product({
        productname:productname,
        productprice:productprice
    })
    var result = await product.create([product1]);
    // console.log(result);
    res.send(result);
})

app.get("/add-to- cart",async(req,res)=>{
    var token=req.headers.token;
    var decoded = jwt.verify(token, 'mynameisniranjankumarfromgayabihar');
    console.log(decoded.id)
    var productid=req.query.productid;


    // user.aggregate([
    //    { $lookup: {
    //         from: "products",
    //         localField: "decoded.id",
    //         foreignField: "productid",
    //         as: "card"
    //     }}
    // ]).then((result, error) => {
    //     if (result) {
    //         res.send(result)
    //     }
    //     else {
    //         res.send(error)
    //     }
    // })


    // res.send(decoded);
})


app.post("/logoutall", async (req, res) => {
    let getCacheData = await redisClient.get('tokens');
    let response = '';
    if (getCacheData) {
        response = JSON.parse(getCacheData);
        console.log(response);
        redisClient.del('tokens')
        // JWTR.destroy(response.token);
        res.send("logged Out");
    }
    else {
        res.send("Already Session Expired ");
    }

    // jwtr.destroy(token)
})

// app.post('/reactlogin', async (req, res) => {
//     var hello = await req.body;
//     console.log(hello);
// })
app.listen(4242, () => {
    console.log("Port is running");
})