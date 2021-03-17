# Elastic CMS

### Elastic CMS Components

- **eg-server** - contains the code for backend which all the APIs to access Elastic CMS features.
- **eg-frontend** - contains the code for schema generator and in the future will be porting our Admin UI code into it.
- **elastic-graph-config -** ElasticCMS config which configure backend(eg-server) and admin UI.
- **eg-admin-ui** - contains the code for UI which help administrator monitor, add, search different added entities.
- **elasticgraph -** It is the main component of Elastic CMS which does all relationship management and graph search.

### Setup

Clone all repos related to Elastic CMS. Follow below instruction to do it.

```bash
$ git clone https://github.com/Mindgreppers/eg-server.git
$ git clone https://github.com/Mindgreppers/eg-frontend.git
$ git clone https://github.com/Mindgreppers/elastic-graph-config.git
$ git clone https://github.com/Mindgreppers/elasticgraph.git
$ =
```

Now navigate to `eg-server` and `eg-frontend` folder and run `yarn install` like below.

```bash
$ cd eg-server
$ yarn install
$ cd ..
$ cd eg-frontend
$ yarn install
$ cd ..
$ cd elasticgraph
$ yarn install
$ cd ..
$ cd eg-admin
$ yarn install
```

The next setup is to download [Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/targz.html) and make sure it is running on 9200 port but If you want to change it, please replace it with `port` key value under `clientParams/hosts` in `eg-server/config.js` file.

### Configuration

`eg-admin/setupConfig.sh`
Replace the content with this content

```bash
DEBUG=* node ../elastic-graph-config/schemaMaker.js ../elastic-graph-config ../elasticgraph/lib/configLoader
cp ../elastic-graph-config/backendConfig.json ./
cp ../elastic-graph-config/frontent/config.json configs/
```

`eg-server/package.json`
Change the start script. Replace with following string.

```json
"scripts": {
	"start": "DEBUG=* nodemon ./bin/www ../elastic-graph-config/backend"
},
```

Create a soft link of `elasticgraph` in `node_modules/elasticgraph` .

_Note_: Replace `elasticgraph` folder path with your `elasticgraph` folder path.

```bash
$ cd eg-server/
$ ln -s `path to elastic graph directory`/work/nodejs/elasticgraph node_modules
```

**Create index auth_users in Elasticsearch**
Use postman or another tool to call this url as PUT request

```
PUT localhost:9200/auth_users
```

**Setup SMTP server for sending emails**
**Note:This can be skipped bypass for local setup given below**

- Signup on MailTrap.io and go to MyInbox.
- There select nodejs as dev environment.
- You will see similar code there.

```
mailerConfig: {
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: 'd4d2de03923cb9',
      pass: '0704b923a61098'
    }
  },
```

- Paste that code in eg-server/config.js
- Also change the following two lines in the file to point to the server url.

```
 clientUrl: 'localhost:3000',
 serverUrl: 'localhost:4000'

```

**Bypassing email setup for email confirmation**

- Run eg-frontend projects as described
- Open eg-frontend on browser
- click on the signup to fill and submit form
- you will see a conformation msg that your account is created and confirmation email has to be send to your inbox but you will not get this email because you have not set up the SMTP-server yet.

* Instead of confirming the user through an email link we will confirm it by updating its document by using elastic search.
* In postman or using curl open the url localhost:9200/auth_users/\_doc/search, it will show you the newley created user witha a property account confirmed true or false ,you need to change this property and save it back along with rest of document body by exexcuting a post request on this url localhost:9200/auth_users/\_doc/{user_id}/
* Now you can use the same account to eg-frontend and eg-admin

### Run

**eg-server :—**

```bash
$ cd eg-server
$ yarn start
```

**eg-frontend :—**

```bash
$ cd eg-frontend
$ git checkout schema-generator
$ yarn start
```

**eg-admin :—**

```bash
$ cd eg-admin
$ yarn start

```

**Creating new admin user**

- Open localhost:3000 (Schema generator) in browser and create a new user by signing up.
- Confirm the email by clicking the link you get in your MailTrap inbox.
- This user will be able to access admin-ui through localhost:3030 and also login to schema generator on localhost:3000

**Login to admin UI**

- Open localhost:3030 and enter your email and password to login

**Login to schema generator UI**

- Open localhost:3000 and enter your email and password to login
- Once you see home page after successful login, open localhost:3000/settings

**Step to Create New Entity**

- Go To elastic-graph-config/backend/schema/entities - add entity here.
- Change in elastic-graph-config/backend/schema/relationships.txt if required
- Change in elastic-graph-config/backend/schema/aggregation.toml if required
- Add joins statements in elastic-graph-config/backendjoins/index.txt
- Add joins statements in elastic-graph-config/backendjoins/read.txt
- Add joins statements in elastic-graph-config/backendjoins/search.txt
- Now Go To elastic-graph-config/frontend/schema/entities - add entity here with specified format
- Go To elastic-graph-config/frontend/web/read - add entity here with specified format
- Go To elastic-graph-config/frontend/web/search - add entity here with specified format

\*\*Step to Refresh Schema

- Step - 1

```bash
Open Bash on elasticgraph

Run Command - DEBUD=* node lib/mappingGenerator/esMappingGenerator.js ../elastic-graph-config/backend recreate -- For Re-Creating
node lib/mappingGenerator/reIndexer.js ../elastic-graph-config/backend reindex all -- For Re-Indexer

if to add some newly created Entity then run below command
$ DEBUD=* node lib/mappingGenerator/esMappingGenerator.js ../elastic-graph-config/backend recreate 'List Of Entity'

* Step - 2
Open Bash on eg-admin
Execute file on bash - setupConfig.sh
Then execute - $ yarn start

* Step - 3
Open Bash on eg-server
Execute - $ yarn start

Below Command are used for running Serach operation manually
$ DEBUG=* node lib/deep/search ../elastic-graph-config/backend




```
