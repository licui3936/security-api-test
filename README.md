# Security API test application

Test harness to test security policies for OpenFin APIs are defined in permissions.json.

#### [Visual Studio code](https://code.visualstudio.com/) integration, thanks to @jcarter

* Attach to debugger for in-editor break points, call stacks, and an interactive console
* Hadouken configuration ( `app.json` ) smart completion based on available parameters
* Hadouken API smart completions based on variable types and function definitions

### How to use this:

* Clone this repository: `git clone https://github.com/licui3936/security-api-test`
* Install the dependencies: `cd security-api-test` & `npm install`

### Create the following key in Registry (as String value):

HKEY_CURRENT_USER\Software\OpenFin\RVM\Settings\DesktopOwnerSettings=http://localhost:5566/permissions.json

### To run the example

1. host the repo at localhost:5566
2. run
    OpenFinRVM.exe --config=http://localhost:5566/app.json
