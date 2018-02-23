var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var Twitter = require('twitter');
var sentiment = require('sentiment');


var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});



console.log(process.env.TWITTER_CONSUMER_KEY);
console.log(process.env.TWITTER_CONSUMER_SECRET);
console.log(process.env.TWITTER_ACCESS_TOKEN_KEY);
console.log(process.env.TWITTER_ACCESS_TOKEN_SECRET);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");




app.get("/", function(req, res){
   res.render("home");
});

app.post("/", function(req, res){
    //get the string from the html
    var searchString = req.body.searchString;
    console.log("Search: "+searchString);
    
    
    // //get the tweets
    // client.stream('statuses/filter', {track: 'twitter'},  function(stream) {
    //   stream.on('data', function(tweet) {
    //     console.log(tweet.text);
    //     count = count + 1;
        
    //   });
    //   stream.on('error', function(error) {
    //     console.log(error);
    //   });
    // });
    
    var totalScore = 0;
    client.get('search/tweets', {q: searchString}, function(error, tweets, response) {
        for(var i = 0; i< tweets.statuses.length; i++){
            console.log("-------------------------------------");
            console.log("TWEET ["+i+"]");
            console.log("Tweet: "+tweets.statuses[i].text);
            var r1 = sentiment(tweets.statuses[i].text);
            console.log("Score: "+r1.score);
            totalScore = totalScore + r1.score;
        }
        console.log("FINAL SCORE: "+searchString+": "+totalScore/tweets.statuses.length);
    });

    
    
    res.redirect("/");
});

app.get("/about", function(req, res){
   res.render("about");
});







 







app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server Started!"); 
});