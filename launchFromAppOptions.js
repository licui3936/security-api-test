const { connect } = require("hadouken-js-adapter");

async function launchApp() {
    // connecto to the current running runtime
    // permissions option is currently NOT supported
    const fin  = await connect({
        uuid: "external-connection-test",
        address: 'ws://localhost:9696',
        nonPersistent: true,
        permissions: {
            System: {
              launchExternalProcess: false
            }
        },
        runtime: {
            arguments: "--inspect=9222 --v=1"
        }
    });

    const version = await fin.System.getVersion();
    console.log("Connected to Hadouken version", version);

    // test api in node adapter
    await fin.System.launchExternalProcess({
        path: "notepad",
        arguments: "",
        listener: function (result) {
            console.log('the exit code', result.exitCode);
        }
    }); 

    // Test permission specified in options object. You can change below permission value and see the result.
    await fin.Application.start({
        name: "adapter-test-app",
        url: 'http://localhost:5566/child.html',
        uuid: "adapter-test-app",
        autoShow: true,
        nonPersistent : true,
        permissions: {
            System: {
              launchExternalProcess: true
            }
        }
    });
}

launchApp().then(() => {
    console.log("success");
}).catch((err) => {
    console.log("Error trying to connect,", err.message);
    console.log(err.stack);
});  