const { connect } = require("hadouken-js-adapter");

async function launchApp() {
    // connecto to runtime and start an app specified in manifestUrl
    const fin  = await connect({
        uuid: "external-connection-test",
        nonPersistent: true,
        manifestUrl: "http://localhost:5566/externalConnectionApp.json"
    });

    const version = await fin.System.getVersion();
    console.log("Connected to Hadouken version", version);

    // Permission cannot control the below call from node. This is expected. 
    /*
    await fin.System.launchExternalProcess({
        path: "notepad",
        arguments: "",
        listener: function (result) {
            console.log('the exit code', result.exitCode);
        }
    });*/

    // start an app using options object
    /*
    await fin.Application.start({
        name: "adapter-test-app",
        url: 'http://hadouken.io/',
        uuid: "adapter-test-app",
        autoShow: true,
        nonPersistent : true,
        permissions: {
            System: {
              launchExternalProcess: true
            }
        }        
    });*/
}

launchApp().then(() => {
    console.log("success");
}).catch((err) => {
    console.log("Error trying to connect,", err.message);
    console.log(err.stack);
});  