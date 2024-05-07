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
const app = express()

//const port = 3000
//Localhost portnumber
const port = 10000

//Used to be able to read body data
const bodyParser = require('body-parser')
const urlendcodedParser = bodyParser.urlencoded({ extended: false })

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

//===================-API"s for Users & Passwords-=======================
//
//API to get a user based on email and password
//Currently returns ranking(true or false) and a ID
app.get('/api/Users', async (req, res)=>{
    let passwordHashed = req.query.password;
    let mail = req.query.email;
    supabase
        .from('Users')
        .select('ranking, id')
        //.select('id')
        .eq('password', passwordHashed)
        .eq('email', mail)
        .then( response => {
                res.status(200).json(response.data)
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
app.post('forgot-password', (req, res)=>{
   const {email} = req.body;
   //checks if the email exist in the database
    supabase
        .from("users")
        .select('email')
        .eq('email', email)
});

//===================-Listening port-=======================
//Shhhh, You'll scare away the ducks
//
//Listens to the specefied port number if a api call is made
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})