# Rise And Shine - a node.js application

Rise And Shine sends mailers and greetings to users around the world on behalf of international companies.
The mailers are customized according to the respective timezones of the users. 

### Prerequisites
Your system must have MongoDB and node

#### MongoDB
If you do not have MongoDB, download and install MongoDB from [https://www.mongodb.com/download-center](https://www.mongodb.com/download-center)
After you are done installing and configuring your MongoDB server (make sure it listens to port 27017), 
- Create a database with the name "RiseAndShine"
- Create two collections "clients" and "users"
- Use the samples given under the /resources directory to populate the collections with data

#### node^8.11.1
If you do not have Node.js, dowmload and install Node.js from [https://nodejs.org/en/](https://nodejs.org/en/)

Run ```npm install``` in project directory to install all the dependencies.

### Resources
Rise And Shine has a database with two collections
- clients: Contains details of international companies that have subscribed to Rise And Shine
- users: Users of the above international companies who are located around the world

#### Notes
- The key "companyId" of an user document corresponds to the respective "clinetId" of the client to which the user belongs
- The key "utcOffset" of an user document hold the offest value for his timezone. Eg: ```"utcOffset" : "UTC-120"```
- Sample data for the above collections are provided under the /resources directory 
- The json data can be directly inserted as documents in your local MongoDB database

### Running the application
To run the application execute the file app.js
```
node app.js
```

The application will perform the following tasks:
1. Calacuate the time UTC offsets for timezones where the current time is 8:00 AM, uisng Moment.js
2. List all the users having the calculated offset in their details from the "users" collection in the MongoDB database
3. Get the corresponding clinet details from the "clients" collection in the MongoDB database
4. Use the above data to send a "Good Morning!" mailer to the users
5. Reapeat the above task every 15 minutes
