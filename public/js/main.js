//event listeners.
document.addEventListener("DOMContentLoaded", () => {
  onMain();
});

const childUrl = 'http://localhost:5566/child.html';
const CONFIG_URL_WILDCARD = 'default';
let permissionMap;
let isApplicationSettingsExist = false;
const showExpectedResult = true;

//Once the DOM has loaded and the OpenFin API is ready
function onMain() {
  const ofVersion = document.querySelector("#of-version");
  if(ofVersion) {
    fin.System.getVersion().then(version => {    
      ofVersion.innerText = version;
    });
  }

  //get permission
  if(showExpectedResult && !permissionMap) {
    getPermissionMap();
    console.log(permissionMap);
  }

  // set selected item
  const apiSelect = document.querySelector("#apiSelect");
  const apiName = getUrlParam("apiName");

  // update iframe src
  updateIframeSrc(apiName);     
  if(apiSelect && apiName) {
    apiSelect.value = apiName;
    // Selection is not allowed in chile window
    if(window.location.href.indexOf('child') > -1) {
      apiSelect.disabled = true;
    }

    hideShowTextBoxes(apiName);
  }
}

// expected permission map
// key: DOS_manifest_options
const expectedPermissionMap = new Map(Object.entries({
  true: 'nack',
  true_true: 'ack',
  true_false: 'nack',
  false: 'nack',
  false_true: 'nack',
  false_false: 'nack',
  none_none: 'nack',
  none_true: 'ack',
  none_false: 'nack',
  none_none_none: 'nack',
  none_none_true: 'nack',
  none_none_false: 'nack',
  none_true_none: 'nack',
  none_true_true: 'ack',
  none_true_false: 'nack',
  none_false_none: 'nack',
  none_false_true: 'nack',
  none_false_false: 'nack'
}));

function getPermissionMap() {
  permissionMap = {};
  fin.desktop.System.getLog('debug.log', content => {
    // check if applicationSettings exists
    const appSettingMessage = '"applicationSettingsExists":true';
    isApplicationSettingsExist = content.indexOf(appSettingMessage) > -1? true : false;

    // find permission in desktop owner settings
    if(isApplicationSettingsExist) {
      const DOSMessage = '"desktopOwnerFileExists":true';
      const DOSIndex = content.indexOf(DOSMessage);
      if(DOSIndex > -1) {
        const startIndex = DOSIndex + DOSMessage.length + 11;
        const endTopicIndex = content.indexOf(',"success":true');
        const applicationSettingStr = content.substring(startIndex, endTopicIndex);
        //console.log(applicationSettingStr) ;
        const applicationSetting = JSON.parse(applicationSettingStr);
        //const DOSPermissions = applicationSetting['MyPolicies']['permissions'];
        //console.log(DOSPermissions);
        permissionMap['DOS'] = applicationSetting;
      }
    }
    // find permission in manifest file app.json
    const manifestMessage = '"startup_app": ';
    const index = content.indexOf(manifestMessage);
    if(index > -1) {
      const startIndex = index + manifestMessage.length;
      const endTopicIndex = content.indexOf('"runtime": {');
      const startupStr = content.substring(startIndex, endTopicIndex - 6);
      //console.log(startupStr) ;
      const startup = JSON.parse(startupStr);
      const manifestPermissions = startup['permissions'];
      //console.log(manifestPermissions);
      permissionMap['manifest'] = manifestPermissions;
    }    
  });
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

function getDOSAndManifestPermission() {
  const apiName = getAPIName();
  let DOSAPIPermission;
  if(!isApplicationSettingsExist) {
    DOSAPIPermission = 'none';
  }
  else {
    const DOSAPIPermissionObj = searchPermissionByConfigUrl('http://localhost:5566/app.json');
    DOSAPIPermission = typeof permissionMap['DOS'].System[apiName] === 'object' ? permissionMap['DOS'].System[apiName]['enabled'] : permissionMap['DOS'].System[apiName];
  }

  // get permissiom in manifest file
  let manifestPermission;
  const permissiomObj = permissionMap['manifest'];
  if(!permissiomObj) {
    manifestPermission = 'none';
  }
  else {
    manifestPermission = typeof permissiomObj.System[apiName] === 'object' ? permissiomObj.System[apiName]['enabled'] : permissiomObj.System[apiName];
  }
  return DOSAPIPermission + '_' + manifestPermission;
}

function getExpectedResult() {
  let expected;
  //check if applicationSettings is empty
  const DOSPermissions = permissionMap['DOS'];
  if( typeof DOSPermissions === 'object' && Object.keys(DOSPermissions).length === 0) {
    expected = 'nack';
  }
  else {
    let permissionKey = getDOSAndManifestPermission();
    if(window.location.href.indexOf('child') > -1) {
      const permissionValue = getUrlParam("permission");
      if(!permissionValue) {
        permissionKey += '_none';
      }
      else {
        permissionKey += '_' + permissionValue;
      }
    }
    expected = expectedPermissionMap.get(permissionKey);
    console.log('key: ' + permissionKey + ' expected:' + expected);
  }
  return expected;
}

function executeAPICall(){
  const apiName = getAPIName();
  const apiResponse = document.querySelector("#api-response");
  let expectedHtml = "";
  if(showExpectedResult) {
    let expected = getExpectedResult();
    expectedHtml = showExpectedResult? ("<span style='color: purple'>Expected: " + expected + "</span><br>") : expectedHtml;
  }

  // update window option,permission is not working with updateOptions
  /*
  const permissionChk = document.querySelector("#permission-check");
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
  */
  if(apiName === 'launchExternalProcess') {
      // call API 
      fin.System.launchExternalProcess({
        path: "notepad",
        arguments: "",
        listener: function (result) {
          console.log('the exit code', result.exitCode);
        }        
      }).then(payload => apiResponse.innerHTML = expectedHtml + "<span style='color: green'>Success: " + payload.uuid + "</span>")
      .catch(error => apiResponse.innerHTML = expectedHtml + "<span style='color: red'>Error: " + error + "</span>");
  }
  else if(apiName === 'readRegistryValue') {
      // "HKEY_LOCAL_MACHINE", "HARDWARE\DESCRIPTION\System", "BootArchitecture"
      // "HKEY_CURRENT_USER", "Software\OpenFin", "usagestats"
      const rootKey = document.querySelector("#rootKey").value;
      const subKey = document.querySelector("#subKey").value;
      const valueName = document.querySelector("#valueName").value;
      fin.System.readRegistryValue(rootKey, subKey, valueName).then(response=> {
        console.log(response);
        apiResponse.innerHTML =  expectedHtml + "<span style='color: green'>Success: data is " + response.data + "</span>";    
      }).catch(error => apiResponse.innerHTML = expectedHtml + "<span style='color: red'>Error: " + error + "</span>");
  }
  else {
    apiResponse.innerText = '' + apiName + ' is currently not testable. ';
  }
}

function searchPermissionByConfigUrl(url) {
  const apiPermissions = permissionMap['DOS'];
  if (apiPermissions) {
      for (const permissionName of Object.keys(apiPermissions)) {
          const permission = apiPermissions[permissionName];
          if (url === CONFIG_URL_WILDCARD && url === permissionName) {
              return permission;
          } else if (Array.isArray(permission.urls) && permission.urls.indexOf(url) > -1) { // need to do more
              return permission;
          } /*else if (electronApp.matchesURL(url,  [policyName])) {
              return policy;
          }*/
      }
  } else {
      console.log('missing API permissions');
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

function _createChildWindow(url) {
  const isInherited = isInheritedPermission();
  const apiName = getAPIName();
  const permissionValue = document.querySelector("#permissionSel").value === 'true' ? true : false;
  let winOption = {
      name:'child' + Math.random(),
      defaultWidth: 600,
      defaultHeight: 600,
      url: url +'?apiName=' + apiName,
      frame: true,
      autoShow: true
  };
  if(!isInherited) {
    winOption.url += '&permission=' + permissionValue;
    winOption.permissions = {};
    winOption.permissions.System = {};
    winOption.permissions.System[apiName] = permissionValue;
  }
  fin.Window.create(winOption);
}

function createChildWindow() {
  _createChildWindow(childUrl);
}

function createWindow() {
  const apiName = getAPIName();
  window.open(childUrl + '?apiName=' + apiName);
}

function createIframeWindow() {
  _createChildWindow('http://localhost:5566/iframe.html');
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
      url: childUrl + '?apiName=' + apiName,
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

function getUrlParam(param) {
  const pageUrl = window.location.search.substring(1);
  const urlVariables = pageUrl.split('&');
  for (let i = 0; i< urlVariables.length; i++) {
    const paramNameValue = urlVariables[i].split('=');
    if(paramNameValue[0] === param) {
      return paramNameValue[1];
    }
  }
}

function updateHref(aLink) {
  aLink.href = childUrl + "?apiName=" + getAPIName();
}

function updateIframeSrc(apiName) {
  const iframeTest = document.querySelector("#iframe_test");
  if(iframeTest) {
    iframeTest.setAttribute('src', childUrl + "?apiName=" + apiName);
  }
}
 