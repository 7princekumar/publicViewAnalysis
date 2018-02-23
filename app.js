var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");





app.get("/", function(req, res){
   res.render("home");
});

app.post("/", function(req, res){
    var searchString = req.body.searchString;
    console.log(searchString);
});

app.get("/about", function(req, res){
   res.render("about");
});





app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server Started!"); 
});