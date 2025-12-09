const express = require("express")
const app = express()
const env = require("dotenv").config();
const db= require("./config/db")
const userRouter = require("./routes/userRouter")
const adminRouter = require("./routes/adminRouter")
const nocache = require("nocache")
const session = require("express-session")
const ejs = require("ejs")
const path = require("path")
const expressLayout = require("express-ejs-layouts")
const methodOverride = require('method-override');
const getBreadcrumbs = require("./middlewares/breadcrum");
const MongoStore = require('connect-mongo');

const passport = require("./config/passport")


db();


app.use(nocache())
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,  
    collectionName: 'sessions'
  }),
    cookie:{
        maxAge: 24*60*60*1000
   }
}))

app.use(methodOverride('_method'));

app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(express.static('public'));

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs")
app.set("views",[path.join(__dirname,"views/user"),path.join(__dirname,"views/admin")])


app.set("layout", false);
//  app.set('layout', '../layout/userAccount');
app.use(expressLayout)

app.use(getBreadcrumbs);

app.use((req, res, next) => {
  res.locals.breadcrumbs = req.breadcrumbs || [];
  next();
});

app.use("/admin",adminRouter)
app.use("/",userRouter)

app.use((req,res,next)=>{
   if(req.originalUrl.startsWith("/admin")){
       return res.status(404).render('pageNotfound')
   } else { 
      return res.status(404).render('page-404');
   }
})

app.use((err, req, res , next)=>{
  console.error(err)
   if(req.originalUrl.startsWith("/admin")){ 
       return res.status(500).render("pageError")
   } else { 
    return res.status(500).render('server-error')
   }

})



app.listen(process.env.PORT,()=>{
    console.log(`server running at port ${process.env.PORT} `);
})


module.exports = app  



 
