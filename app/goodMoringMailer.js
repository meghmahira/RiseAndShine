"use strict";

const moment = require("moment-timezone");
const Q = require("q");
const nodemailer = require("nodemailer");
let db = null;

function getTimeZones() {
    const zone = "UTC";
    const westernMostOffset = 12 * 60; // -12:00
    const easternMostOffset = 14 * 60; // +14:00

    moment.tz.setDefault(zone);

    let now = moment();
    let wishTimeWest = moment().set({"hour": 8, "minute": 0, "second": 0, "millisecond": 0});
    let wishTimeEast = moment().set({"hour": 8, "minute": 0, "second": 0, "millisecond": 0});
    let currentUTCHour = now.format("H");
    let currentUTCMinute = now.format("mm");
    now.set({"minute": currentUTCMinute - (currentUTCMinute % 15), "second": 0, "millisecond": 0},);

    let timeOffsets = [];

    if (currentUTCHour == 8) {
        timeOffsets = timeOffsets.concat(["UTC-0", "UTC", "UTC+0"]);
    }
    else if (currentUTCHour < 8) {
        wishTimeWest = moment(wishTimeWest).subtract(1, "day");
    }
    else {
        wishTimeEast = moment(wishTimeEast).add(1, "day");
    }

    console.log("Wish Time West: ", wishTimeWest.format());
    console.log("Wish Time East: ", wishTimeEast.format());

    let westernOffset = now.diff(wishTimeWest, "minutes");
    let easternOffset = wishTimeEast.diff(now, "minutes");

    if (westernOffset && Math.abs(westernOffset) <= westernMostOffset) {
        timeOffsets.push("UTC-" + westernOffset);
    }
    if (easternOffset && Math.abs(easternOffset) <= easternMostOffset) {
        timeOffsets.push("UTC+" + easternOffset);
    }
    return timeOffsets;
}

function listUsers(utcOffsets) {
    let deferred = Q.defer();
    db.collection("users").aggregate([
        {
            "$match": {
                "utcOffset": {
                    "$in": utcOffsets
                }
            }
        },
        {
            "$group": {
                "_id": "$companyId",
                "users": {
                    "$push": {"name": "$name", "email": "$email", "utcOffset": "$utcOffset"}
                }
            }
        }
    ]).toArray((error, userDetails) => {
        if (error) {
            deferred.reject(error);
        }
        if (!(userDetails && userDetails.length)) {
            deferred.reject("No users listed");
        }
        console.log("No of clients listed: ", userDetails.length);
        deferred.resolve(userDetails);
    });
    return deferred.promise;
}

function getClient(userDetail) {
    let deferred = Q.defer();
    db.collection("clients").findOne({"clientId": userDetail._id}, (error, clientDetails) => {
        if (error) {
            return deferred.reject(error);
        }
        if (!(clientDetails && Object.keys(clientDetails).length)) {
            return deferred.reject("Client not retrieved");
        }
        clientDetails["users"] = userDetail.users;
        deferred.resolve(clientDetails);
    });
    return deferred.promise;
}

function getClientDetails(users) {
    let deffered = Q.defer();
    let allPromises = [];
    users.forEach((user) => {
        allPromises.push(getClient(user));
    });
    Q.all(allPromises).then((allClients) => {
        let allUsers = [];
        allClients.forEach((client) => {
            client.users.forEach((user) => {
                user["companyName"] = client.company;
                user["companyOwner"] = client.owner;
                user["companyEmail"] = client.email;
                allUsers.push(user)
            });
        });
        console.log("No of users listed: ", allUsers.length);
        deffered.resolve(allUsers);
    }).catch((error) => {
        deffered.reject(error);
    });
    return deffered.promise;
}

function sendMailersToUser(user) {
    let deferred = Q.defer();
    if (!(user && user.name && user.email)) {
        return deferred.resolve("Insufficient user details");
    }
    const transporter = nodemailer.createTransport({
        "service": "gmail",
        "auth": {
            "user": "riseandshineapplication@gmail.com",
            "pass": "infeedo.com"
        }
    });
    const mailOptions = {
        "from": "Rise And Shine 🌞 <riseandshineapplication@gmail.com>",
        "to": user.name + "<" + user.email + ">",
        "subject": "Good Morning, " + user.name + "!",
        "html": "<p>Hello " + user.name + ",</p>" +
        "<p>" + user.companyOwner + " from " + user.companyName + ", wishes you a great day ahead!</p>" +
        "<p>With Regards, <br>" + user.companyName + "</p>"
    };
    transporter.sendMail(mailOptions, (error, info) => {
        //console.log(error, error)
        if (!(info && info.messageId)) {
            return deferred.resolve("Mail not sent");
        }
        return deferred.resolve("Mail sent successfully");
    });
    return deferred.promise;
}

function sendMailers(users) {
    let deffered = Q.defer();
    let allPromises = [];
    users.forEach((user) => {
        allPromises.push(sendMailersToUser(user));
    });
    Q.all(allPromises).then((allResolves) => {
        deffered.resolve(allResolves);
    }).catch((error) => {
        deffered.reject(error);
    });
    return deffered.promise;
}

class GoodMorningMailerCtrl {

    execute(dbConnection) {
        let deferred = Q.defer();

        if (!dbConnection) {
            deferred.reject("Database connection not received in argument");
        }
        db = dbConnection;

        let utcOffsets = getTimeZones();
        console.log("UTC Offsets: ", utcOffsets);
        if (!(utcOffsets && utcOffsets.length)) {
            deferred.reject("Error while calculating timezone offsets");
        }
        listUsers(utcOffsets)
            .then(getClientDetails)
            .then(sendMailers)
            .then((response) => {
                if (response && response.length) {
                    deferred.resolve("Mails sent to users successfully");
                }
                else {
                    deferred.reject("Error while sending mails to users");
                }
            })
            .catch((error) => {
                deferred.reject(error);
            });
        return deferred.promise;
    }
}

module.exports = GoodMorningMailerCtrl;
