const apiCaller = require('./apiCalls');



//This function needs to take the origin and set req.session.origin
//This needs to iterate through the list and update the times of any active cards
async function setLocationPost(req, res)
{
    let origin = req.body.myPlace;
    req.session.origin = origin

    //If are cards reset all of their times
    if (req.session.cards)
    {
        //Iterate through loaded cards and set their timeTo
        //to a new timeTo generated by recalling google API with a new origin.
        for (let i = 0; i  < req.session.cards.length; i++)
        {
            try
            {
                let callResponse = await apiCaller.callGoogleDirections(origin, req.session.cards[i].title);
                req.session.cards[i].timeTo = callResponse.time;
            }
            catch(error)
            {
                console.log("There was an error attempting to update card location times");
            }
        }
    }
    res.redirect('/');
}

module.exports = {
    setLocationPost: function(req, res)
    {
        setLocationPost(req, res);
    }
}