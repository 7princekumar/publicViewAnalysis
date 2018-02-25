var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var Twitter = require('twitter');
var sentiment = require('sentiment');
//const path       = require('path'); //provides utilities for working with file and directory paths

var positiveScore = 0;
var negativeScore = 0;
var positiveTweetCount = 0;
var negativeTweetCount = 0;
var neutralCount = 0;


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
//set public folder
//app.use(express.static(path.join(__dirname, 'public')));


// ROUTES
app.get("/", function(req, res){
   res.render("home");
});

app.post("/", function(req, res){
    //get the string from the html
    var searchString = req.body.searchString;
    var minFollowersCount = 5; //default
    var maxTweets = 5; //default
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
            if((tweet.user.followers_count >= minFollowersCount) && (tweet.lang == 'en')){
                
                maxTweets--;
                tweetsCount++;
                var r1 = sentiment(tweet.text);
                if(r1.score === 0){
                    neutralCount++;
                } else if(r1.score > 0) {
                    positiveTweetCount++;
                    positiveScore += r1.score;
                } else {
                    negativeTweetCount++;
                    negativeScore += r1.score;
                }
                totalScore = totalScore + r1.score;
                
                console.log("-----------------------");
                console.log("Tweet["+tweetsCount+"]: "+tweet.text);
                console.log("User Followers: "+tweet.user.followers_count);
                console.log("Tweet Language: "+tweet.lang);
                console.log("Score: "+r1.score);
            }
            if(maxTweets <= 0){
                console.log("============");
                console.log("Positive Score: ["+positiveTweetCount+" tweets]: " +positiveScore);
                console.log("Negative Score: ["+negativeTweetCount+" tweets]: " +negativeScore);
                console.log("Neutral Count: "+neutralCount);
                console.log("Total Average Score: "+totalScore/tweetsCount);
                stream.destroy();
            }
        });
        stream.on('error', function(error) {
            console.log(error);
        });

    });

    
    res.redirect("/show");
});



app.get("/show", function(req, res){
    var totalTweetCount = positiveTweetCount + negativeTweetCount + neutralCount;
    if(totalTweetCount ===0){
        totalTweetCount = 1;
    }
    var data = {
        positiveTweetPercentage: (positiveTweetCount/totalTweetCount)*100,
        negativeTweetPercentage: (negativeTweetCount/totalTweetCount)*100,
        neutralTweetPercentage: (neutralCount/totalTweetCount)*100
    };
    console.log(positiveTweetCount);
    console.log("Percentage Score: ");
    console.log("Positive Percentage: "+data.positiveTweetPercentage+"%");
    console.log("Negative Percentage: "+data.negativeTweetPercentage+"%");
    console.log("Neutral Percentage: "+data.neutralTweetPercentage+"%");
    res.render("show", data);
});











app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server Started!"); 
});