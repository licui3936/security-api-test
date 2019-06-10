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
  //fin.desktop.System.showDeveloperTools(uuid, uuid);
  const ofVersion = document.querySelector("#of-version");
  if(ofVersion) {
    fin.desktop.System.getVersion(version => {    
      ofVersion.innerText = version;
    });
  }
}

function hideShowTextBoxes(value) {
  const hidenSpn = document.querySelector("#hidenSpan");
  if(value === 'readRegistryValue') {
    hidenSpn.style.display = "block";
  }
  else {
    hidenSpn.style.display = "none";
  }
}

function executeAPICall(){
  const apiName = getAPIName();
  const apiResponse = document.querySelector("#api-response");
  const permissionChk = document.querySelector("#permission-check");

  if(apiName === 'launchExternalProcess') {
      // update window option
      if(permissionChk) {
        const mainWindow = fin.desktop.Window.getCurrent();
        mainWindow.updateOptions({
          permissions: {
            System: {
              launchExternalProcess: permissionChk.checked
            }
          }
        });
      }
      // call API 
      fin.desktop.System.launchExternalProcess({
        path: "notepad",
        arguments: "",
        listener: function (result) {
            console.log('the exit code', result.exitCode);
        }
    },  (payload) => {    
        apiResponse.innerHTML = "<span style='color: green'>Success: " + payload.uuid + "</span>";
    }, (error) => {
        apiResponse.innerHTML = "<span style='color: red'>Error: " + error + "</span>";
    });
  }
  else if(apiName === 'readRegistryValue') {
      // "HKEY_LOCAL_MACHINE", "HARDWARE\DESCRIPTION\System", "BootArchitecture"
      // "HKEY_CURRENT_USER", "Software\OpenFin", "usagestats"
      const rootKey = document.querySelector("#rootKey").value;
      const subKey = document.querySelector("#subKey").value;
      const valueName = document.querySelector("#valueName").value;
      fin.desktop.System.readRegistryValue(rootKey, subKey, valueName, (response) => {
        console.log(response);
        apiResponse.innerHTML = "<span style='color: green'>Success: value is " + response.data + "</span>";
    }, (error) => {
      apiResponse.innerHTML = "<span style='color: red'>Error: " + error + "</span>";
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

function getAPIName() {
  const apiOption = document.querySelector("#apiSelect").value;
  return apiOption;
}

function createChildWindow() {
  const isInherited = isInheritedPermission();
  const apiName = getAPIName();
  const permissionValue = document.querySelector("#permissionSel").value === 'true' ? true : false;
  let winOption = {
      name:'child' + Math.random(),
      defaultWidth: 600,
      defaultHeight: 600,
      url: 'http://localhost:5566/child.html',
      frame: true,
      autoShow: true
  };
  if(!isInherited) {
    winOption.permissions = {};
    winOption.permissions.System = {};
    winOption.permissions.System[apiName] = permissionValue;
  }
  fin.Window.create(winOption);
}

function createWindow() {
  window.open('http://localhost:5566/child.html');
}

function createIframeWindow() {
  const isInherited = isInheritedPermission();
  const permissionValue = document.querySelector("#permissionSel").value === 'true' ? true : false;  
  let winOption = {
    name:'child' + Math.random(),
    defaultWidth: 600,
    defaultHeight: 600,
    url: 'http://localhost:5566/iframe.html',
    frame: true,
    autoShow: true
  };

  if(!isInherited) {
    winOption.permissions = {
      System: {
          launchExternalProcess: permissionValue
      }
    };
  }  
  fin.Window.create(winOption);
}

function createChildApp() {
  const isInherited = isInheritedPermission();
  const apiName = getAPIName();
  const permissionValue = document.querySelector("#permissionSel").value === 'true' ? true : false;
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
    option.permissions = {};
    option.permissions.System = {};
    option.permissions.System[apiName] = permissionValue;
  }
  fin.Application.start(option);
}

function createAppFromManifest() {
  const useCase = document.querySelector("#manifestSelect").value;
  if(useCase === '0') { // no match url, use default settings,  permission missing in manifest
    fin.Application.startFromManifest('http://localhost:5566/unmatched/appNoMatchPermissionMissing.json').then(app => console.log('App is running')).catch(err => console.log(err));
  }  
  else if(useCase === '1') { // no match url, use default settings,  permission true in manifest
    fin.Application.startFromManifest('http://localhost:5566/unmatched/appNoMatchPermissionTrue.json').then(app => console.log('App is running')).catch(err => console.log(err));
  }
  else if(useCase === '2') { // no match url, use default settings, permission false in manifest
    fin.Application.startFromManifest('http://localhost:5566/unmatched/appNoMatchPermissionFalse.json').then(app => console.log('App is running')).catch(err => console.log(err));
  }
  else if(useCase === '3') { // match url, permissions missing in manifest
    fin.Application.startFromManifest('http://localhost:5566/matched/appMatchPermissionMissing.json').then(app => console.log('App is running')).catch(err => console.log(err));
  }
  else if(useCase === '4') { // match url, permissions true in manifest
    fin.Application.startFromManifest('http://localhost:5566/matched/appMatchPermissionTrue.json').then(app => console.log('App is running')).catch(err => console.log(err));
  } 
  else if(useCase === '5') { // match url, permissions false in manifest
    fin.Application.startFromManifest('http://localhost:5566/matched/appMatchPermissionFalse.json').then(app => console.log('App is running')).catch(err => console.log(err));
  }    
}