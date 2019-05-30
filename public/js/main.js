//event listeners.
document.addEventListener("DOMContentLoaded", () => {
  if (typeof fin != "undefined") {
    fin.desktop.main(onMain);
  } else {
    ofVersion.innerText =
      "OpenFin is not available - you are probably running in a browser.";
  }
});

//Once the DOM has loaded and the OpenFin API is ready
function onMain() {
  const app = fin.desktop.Application.getCurrent();
  const win = fin.desktop.Window.getCurrent();

  //const app = fin.Application.getCurrentSync();
  //const win = fin.Window.getCurrentSync();
  const uuid = app.uuid? app.uuid : app.identity.uuid;
  
  //fin.desktop.System.showDeveloperTools(uuid, uuid);
  fin.desktop.System.getVersion(version => {
    const ofVersion = document.querySelector("#of-version");
    ofVersion.innerText = version;
  });
}

function updateAPICall(){
  const apiOption = document.querySelector("#apiSelect").value;
  const apiResponse = document.querySelector("#api-response");
  const permissionChk = document.querySelector("#permission-check");
  if(apiOption === 'launchExternalProcess') {
      // update window option
      const mainWindow = fin.desktop.Window.getCurrent();
      mainWindow.updateOptions({
        permissions: {
          System: {
            launchExternalProcess: permissionChk.checked
          }
        }
      });

      // call API 
      fin.desktop.System.launchExternalProcess({
        path: "notepad",
        arguments: "",
        listener: function (result) {
            console.log('the exit code', result.exitCode);
        }
    },  (payload) => {
        apiResponse.innerText = 'Success:' + payload.uuid;
    }, (error) => {
        apiResponse.innerText = 'Error:' + error;
    });
  }
  else {
    apiResponse.innerText = 'Call the api: ' + apiOption;
  }
}

function isInheritedPermission()
{
    const inheritedRadio = document.getElementsByName("childPermission")[0];
    if(inheritedRadio.checked) {
      return true;
    }
    else {
      return false;
    }
}

function createChildWindow() {
  const isInherited = isInheritedPermission();
  const permissionChk = document.querySelector("#child-permission-check");
  let winOption = {
      name:'child' + Math.random(),
      defaultWidth: 600,
      defaultHeight: 600,
      url: 'http://localhost:5566/child.html',
      frame: true,
      autoShow: true
  };
  if(!isInherited) {
    winOption.permissions = {
      System: {
          launchExternalProcess: permissionChk.checked
      }
    };
  }
  fin.Window.create(winOption);
}

function createChildApp() {
  const isInherited = isInheritedPermission();
  const permissionChk = document.querySelector("#child-permission-check");
  let option = {
      uuid:'child' + Math.random(),
      name:'child',
      defaultWidth: 600,
      defaultHeight: 600,
      url: 'http://localhost:5566/child.html',
      frame: true,
      autoShow: true
  };
  if(!isInherited) {
    option.permissions = {
      System: {
          launchExternalProcess: permissionChk.checked
      }
    };
  }
  fin.Application.start(option);
}

function createChildAppFromManifest() {
  //fin.Application.startFromManifest('http://localhost:5566/childapp.json');
  fin.Application.startFromManifest('http://localhost:5566/childapp.json').then(app => console.log('App is running')).catch(err => console.log(err));
  /* 
  fin.desktop.Application.createFromManifest('http://localhost:5566/childapp.json', function(app) {
    app.run();
  }, function(error) {
    console.error('Failed to create app from manifest: ', error);
  }); */ 
}