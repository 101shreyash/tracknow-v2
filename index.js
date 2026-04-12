import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import path from "path";
import pool from "./db.js";
import fs from "fs";
import cookieParser from "cookie-parser"

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

const port = 8001;

app
  .route("/signup")

  .post((req, res) => {
    bcrypt.hash(req.body.password, 12, (err, hashed) => {
      if (err) {
        console.log(err.message);
        res.status(500).send("Internal Server Error");
      }
      pool.query(
        "INSERT INTO userinfo (username,password) VALUES ($1,$2)",
        [req.body.username, hashed],
        (err, result) => {
          if (err) {
            console.log(err.message);
            res.status(500).send("Server Error 500");
          } else {
            res.send("Youre sucessfully signed in");
          }
        },
      );
    });
  });

app.route("/login").post((req, res) => {
  pool.query(
    "SELECT * FROM userinfo WHERE username = $1;",
    [req.body.username],

    (err, result) => {
      if (err) {
        console.log(err.message);
        res.status(500).send("Internal Server Error");
      }
      if (result.rowCount === 0) {
      return  res.status(401).send("Invalid Email");
      }

      const year = new Date ().getFullYear().toString()
      const month = new Date().toLocaleString("en-US",{month : "long"})
      const day = new Date().getDate()

      const monthpath = path.join(year,month)
      const datepath = path.join(monthpath,`${day}.txt`)


      const hashedpassword = result.rows[0].password;
      bcrypt.compare(req.body.password, hashedpassword, (err, decoded) => {
        if (err) {
          console.log(err.message);
         return res.status(500).send("Internal Server Error");
        }
        if (!decoded) {
         return res.send("Invalid Password");
        }
        if (decoded) {
          if(!fs.existsSync(year)){
           fs.mkdirSync(year)
          }
          const token = jwt.sign(

        {userid : result.rows[0].username},
        process.env.SECREAT,
        {expiresIn : "2h"}
      )

          if(!fs.existsSync(monthpath)){
            fs.mkdirSync(monthpath)  
          }
          if(!fs.existsSync(datepath)){

            fs.writeFileSync(datepath , "")

          }
         
       res.cookie("jwt" , token , {httpOnly : true})
       res.send("Logged in Sucessfully Go write Journal Now");

        }
      });
    },
  );
})


const validatejwt = (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) {
    return res.status(401).send("You need to login first");
  }

  jwt.verify(token, process.env.SECREAT, (err, decoded) => {
    if (err || !decoded) {
      return res.status(401).send("Invalid token");
    }

    req.user = decoded;
    next();
  });
};


app.route("/journal").post(validatejwt,(req,res) =>{


const year = new Date ().getFullYear().toString()
const month = new Date().toLocaleString("en-US",{month : "long"})
const monthpath = path.join(year,month)
const day = new Date().getDate()
const datepath = path.join(monthpath,`${day}.txt`)
const cuurentdate = new Date().toTimeString()

console.log("BODY:", req.body);
  console.log("JOURNAL:", req.body.journal);

  fs.appendFileSync(datepath , `time -${cuurentdate} notes : ${req.body.journal}\n`)
  res.send("saved")

})

.get( validatejwt,(req,res) => {

  const year = new Date ().getFullYear().toString()
 const month = new Date().toLocaleString("en-US",{month : "long"})
 const monthpath = path.join(year,month)
 const day = new Date().getDate()
 const datepath = path.join(monthpath,`${day}.txt`)
 const cuurentdate = new Date().toTimeString()

  fs.readFile(datepath , (err,data) => {
    if(err){
      console.log(err.message)
      res.send("server Error")
    }
    else{
      res.send(data)
    }
  })
  
})


app.listen(port, () => {
  console.log("server started");
});
