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



// ROUTES
app.get("/", function(req, res){
   res.render("home");
});

app.post("/", function(req, res){
    //get the string from the html
    var searchString = req.body.searchString;
    var minFollowersCount = 5;
    var maxTweets = 5;
    if(req.body.maxTweets){
        maxTweets = req.body.maxTweets;
    }
    if(req.body.tweetsCount){
        tweetsCount = req.body.minFollowersCount;
    }
    
    console.log("Search: "+searchString);
    console.log("Minimum Followers Set to: "+minFollowersCount);
    console.log("Maximum Tweets Set to: "+maxTweets);
    var tweetsCount = 0;
    var totalScore  = 0;
    
    client.stream('statuses/filter', {track: searchString},  function(stream) {
        stream.on('data', function(tweet) {
            if(tweet.user.followers_count >= minFollowersCount){
                
                maxTweets--;
                tweetsCount++;
                var r1 = sentiment(tweet.text);
                totalScore = totalScore + r1.score;
                
                console.log("-----------------------");
                console.log("Tweet["+tweetsCount+"]: "+tweet.text);
                console.log("User Followers: "+tweet.user.followers_count);
                console.log("Score: "+r1.score);
            }
            if(maxTweets <= 0){
                console.log("============");
                console.log("Total Average Score: "+totalScore/tweetsCount);
                stream.destroy();
            }
        });
        stream.on('error', function(error) {
            console.log(error);
        });
    });
    
    res.redirect("/");
});


app.get("/about", function(req, res){
   res.render("about");
});














app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server Started!"); 
});