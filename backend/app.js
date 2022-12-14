const PORT = 3000; // Port

// Modules express installed for Node.js (use express, express-myconnction, body-parser and to manipulate Mysql Database      
const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser'); // it's a middleware module to extracts the entire body of an incoming request stream and exposes it to req.body (after 4th version of express)
const mysql = require('mysql');
const myconnection = require('express-myconnection');
const crypto = require("crypto");
const https = require("https");
const app = express();  // const app assigned to express function wich is instantiated => see end of code about the listenning method of the app variable with a callback  

const fs = require("fs");
const credentialsPath = `/etc/piximedia/.credentials.json`;
const sslCertificatesPath = `/etc/piximedia/ssl/`;

if(	!fs.existsSync(credentialsPath) ||
	!fs.existsSync(`${sslCertificatesPath}key.pem`) ||
	!fs.existsSync(`${sslCertificatesPath}cert.pem`)) {
	return console.log("No credentials or SSL certificates found");
}

const sqlCredentials = JSON.parse(fs.readFileSync(credentialsPath)).mysql; 

const SSLOptions = {
	key: fs.readFileSync(`${sslCertificatesPath}key.pem`),
	cert: fs.readFileSync(`${sslCertificatesPath}cert.pem`)
}

const server = https.createServer(SSLOptions, app).listen(PORT, () => {
	console.log(`Express listening on port ${PORT}`);
});

//Object with configurations of connection to the bdd
const config = {
    host: 'localhost',
    user : 'root',
    password: sqlCredentials.password,
    port: 3306, // default port of mysql
    database: 'audience_builder'
};

app.use(myconnection(mysql, config, 'pool')); // middleware with app.use variable => connecting betweenn app and bdd mysql (3 params)
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());

//MySQL

// middleware => access to all area of form, from client part (parm = object with 1 attribute with value = true)
// GET method to select rows from a table in the database
app.get("/analysis/:id", (request, response, next) => {
    const id = request.params.id;
    request.getConnection((err, conn) => {
        if (err) { 
            response.status(500); // status() = method in Express (after 4th version)
            response.send(JSON.stringify({"error": err})); // JSON.stringify is a method to transform object into a string
            return; // Stop processing if errors are encountered in connexion
        }

        // Once the connexion is establised => used of con. variable to execute a query against the database
        conn.query("SELECT * FROM audience_analysis WHERE id=?", [id], (err, results) => {
            if (err) {
                response.status(500);
                response.send(JSON.stringify({"error": err}));
            	return;
            }

            if (!results.length) {
                response.send(JSON.stringify({error:"No results"}));
                return;
            } 
                
            response.send(JSON.stringify(results));
        });
    });
});

// POST method to insert a new row in a table of the database 
app.post("/analysis", (request, response, next) => {

	const { url, automatic_keywords, manual_keywords, analysis_results } = request.body;
	const id = crypto.createHash('md5').update(Math.random().toString()).digest("hex").slice(0, 5);
    
    request.getConnection((err, conn) => {
        if (err) { 
            response.status(500);
            response.send(JSON.stringify({"error": err}));
            return;
        }
        
        conn.query(`INSERT INTO 
        			audience_analysis (id, url, automatic_keywords, manual_keywords, analysis_results) 
        			VALUES(?, ?, ?, ?, ?) `, 
        	[id, url, automatic_keywords, manual_keywords, analysis_results],(err, results) => {
            if (err) {
                response.status(500);
                response.send(JSON.stringify({"error": err}));
            	return;    
            }
                
            response.send(JSON.stringify({"ok": true, "id": id}));
        });
    });
});
