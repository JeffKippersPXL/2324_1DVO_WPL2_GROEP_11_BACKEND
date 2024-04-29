//-------------------------

const { createClient } = require('@supabase/supabase-js');
// Create a single supabase client for interacting with your database
const url = "https://vxnjfkepzjrtifmbqmtl.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4bmpma2VwempydGlmbWJxbXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMzE2MzM4NCwiZXhwIjoyMDI4NzM5Mzg0fQ.FjA5xc-msXgGnX8RhDafHjN5W-fgsESzJnWno-5MQpw";
const supabase = createClient(url, key);
//-------------------------
const express = require('express')
const app = express()
//const port = 3000
const port = 10000
const bodyParser = require('body-parser')
const urlendcodedParser = bodyParser.urlencoded({ extended: false })
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
app.post('/api/subscriptions',urlendcodedParser, async (req, res) =>
{
    //res.send({name: 'jeff', email:"test@test.com"});
    //const {error} = await supabase
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
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

//----------------
