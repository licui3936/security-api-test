# Security API test application

Test harness is to test APIs security. Currently only below APIs are set permission to FALSE by default. Desktop owner settings uses permissions.json to specify permission for each API. You can change permission in app manifiest file or use options object to set permission option. 
* downloadAsset
* launchExternalProcess
* readRegistryValue
* terminateExternalProcess

In order to test different use cases, you need to manually change permission value in permissions.json or app manifest app.json. 
### How to use this:

* Clone this repository: `git clone https://github.com/licui3936/security-api-test`
* Install the dependencies: `cd security-api-test` & `npm install`

### Create the following key in Registry (as String value):

HKEY_CURRENT_USER\Software\OpenFin\RVM\Settings\DesktopOwnerSettings=http://localhost:5566/permissions.json

### To run the example

* Start the live-server and launch the application: `npm start`

### Test external connection, you can run below two scripts
* `node launchFromAppOptions.js`  (This one requires that a runtime is already running.)
* `node launchFromManifest.js`


### You can manually change the permission in permissions.json and play around it.
* [Expected Results](https://docs.google.com/spreadsheets/d/17Orjr0Sf-Z7Ay-lnY-t_ZB1BjNxyaFpxIIxFRH2qHEk/edit#gid=580648240)
