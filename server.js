'use strict';
require('dotenv').config();
const express = require ('express');
const pg = require ('pg');
const cors = require('cors')
const superagent = require('superagent');
const methodOverride = require ('method-override');
const {compile} = require ('ejs');

const PORT = process.env.PORT || 3030
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const client = new pg.Client(process.env.DATABASE_URL);

app.get('/',getData)
app.get('/countyResult',getCountyResults)
app.get('/all',getAll)
app.post('/saveDB',saveDBfunc)
app.put('/update/:id',updatefun)
app.delete('/delete/:id',deletefun)
function getData(req,res){
let url = `https://api.covid19api.com/world/total`;
superagent.get(url).then(item=>{
    // console.log(item.body)
    res.render('pages/index' , {data:item.body})
})
}
function getCountyResults(req,res){
    let country = req.query. country;
    let fromDate = req.query. from;
    let toData = req.query.to;
    let e = [];
    let url = `https://api.covid19api.com/country/${country}/status/confirmed?from=${fromDate}T00:00:00Z&to=${toData}T00:00:00Z`;
    superagent.get(url).then(item=>{
        // console.log(item)
        let datas = item.body;
        datas.forEach(result=>{
            e.push(new DataCue(result));
        })
        console.log(e);
        res.render('pages/country',{data : e})
    })
}

function getAll(req,res){
    let url=`https://api.covid19api.com/summary`
    superagent.get(url).then(item=>{
        // console.log(item.body.Countries)
        res.render('pages/all',{data : item.body.Countries})
    })
}

async function saveDBfunc(req,res){
    let country = req.body.Country;
    let totalconfirmed = req.body.TotalConfirmed[0];
    let totalrecovered = req.body.TotalRecovered;
    let totaldeaths = req.body.TotalDeaths;
    let date = req.body.Date;
    let sql = `INSERT INTO covid (country,totalconfirmed,totalrecovered,totaldeaths,date) VALUES ($1,$2,$3,$4,$5)`;
    let values = [country,totalconfirmed,totalrecovered,totaldeaths,date];
    client.query(sql,values).then(item=>{
        console.log(item);
    })
      let getDB = await getDataBase();
      console.log(getDB);
      res.render('/pages/dataDB',{data : getDB} )    
}
function getDataBase(){
    let sql2=`SELECT * FROM covid`;
    return client.query(sql2).then(result=>{
        return result;
    })
}

function updatefun(req,res){
    let Country = req.body.Country;
    let TotalConfirmed = req.body.TotalConfirmed[0];
    let TotalDeaths = req.body.TotalDeaths;
    let TotalRecovered = req.body.TotalRecovered;
    let Date = req.body.Date;
    let sql =`UPDATE covid SET (Country,TotalConfirmed,TotalDeaths,TotalRecovered,Date) VALUES ($1,$2,$3,$4,$5) `;
    let values = [Country,TotalConfirmed,TotalRecovered,TotalDeaths,Date,req.params.id];
    client.query(sql,values).then(item=>{
        console.log(item);
    })
}
function deletefun(req,res){
    let sql = `DELETE FROM covid WHERE id=$1`
    value=[req.params.id];
    client.query(sql,value).then(item=>{
    //  res.redirect('/')
    })
}

function DataCue(datas){
    this.Date = datas.Date,
    this.Cases = datas.Cases
}

client.connect(()=>{
    app.listen(PORT,()=>{
        console.log(`we are listening to ${PORT}`)
    }) 
})