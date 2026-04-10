## ARCHITECTURE
- This project was made using hexagonal architecture, separating the domain from Ui.
- I've merged the adapter layer with the infrastructure layer because the infrastructure layer is just 
one fetch to one URL
- If you are running the index.html just by doubli clicking it on the file explorer, you will need to use the bundle.js

## BUNDLE.JS
-  THIS FILE IS MADE WITH NO ARCHITECTURE, JUST TO SHOW IT
  WHEN OPENING THE HTML FILE WITHOUT A SERVER RUNNING
-  TO USE THIS, YOU HAVE TO CAHNGE THE <SCRIPT SRC> IN THE HTML, AND DELETE THE PROP: TYPE="MODULE"
-  IF YOU WANT TO USE THE VERSION WITH HEXAGONAL ARCHITECTURE, THIS FILE IS USELESS, AND YOU'LL HAVE TO RUN A SERVER
-  FOR EXAMPLE, I LIKE TO JUST USE THE EXTENSION "Live Server" IN VS CODE, AND THEN OPEN THE HTML FILE WITH IT.
-  ANOTHER OPTION TO OPEN THE SERVER IS "http-server" A COMMAND LINE IN TERMINAL OFFERED BY NPM
