const userModel = require('../models/user');
const helpers = require('./helpers');
const request = require('request');


//This route is intended to search for a list and then load it into response cards
//IT IS NOT FINISHED
function getList(req, res)
{
    req.session.cards = [];

    //Generate response assuming the user is logged in
    let response = helpers.createNewResponse(req.session.cards);
    response.isLoggedIn = req.session.user.isLoggedIn;
    response.username = req.session.user.name;
    response.lists = req.session.user.lists;

    //Search the database for the current logged in user
    userModel.findOne(
        {
            username: req.session.user.name
        }, 
        //Make this function specifcally async so that we can block it using await when we want to call openweather and google api later on
        async function(error, user)
        {
            if(error)
            {
                console.log("No user found");
            }
            //Found a user
            else
            {
                listToLoad = [];
                //Iterate through the users list and find the list with the specified name
                for (let i = 0; i < user.lists.length; i++)
                {
                    //If the users has a list with the specified name
                    if (user.lists[i].name == req.params.name)
                    {
                        listToLoad = user.lists[i];
                        break;
                    }
                }

                //Iterate through all of the locations in the users list
                for (let i = 0; i < listToLoad.locations.length; i++)
                {
                    //This following is making node (which is normally async) sync. Essentially, we need to call request a bunch of times
                    // and it is important that request finishes calling before we move onto the next step in our code. So we will tell node
                    // to wait for some return value from the following function before continuing. This ensures us that we have actual data 
                    // to add to our users card list before we end up actually sending that data over.
                    try
                    {
                        let newCard = await getSyncCard(listToLoad.locations[i]);
                        req.session.cards.push(newCard);
                    }
                    catch (error)
                    {
                        console.log("Something went wrong...\n" + error);
                    }
                }
            }
            //console.log(response);
            //res.render('pages/index', response);
            res.redirect('/');
        }
    );
}

//This function returns a promise. A promise just guarentees that there will be a value there. If this function executes "correctly"
// then we return the data in 'resolve', if there was an error then we return the error in 'reject'. Technically, this function isn't
// sync, but we can treat it as a blocking function in an async function but calling it with the 'await' keyword. Which we do above.
function getSyncCard(location) 
{
    return new Promise((resolve, reject) => {
        let urlWeather = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.OPENWEATHER}`

        request(urlWeather, (error, resp, body) => 
        {
            if (!error && resp.statusCode == 200) 
            { 
                //The variables below are set to the required data we got from calling openweather
                let weatherJSON = JSON.parse(body);
                let origin = "Boulder";     //This is a placeholder, eventually get from req.session! (or maybe a slider)
                let destination = weatherJSON.name;
                let imageSource = helpers.getWeatherImage(weatherJSON.weather[0].main);
                
                //Create the url for calling googles direction API
                let urlGoogle = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${destination}&key=${process.env.GOOGLE}`;
                
                request(urlGoogle, (error, respond, body) => 
                {
                    //If the call to Google directions was successfull
                    if (!error && respond.statusCode == 200) 
                    {
                        //The variables below are set to the required data we got from calling Google Directions
                        let googleJSON = JSON.parse(body);
                        let name = googleJSON.destination_addresses[0];
                        let timeTo = `From ${googleJSON.origin_addresses[0]}: ${googleJSON.rows[0].elements[0].duration.text}`; //A bug with undefined travel times!
                                    
                        //This can be thought of as returning the following object
                        resolve({
                            title: name,
                            currentTemp: helpers.KtoF(weatherJSON.main.temp),
                            conditions: weatherJSON.weather[0].main,
                            imageSource: imageSource,
                            timeTo: timeTo
                        });          
                    }
                    else
                    {
                        reject(error);
                    }
                });
            }
            else
            {
                reject(error);
            }
        });
    });
}

module.exports = {
    getListGet: function(req, res)
    {
        getList(req, res);
    }
}