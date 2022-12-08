const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3001;

// view engine
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

// path for scripts
app.use(express.static(path.join(__dirname, 'scripts')));

// body parser
app.use(bodyParser.urlencoded({extended:false}));

// env loading
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const db = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;

// mongo loading
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.9kt3anv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const DOG_ENDPOINT = "https://dog.ceo/api/breeds/image/random";
let currDog; // holds current dog link
/* 
ENDPOINTS
*/
// Main page
app.get("/", (request, response) => {
    // get dog and load page
    const dog = axios.get(DOG_ENDPOINT);
    dog.then((json) => {
            if(json.data.status == "success"){
                let imgSrc = json.data.message;
                currDog = imgSrc;
                const params = {"imgSrc" : imgSrc}
                response.render("index", params);
            } else {
                response.render("noDogFound");
            }
        })
        .catch((error) => {
            console.log(error.response?.data?.message);
            response.render("noDogFound");
        });
});

// Input caption page
app.get("/caption", (request, response) => {
    if(currDog != undefined){
        const params = {"imgSrc" : currDog}
        response.render("caption", params);
    } else {
        response.render("noDogFound");
    }
});

// Gets new dog
app.get("/newDog", (request, response) => {
    // get dog and load page
    const dog = axios.get(DOG_ENDPOINT);
    dog.then((json) => {
            if(json.data.status == "success"){
                let imgSrc = json.data.message;
                currDog = imgSrc;
                const params = {"imgSrc" : imgSrc}
                response.render("caption", params);
            } else {
                response.render("noDogFound");
            }
        })
        .catch((error) => {
            console.log(error.response?.data?.message);
            response.render("noDogFound");
        });
});

// gets and displays random dog caption!
app.get("/viewCaption", (request, response) => {
    let entry = getDog();
    entry.then((result) => {
        if(result !== null){
            let to_render = {
                imgSrc : result.link,
                name : result.name,
                caption : result.caption
            }
            response.render("viewCaption", to_render);
        } else {
            response.render("noDogFound");
        }
    });
});

// process application
app.post("/submitCaption", (request, response) => {
    // add application
    let to_add = {
        link : currDog,
        name : request.body.name,
        caption : request.body.caption
    }
    insertCap(to_add);
    const params = {
        "imgSrc" : currDog,
        name : request.body.name,
        caption : request.body.caption
    }
    response.render("postSubmit", params);
});

// inserts application into database
async function insertCap(cap){
    try{
        await client.connect();
        const result = await client.db(db).collection(collection).insertOne(cap);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

// gets list for gpa table
async function getDog(){
    let filter = {sample : {size : 1}};
    let result;
    try{
        await client.connect();
        result = await client.db(db).collection(collection).aggregate([{ $sample: {size:1}}]);
        result = await result.next();
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
    return result;
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
