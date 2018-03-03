var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var sentiment = require('sentiment');

//TWIT
var Twit = require("twit");
var config = require('./config');
var T = new Twit(config);


app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");




// ROUTES
app.get("/", function(req, res){
   res.render("home");
});

app.post("/", function(req, res){
    //get the string from the html
    var searchString = req.body.searchString;
    console.log("Search: "+searchString);
    
    
    
    
    var params = { 
      q: searchString, 
      count: 100, //maximum 100
      lang: 'en'
    };
    function gotData(err, data, response) {
      if(err){
        console.log(err);
      }
      
      var tweets = data.statuses;
      for(var i=0; i<tweets.length; i++){
        var r1 = sentiment(tweets[i].text);
        console.log("---------------------");
        console.log("Tweet["+i+"]: "+tweets[i].text);
        console.log("User Followers: "+tweets[i].user.followers_count);
        console.log("Tweet Language: "+tweets[i].lang);
        console.log("Score: "+r1.score);
      }
      // console.log(data)  -> will print the whole tweet json with all attributes.
    };
    T.get('search/tweets', params, gotData);
    
    
    
    
    
    res.redirect("/show");
});



app.get("/show", function(req, res){
    res.render("show");
});


app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server Started!"); 
});