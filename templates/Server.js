const express=require('express');
const cookieParser=require("cookie-parser");
const sessions=require('express-session');
const http=require('http');
var parseUrl=require('body-parser');
const app=express();

var mysql=require('mysql');
const{encode}=require('punycode');

var crypto=require('crypto');

var hash=crypto.createHash('sha256');

let encodeUrl=parseUrl.urlencoded({extended:false});

//session middleware
app.use(sessions({
    secret:"thisismysecrctekey",
    saveUninitialized:true,
    cookie:{maxAge:1000*60*60*24}, // 24 hours
    resave:false
}));

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var con=mysql.createConnection({
    host:"localhost",
    user:"root", // my username
    password:"", // my password
    database:"agronow"
});

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/register.html');
})

app.post('/register',encodeUrl,(req,res)=>{
    var email=req.body.email;
    var password=req.body.enterpass;
    var pass=req.body.confirmpass;
    if(password==pass){
    password=hash.update(password); 
    password=hash.digest(password);
    }
    var category=req.body.accounttype;
    if(category=='farmer')
    {
        category=true;
    }
    else if(category=='customer')
    {
        category=false;
    }
    else {
        res.redirect("/register");
    }

    con.connect(function(err) {
        if (err){
            console.log(err);
        };
        // checking user already registered or no
        con.query(`SELECT * FROM users WHERE user_email='${email}'`,function(err,result){
            if(err){
                console.log(err);
            };
            if(Object.keys(result).length>0){
                res.sendFile(__dirname+'/failReg.html');
            }else{
            //creating user page in userPage function
            function userPage(){
                // We create a session for the dashboard (user page) page and save the user data to this session:
                req.session.user={
                    email:email,
                    password:password 
                };

                res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <title>Login and register form with Node.js, Express.js and MySQL</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                </head>
                <body>
                    <div class="container">
                        <h3>Hi, ${req.session.user.firstname} ${req.session.user.lastname}</h3>
                        <a href="/logout">Log out</a>
                    </div>
                </body>
                </html>
                `);
            }
                // inserting new user data
                var sql=`INSERT INTO users(user_email,user_pass,category) VALUES('${email}','${password.toString('hex')}',${category})`;
                con.query(sql,function(err,result){
                    if (err){
                        console.log(err);
                    }else{
                        // using userPage function for creating user page
                        userPage();
                    };
                });
        }
        });
    });
});

app.get("/login",(req,res)=>{
    res.sendFile(__dirname+"/signin.html");
});

app.post("/dashboard",encodeUrl,(req,res)=>{
    var userName=req.body.username;
    var password=req.body.password;
    password=hash.update(password);
    password=hash.digest(password);

    con.connect(function(err){
        if(err){
            console.log(err);
        };
        con.query(`SELECT * FROM users WHERE user_email='${userName}' AND user_pass='${password.toString('hex')}'`,function(err,result){
          if(err){
            console.log(err);
          };

          function userPage(){
            // We create a session for the dashboard (user page) page and save the user data to this session:
            req.session.user={
                firstname:result[0].firstname,
                lastname:result[0].lastname,
                username:userName,
                password:password 
            };
            res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <title>Login and register form with Node.js, Express.js and MySQL</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="container">
                    <h3>Hi, ${req.session.user.firstname} ${req.session.user.lastname}</h3>
                    <a href="/logout">Log out</a>
                </div>
            </body>
            </html>
            `);
        }

        if(Object.keys(result).length>0){
            userPage();
        }else{
            res.sendFile(__dirname+'/failLog.html');
        }
        });
    });
});


app.get('/logout',  function (req, res, next)  {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

//app.listen(3000,function(){
//  console.log('Shopping cart app listening on port 3000!');
//});
app.listen(4000,()=>{
    console.log("Server running on port 4000");
});



/*app.get('/',function(req,res) {
  res.sendFile(__dirname+'/.html');
});

app.post('/add-to-cart',function(req,res) {
  var productId=req.body.productId;
  var sql="SELECT * FROM products WHERE id=";
  con.query(sql,[productId],function(error,results,fields){
    if(error) throw error;
    var product=results[0];
    var cart=req.session.cart||[];
    cart.push(product);
    req.session.cart=cart;
    res.send({status:'success',message:'Product added to cart'});
  });
});