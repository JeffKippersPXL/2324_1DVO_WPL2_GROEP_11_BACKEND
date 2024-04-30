const { createClient } = require('@supabase/supabase-js');
// Create a single supabase client for interacting with your database
const url = "https://vxnjfkepzjrtifmbqmtl.supabase.co"; //Link to the "database"
//Token key for acces to the database
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4bmpma2VwempydGlmbWJxbXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMzE2MzM4NCwiZXhwIjoyMDI4NzM5Mzg0fQ.FjA5xc-msXgGnX8RhDafHjN5W-fgsESzJnWno-5MQpw";
//Client to interact with the database
const supabase = createClient(url, key);
//-------------------------
const express = require('express')
const app = express()
//const port = 3000
//Localhost portnumber
const port = 10000
//Used to be able to read body data
const bodyParser = require('body-parser')
const urlendcodedParser = bodyParser.urlencoded({ extended: false })

//Test Data and Test Api
app.get('/', (req, res) => {
    res.send('Hello World!')
})
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
//More test data and examples
app.post('/api/subscriptions',urlendcodedParser, async (req, res) =>
{
    supabase
        .from('subscriptions')
        .insert(
            {name: req.body.name,
            email: req.body.email,
            }
        )
        .then(response =>{
            console.log(response);
            res.status(200).json(response.data);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({message: 'Error reading from Database: '
                    + error.message});
        });
});
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
//Listens to the specefied port number if a api call is made
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

//----------------
