const mysql = require('mysql');
const express = require('express');
const cors = require('cors')
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(cors())
const {OAuth2Client} = require('google-auth-library');

const port = process.env.PORT || 8080;
const CLIENT_ID = '735423714813-lu86p7bdssuc841bp9h1cctt996pf49t.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID); //to identify the right client from where the request is coming
app.listen(port,() => {
    console.log('REST API listening on port ', port);
});

app.get('/', async (req, res) => {
    res.json({status:'API is ready to serve desserts from ' + process.env.LOCATION});
  });

app.get('/:id', async (req,res) => {
    const userId = await getUserId(req.headers['authorization']);
    if (hasAccess(userId)){
        const id = parseInt(req.params.id);
    const dessert = await getDessert(id); // function to get dessert from SQL
    res.status(200).json({status:'success', data:{dessert:dessert}});
    } else {
        res.sendStatus(403);
    }
    
});

app.post('/', async(req, res) => {
   const id = await createDessertFromDb(req.body);
   const dessert = await getDessert(id);
   res.json({status:'success', data:{dessert:dessert}}); 
});

function createDessertFromDb(fields){
    return new Promise(function(resolve, reject){
        const sql = 'INSERT INTO desserts SET ?';
        getDBPool().query(sql,fields,(err, results) => {
            resolve(results.insertId) //insertID is the magic variable that we get after a successful data row insertion
        });
    });
}
//Making SQL instance connection
let cacheDBPool; //to cache SQL instance values to prevent frequent connections for every request
function getDBPool() {
    if(!cacheDBPool){
        cacheDBPool = mysql.createPool({
            connectionLimit:1,
            user:process.env.SQL_USER,
            password:process.env.SQL_PASSWORD,
            database:process.env.SQL_NAME,
            socketPath:`/cloudsql/${process.env.INST_CON_NAME}`
        });
    }
    return cacheDBPool;
}

async function getDessert(id){
    return new Promise(function(resolve,reject){
     const sql ='SELECT * FROM desserts where id=?';
     getDBPool().query(sql, [id], (err, results) => {
         resolve(results[0]);
     })   
    });    
}

async function getUserId(authorizationHeader) {
    try {
        const userJwtToken = authorizationHeader.replace('Bearer ','');
        const ticket = await client.verifyIdToken({
            idToken: userJwtToken,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const userId = payload['sub'] || payload['hd']; 
        return userId;           
    }
    catch (ex) {
        console.error(ex);
        return '';
    }
}

function hasAccess(userId) {
    const userIds = ['104308542447035482453'];
    return userIds.includes(userId);

}