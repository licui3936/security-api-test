# Security API test application

Test harness is to test security policies for OpenFin APIs are defined in permissions.json.

### How to use this:

* Clone this repository: `git clone https://github.com/licui3936/security-api-test`
* Install the dependencies: `cd security-api-test` & `npm install`

### Create the following key in Registry (as String value):

HKEY_CURRENT_USER\Software\OpenFin\RVM\Settings\DesktopOwnerSettings=http://localhost:5566/permissions.json

### To run the example

1. host the repo at localhost:5566
2. run
    OpenFinRVM.exe --config=http://localhost:5566/app.json

### Test external connection, you can run below two scripts
node launchFromAppOptions.js  (This one requires that a runtime is already running.)
node launchFromManifest.js


### You can manually change the permission in permissions.json and play around it.
* Expected Results: `https://docs.google.com/spreadsheets/d/17Orjr0Sf-Z7Ay-lnY-t_ZB1BjNxyaFpxIIxFRH2qHEk/edit#gid=580648240`
