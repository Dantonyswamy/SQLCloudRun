const mysql = require('mysql');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const port = process.env.PORT || 8080;

app.listen(port,() => {
    console.log('REST API listening on port ', port);
});

app.get('/', async (req, res) => {
    res.json({status:'API is ready to serve desserts from ' + process.env.LOCATION});
  });

app.get('/:id', async (req,res) => {
    const id = parseInt(req.params.id);
    const dessert = await getDessert(id); // function to get dessert from SQL
    res.json({status:'success', data:{dessert:dessert}});
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