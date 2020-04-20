const express = require('express');
const apiCaller = require('./apiCalls');
const app = express();


app.get('/test/google', async (req,res) => 
{
    //Valid request
    console.log(await apiCaller.callGoogleDirections("boulder", "denver"));

    //Invalid Request with valid locations
    console.log(await apiCaller.callGoogleDirections("boulder", "london"));

    //Invalid request with invalid locations
    console.log(await apiCaller.callGoogleDirections("---93d", "this is 100% not going to be a place"));

    res.redirect('/');
});




module.exports = app
