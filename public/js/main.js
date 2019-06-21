//event listeners.
document.addEventListener("DOMContentLoaded", () => {
  onMain();
});

const childUrl = 'http://localhost:5566/child.html';
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
  const apiName = getUrlParam(window, "apiName");

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
// key: DOS_manifest_windowOptions
const expectedPermissionMap = new Map(Object.entries({
  none_none: 'NACK',
  none_true: 'ACK',
  none_false: 'NACK',
  true_none: 'NACK',
  true_true: 'ACK',
  true_false: 'NACK',
  false_none: 'NACK',
  false_true: 'NACK',
  false_false: 'NACK',  
  none_none_none: 'NACK',
  none_none_true: 'NACK',
  none_none_false: 'NACK',
  none_true_none: 'NACK',
  none_true_true: 'ACK',
  none_true_false: 'NACK',
  none_false_none: 'NACK',
  none_false_true: 'NACK',
  none_false_false: 'NACK',
  true_none_none: 'NACK',
  true_none_true: 'NACK',
  true_none_false: 'NACK',
  true_true_none: 'NACK',
  true_true_true: 'ACK',
  true_true_false: 'NACK',
  true_false_none: 'NACK',
  true_false_true: 'NACK',
  true_false_false: 'NACK',
  false_none_none: 'NACK',
  false_none_true: 'NACK',
  false_none_false: 'NACK',
  false_true_none: 'NACK',
  false_true_true: 'NACK',
  false_true_false: 'NACK',
  false_false_none: 'NACK',
  false_false_true: 'NACK',
  false_false_false: 'NACK'
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
        //console.log(applicationSetting);
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
    if(DOSAPIPermissionObj && Object.keys(DOSAPIPermissionObj).length === 0) {// no match, no default
      return '';
    }
    DOSAPIPermission = typeof DOSAPIPermissionObj.System[apiName] === 'object' ? DOSAPIPermissionObj.System[apiName]['enabled'] : DOSAPIPermissionObj.System[apiName];
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
  // If it's raw window, always nack 
  const isRawWindow = getUrlParam(window, "isRawWindow");
  if(isRawWindow) {
    expected = 'NACK';
  }
  else {
    //If applicationSettings object is empty, always nack
    const DOSPermissions = permissionMap['DOS'];
    if(typeof DOSPermissions === 'object' && Object.keys(DOSPermissions).length === 0) {
      expected = 'NACK';
    }
    else {
      let permissionKey = getDOSAndManifestPermission();
      if(permissionKey === '') { // url no match and no default
        expected = 'NACK';        
      }
      else { // handle cases: no desktopOwnerSettings, no applicationSettings, url matched, url no match and has default,
        const isIframe = getUrlParam(window, "isIframe");
        if(!isIframe && window.location.href.indexOf('child') > -1) { // child window
          let permissionValue = getUrlParam(window, "permission");
          if(permissionValue) { // child window
            permissionKey += '_' + permissionValue;
          }
          else { // iframe in child window
            if(parent.location.href.indexOf('iframe') > 0) {
              permissionValue = getUrlParam(parent, "permission");
              permissionKey += '_' + permissionValue;
            }
          }
        }
        expected = expectedPermissionMap.get(permissionKey);
        console.log('key: ' + permissionKey + ' expected:' + expected);
      }
    }
  }
  return expected;
}

function executeAPICall(){
  const apiName = getAPIName();
  const apiResponse = document.querySelector("#api-response");
  let expectedHtml = "";
  if(showExpectedResult) {
    let expected = getExpectedResult();
    expectedHtml = showExpectedResult? ("<br><span style='font-weight: bold; color: #F7882F'>Expected: " + expected + "</span>") : expectedHtml;
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
      }).then(payload => apiResponse.innerHTML = "<span style='color: #0b6623'>Success: " + payload.uuid + "</span>" + expectedHtml)
      .catch(error => apiResponse.innerHTML = "<span style='color: red'>Error: " + error + "</span>" + expectedHtml);
  }
  else if(apiName === 'readRegistryValue') {
      // "HKEY_LOCAL_MACHINE", "HARDWARE\DESCRIPTION\System", "BootArchitecture"
      // "HKEY_CURRENT_USER", "Software\OpenFin", "usagestats"
      const rootKey = document.querySelector("#rootKey").value;
      const subKey = document.querySelector("#subKey").value;
      const valueName = document.querySelector("#valueName").value;
      fin.System.readRegistryValue(rootKey, subKey, valueName).then(response=> {
        console.log(response);
        apiResponse.innerHTML = "<span style='color: #0b6623'>Success: data is " + response.data + "</span>" + expectedHtml;    
      }).catch(error => apiResponse.innerHTML = "<span style='color: red'>Error: " + error + "</span>" + expectedHtml);
  }
  else {
    apiResponse.innerText = '' + apiName + ' is currently not testable. ';
  }
}

function hasDefaultPermissions() {
  const apiPermissions = permissionMap['DOS'];
  return 'default' in apiPermissions;
}

function searchPermissionByConfigUrl(url) {
  const apiPermissions = permissionMap['DOS'];
  let defaultPermissions;
  let isFound = false;
  if (apiPermissions) {
      for (const permissionName of Object.keys(apiPermissions)) {
          const permissionObj = apiPermissions[permissionName];
          if(permissionName.toLowerCase() === 'default') {
            defaultPermissions = permissionObj['permissions'];
          }
          if (Array.isArray(permissionObj.urls) && permissionObj.urls.indexOf(url) > -1) { // need to do more
              isFound = true;
              return permissionObj['permissions'];
          } /*else if (electronApp.matchesURL(url,  [policyName])) {
              return policy;
          }*/
      }
      if(!isFound) {
        if(defaultPermissions) {
          return defaultPermissions;
        }
        else { // no match, no default
          return {};
        }
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

function createOptions(url, isChildApp) {
  const isInherited = isInheritedPermission();
  const apiName = getAPIName();
  const permissionValue = document.querySelector("#permissionSel").value === 'true' ? true : false;
  let winOption = {
      defaultWidth: 600,
      defaultHeight: 600,
      url: url +'?apiName=' + apiName,
      frame: true,
      autoShow: true,
      alwaysOnTop: true
  };
  if(isChildApp) {
    winOption.uuid = 'child' + Math.random();
    winOption.name = 'child';
  }
  else {
    winOption.name = 'child' + Math.random();
  }
  if(!isInherited) {
    winOption.url += '&permission=' + permissionValue;
    winOption.permissions = {};
    winOption.permissions.System = {};
    winOption.permissions.System[apiName] = permissionValue;
  }
  else {
    winOption.url += '&permission=none';
  }
  return winOption;
}

function createChildApp() {
  const option = createOptions(childUrl, true);
  fin.Application.start(option);
}

function _createChildWindow(url) {
  const winOption = createOptions(url, false);
  fin.Window.create(winOption);
}

function createChildWindow() {
  _createChildWindow(childUrl);
}

function createRawWindow() {
  const apiName = getAPIName();
  window.open(childUrl + '?isRawWindow=true&apiName=' + apiName);
}

function createIframeWindow() {
  _createChildWindow('http://localhost:5566/iframe.html');
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

function getUrlParam(win, param) {
  const pageUrl = win.location.search.substring(1);
  const urlVariables = pageUrl.split('&');
  for (let i = 0; i< urlVariables.length; i++) {
    const paramNameValue = urlVariables[i].split('=');
    if(paramNameValue[0] === param) {
      return paramNameValue[1];
    }
  }
}

function updateHref(aLink) {
  aLink.href = childUrl + "?isRawWindow&apiName=" + getAPIName();
}

function updateIframeSrc(apiName) {
  const iframeTest = document.querySelector("#iframe_test");
  if(iframeTest) {
    iframeTest.setAttribute('src', childUrl + "?apiName=" + apiName);
  }
}
 