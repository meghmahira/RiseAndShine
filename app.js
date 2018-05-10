const mongodb = require("mongodb");
const goodMorningMailerModule = require("./app/goodMoringMailer");

const dbUrl = "mongodb://localhost:27017";
const dbName = "inFeedo";

mongodb.connect(dbUrl, (error, client) => {
    if (error) throw error;
    console.log("Database successfully connected!");
    const db = client.db(dbName);
    const delay = 15 * 60 * 1000; //executing every 15 minutes

    function sendMailers() {
        console.log("Executing Mailer at " + new Date());
        let goodMorningMailer = new goodMorningMailerModule();
        goodMorningMailer.execute(db).then((response) => {
            console.log("Resolve: ", response);
        }).catch((error) => {
            console.log("Reject: ", error);
        });
        setTimeout(sendMailers, delay);
    }
    sendMailers();
});