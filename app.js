const { createClient } = require('@supabase/supabase-js');
// Create a single supabase client for interacting with your database
const url = "https://vxnjfkepzjrtifmbqmtl.supabase.co"; //Link to the "database"
//Token key for acces to the database
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4bmpma2VwempydGlmbWJxbXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMzE2MzM4NCwiZXhwIjoyMDI4NzM5Mzg0fQ.FjA5xc-msXgGnX8RhDafHjN5W-fgsESzJnWno-5MQpw";
//Client to interact with the database
const supabase = createClient(url, key);
//-------------------------
const { Resend } = require ('resend');
const resend = new Resend('re_D7KwAsKt_Q5hGWsQLgofjYdyY7CWebHNG');

const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const secretKey = 'your-secret-key';//Edit to something more random and secure
const app = express()

//const port = 3000
//Localhost portnumber
const port = 10000

//Used to be able to read body data
const bodyParser = require('body-parser')
const {hash} = require("crypto.js");
const {response} = require("express");
const urlendcodedParser = bodyParser.urlencoded({ extended: false })

//enabeling cross server talk
//CORS ook wel bekend als
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

//Supabase voor server
//Resend voor mails

//Test Data and Test Api
//Geeft alles weer in de database subscribers voor de nieuwsbrief
app.get('/', (req, res) => {
    res.send('Hello World!')
})

//===================-API"s for subscription-=======================
//
//API to get all subscriber no questions asked (aka remove this security flaw once done with testing
app.get('/api/subscriptions', (req, res) => {
    // Logic to fetch all e-mails
    supabase
        .from('subscriptions')
        .select('*')
        .then(response => {
            console.log(response);
            // Assuming you want to send this data back to the client
            res.status(200).json(response.data);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({message: 'Error reading from Database: ' +
                    error.message});
        });
});

//API voor jezelf te kunnen subscriben aan de nieuwsbrief
// Vraagt naam en email, en voegt deze dan toe aan de database
//Still needed to add a confirmation link with a  magic link or token.
app.post('/api/subscriptions',urlendcodedParser, async (req, res) =>
{
    let token = crypto.randomUUID();
    let email = req.query.email;
    supabase
        .from('subscriptions')
        .select('email')
        .eq('email' ,email)
        .then(response => {
            if (response.code(200)){
                return res.status(400).json({message: 'Email already exists'});
            } else {
                supabase
                    .from('subscriptions')
                    .insert(
                        //generate unique token en voeg deze toe voro verificatie.
                        {name: req.query.name,
                            email: email,
                            token: token,
                        }
                    )
                    .then(response =>{
                        console.log(response);

                        //verstuur mail met unique token en link naar api met token
                        resend.emails.send({
                            from: 'onboarding@resend.dev',
                            to: `${email}`,
                            subject: 'Email verification',
                            html: `<p>Click the following link to confirm your account <strong><a href="http://localhost:10000/api/subscriptionsConfirm?token=${token}">Confirm</strong>!</a></p>`
                        });

                        res.status(200).json(response.data);
                    })
                    .catch(error => {
                        console.log(error);
                        res.status(500).json({message: 'Error reading from Database: '
                                + error.message});
                    });
            }
            });
});

app.get('/api/subscriptionsConfirm', (req, res) => {
    const {token} = req.query;
    console.log("test");
    supabase
        .from('subscriptions')
        .update({confirmed: true})
        .eq('token', token)
        .then(response => {
            if (response.status >= 200 && response.status < 300) {
                // If data was updated successfully, redirect to success page
                res.redirect('/success'); //Vervang dit met je eigen website link
            } else {
                // If data wasn't updated (invalid token or email), redirect to error page
                res.redirect('/error'); //Vervang dit met je eigen website link
            }
        })
        .catch(error => {
            res.status(500).json({
                message: 'error reading from database: ' + error.message
            });
        });
});

app.post('api/subscriptionsDelete', (req, res) => {
    const {email} = req.query;
    supabase
        .from('subscriptions')
        .select('token')
        .eq('email', email)
        .then( response => {
                if(response.status >=200 && response.status < 300){
                    const {token} = response.data;
                    resend.emails.send({
                        from: 'onboarding@resend.dev',
                        to: `${email}`,
                        subject: 'Email verification',
                        html: `<p>Click the following link to Delete your Subscription <strong><a href="http://localhost:10000/api/subscriptionsDelete?token=${token}">Confirm</strong>!</a></p>`
                    });
                    }
            })
        .catch(error => {
            res.status(500).json({
                message: 'error reading from database: ' + error.message
            });
        });
});

    //Delete
app.get('api/subscriptionsDelete', (req,res) =>{
    const{token} = req.query;
    supabase
        .from('subscriptions')
        .delete()
        .eq('token', token)
        .then(response =>{
            res.status(200).json({message:'U ben uitgeschreven voor de subscriber mail'});
        })
        .catch(
            res.status(500).json({message:'Er is iets foutgelopen met u uit de lijst te halen, gelieven contact op te nemen met een admin'})
        )
    });

//===================-API"s for Users & Passwords-=======================
//
app.post('/api/create-user', (req, res)=>{
    const {email, name, password, } = req.body;
    const salt = crypto.randomBytes(16).toString('hex');
    let hashedPassword = crypto.pbkdf2Sync(password, salt, 1000,64, 'sha256').toString('hex');
    //checks if the email exist in the database
    supabase
        .from("users")
        .select('email')
        .eq('email', email)
        .then(response =>{
                if(!response.code(200)){
                    supabase
                        .from('users')
                        .insert({'email': email, 'password': hashedPassword, 'salt': salt})
                        .then(
                            response => {
                                token = jwt.sign({token: token}, secret);
                                resend.emails.send({
                                    from: 'onboarding@resend.dev',
                                    to: `${email}`,
                                    subject: 'Email verification',
                                    html: `<p>Click the following link to confirm your account <strong><a href="http://localhost:10000/api/forgot-password?token=${token}">Confirm</strong>!</a></p>`
                                });
                                res.status(200).json(response.data);
                            })
                }
            }
        )
});
//API to get a user based on email and password
//Currently returns ranking(true or false) and a ID
app.get('/api/Users', async (req, res)=>{
    let passwordHashed = req.query.password;
    let mail = req.query.email;
    passwordHashed = crypto.randomUUID(passwordHashed);
    supabase
        .from('Users')
        .select('ranking, id')
        //.select('id')
        .eq('password', passwordHashed)
        .eq('email', mail)
        .then( response => {
            let token = jwt.sign({userId: response.data.id , isAdmin: response.data.ranking}, secretKey, {expiresIn: '1h'});
                res.status(200).json(token)
            }
        )
        .catch( error =>
    {
        res.status(500).json({
            message: 'Error reading from Database: ' +
                error.message});
    });
});
//API to change password if you still have the current one
//Asks for your email and password and then replaces your old password with the new one.
app.put('/api/Users', async (req, res) =>{
    let hashedPassword = req.query.password;
    let email = req.query.email;
    let hashedOldPassword = req.query.oldpassword;
    hashedPassword = crypto.randomUUID(hashedOldPassword);
    hashedOldPassword = crypto.randomUUID(hashedOldPassword);
    supabase
        .from('Users')
        .update({password: hashedPassword})
        .eq('email', email)
        .eq('password', hashedOldPassword)
        .then( response => {
                res.status(200).json({message: "Password is veranderd"})
            }
        )
        .catch( error =>
        {
            res.status(500).json({
                message: 'Error reading from Database: ' +
                    error.message});
        });
});
//API To change your email
//Asks current email and password then replaces email with the new one.
app.put('/api/UsersEmail', async (req, res) =>{
    let hashedPassword = req.query.password;
    let email = req.query.email;
    let oldmail = req.query.oldemail;
    supabase
        .from('Users')
        .update({email: email})
        .eq('email', oldmail)
        .eq('password', hashedPassword)
        .then( response => {
                res.status(200).json({message: "Email is veranderd"})
            }
        )
        .catch( error =>
        {
            res.status(500).json({
                message: 'Error reading from Database: ' +
                    error.message});
        });
});

//Route to inital password reset WIP
app.post('/api/forgot-password', (req, res)=>{
   const {email} = req.body;
   //checks if the email exist in the database
    supabase
        .from("users")
        .select('email')
        .eq('email', email)
        .then(response =>{
            if(response.code(200)){
                supabase
                    .from('users')
                    .select('token')
                    .eq('email', email)
                    .then(
                        response => {
                            resend.emails.send({
                                from: 'onboarding@resend.dev',
                                to: `${email}`,
                                subject: 'Email verification',
                                html: `<p>Click the following link to confirm your account <strong><a href="http://localhost:10000/api/?token=${token}">Confirm</strong>!</a></p>`
                            });

                            res.status(200).json(response.data);
                        }
                    )
            } else{
                res.status(500).json("Error, email niet gevonden in de database");
            }
            }
        )
});

app.get('/api/password-reset', async (req, res) =>{
    let {token, password} = req.query;
    //Use JWT for teh transfering of the token
    supabase
        .from('users')
        .update()
})

//===================-API"s for Events and the Kalender-=======================
//
//
app.post('/api/create-event', (req, res)=> {
    const {name, description, starttime, date, endtime} = req.body;
    supabase
        .from('users')
        .select('name')
        .eq('ranking', true)
        .then(response => {
            if (response.code(200)) {
                supabase
                    .from("events")
                    .insert(
                        //generate unique token en voeg deze toe voro verificatie.
                        {name: name,
                            description: description,
                            startTime: starttime,
                            date: date,
                            endtime: endtime
                        }
                    )
                response.status(200).json({message: "Created event"});
            } else {
                response.status(500).json({message: "failed to create event"})
            }
        })
        .catch(error => {
            res.status(500).json({message: 'Error creating event'})
        });

});

app.put('/api/edit-event', async (req, res) =>{
    let name = req.query.name;
    let description = req.query.description;
    let starttime = req.query.startTime;
    let date = req.query.date;
    let endtime = req.query.endtime;
    supabase
        .from('events')
        .update({name: name, description: description, startTime: starttime, date: date, endtime: endtime})
        .eq('name', name)
        .eq('password', hashedPassword)
        .then( response => {
                res.status(200).json({message: "Email is veranderd"})
            }
        )
        .catch( error =>
        {
            res.status(500).json({
                message: 'Error reading from Database: ' +
                    error.message});
        });
});

app.get('/api/events', (req, res) => {
    // Logic to fetch all e-mails
    let dateNow = new Date().toISOString();
    supabase
        .from('events')
        .select('*')
        .rangeGte('endTime', dateNow)
        .then(response => {
            console.log(response);
            // Assuming you want to send this data back to the client
            res.status(200).json(response.data);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({message: 'Error reading from Database: ' +
                    error.message});
        });
});

//===================-Listening port-=======================
//Shhhh, You'll scare away the ducks
//
//Listens to the specefied port number if a api call is made
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})