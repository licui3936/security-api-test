//event listeners.
document.addEventListener("DOMContentLoaded", () => {
  onMain();
});

// global
var permissionMap;

const childUrl = 'http://localhost:5566/child.html';
const showExpectedResult = true;

//Once the DOM has loaded and the OpenFin API is ready
async function onMain() {
  const ofVersion = document.querySelector("#of-version");
  if(ofVersion) {
    fin.System.getVersion().then(version => {
      ofVersion.innerText = version;
    });
  }

  //get permission
  if(showExpectedResult) {
    if(window.location.href.indexOf('subApp=true') === -1) {
      await getPermissionMap();
    }
  }

  // set selected item
  const apiSelect = document.querySelector("#apiSelect");
  const apiName = getUrlParam(window, "apiName");

  // update iframe src
  updateIframeSrc(apiName);     
  if(apiSelect && apiName) {
    apiSelect.value = apiName;
    // Selection is not allowed in child window
    if(window.location.href.indexOf('child') > -1) {
      apiSelect.disabled = true;
    }

    hideShowTextBoxes(apiName);
  }
}

// expected permission map
// key format: DOS_manifest_windowOptions
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

async function getAppInfo() {
  const app = await fin.Application.getCurrent();
  return await app.getInfo();
}

async function getPermissionMap() {
  if(permissionMap) return;

  // iframe, raw window
  let localPermissionMap = parent.permissionMap || (window.opener && window.opener.permissionMap);
  if(localPermissionMap) {
    permissionMap = localPermissionMap;
    console.log('get from parent');
    return;
  }
  console.log('read from debug.log');  
  permissionMap = {};
  const content = await fin.System.getLog({name: 'debug.log'});
    // check if applicationSettings exists
    const isApplicationSettingsExist = /"applicationSettingsExists":true/.test(content);
    console.log('applicationSettings exists: ' + isApplicationSettingsExist);
    permissionMap['isApplicationSettingsExist'] = isApplicationSettingsExist;

    // find permission in desktop owner settings
    if(isApplicationSettingsExist) {
      const DOSMessage = '"desktopOwnerFileExists":true,"payload":';
      const DOSIndex = content.indexOf(DOSMessage);
      if(DOSIndex > -1) {
        const startIndex = DOSIndex + DOSMessage.length;
        const endTopicIndex = content.indexOf(',"success":true');
        const applicationSettingStr = content.substring(startIndex, endTopicIndex);
        const applicationSetting = JSON.parse(applicationSettingStr);
        permissionMap['DOS'] = applicationSetting;
      }
    }

    // find permission in manifest file app.json
    const appInfo = await getAppInfo()
    const manifestPermissions = appInfo.manifest.startup_app.permissions;
    permissionMap['manifest'] = manifestPermissions;
}

function getPermissionValue(permissiomObj) {
  const apiName = getAPIName();
  let value;
  if(typeof permissiomObj.System[apiName] === 'object') { // readRegistryValue
    const rootKey = document.querySelector("#rootKey").value;
    const subKey = document.querySelector("#subKey").value;
    const key = rootKey + '\\' + subKey;
    const registryKeys = permissiomObj.System[apiName]['registryKeys'];
    if(permissiomObj.System[apiName]['enabled'] && registryKeys.indexOf(key) >= 0){
      return true;
    }
    else{
      return false;
    }
  }
  else {
    value = permissiomObj.System[apiName]
  }
  return value;
}

async function getSubAppManifestPermission(manifestUrl) {
  // read permission option from app info
  const appInfo = await getAppInfo();
  const permissiomObj = appInfo.manifest.startup_app.permissions;
  return !permissiomObj? 'none' : getPermissionValue(permissiomObj);
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

// get permissiom in manifest file
async function getManifestPermission(isSubApp, manifestUrl) {
  let manifestPermission;
  if(isSubApp === 'true') {
    manifestPermission = await getSubAppManifestPermission(manifestUrl);
  }
  else {
    const permissiomObj = permissionMap['manifest'];
    if(!permissiomObj) {
      manifestPermission = 'none';
    }
    else {
      manifestPermission = getPermissionValue(permissiomObj);
    }
  }
  return manifestPermission;
}

async function getDOSAndManifestPermission() {
  const isSubApp = getUrlParam(window, "subApp");
  let DOSAPIPermission;
  let permission;
  const appInfo = await getAppInfo();
  const manifestUrl = appInfo.manifestUrl;
  console.log('manifest url: ' + manifestUrl);  
  if(!permissionMap['isApplicationSettingsExist']) {
    DOSAPIPermission = 'none';
    permission = await getManifestPermission(isSubApp, manifestUrl);
    return DOSAPIPermission + '_' + permission;
  }
  else {
    const DOSAPIPermissionObj = searchPermissionByConfigUrl(appInfo.manifestUrl);
    if(DOSAPIPermissionObj && Object.keys(DOSAPIPermissionObj).length === 0) {// no match, no default
      return '';
    }
    DOSAPIPermission = getPermissionValue(DOSAPIPermissionObj);
    permission = await getManifestPermission(isSubApp, manifestUrl);
    return DOSAPIPermission + '_' + permission;
  }
}

async function getExpectedResult() {
  let expected;
  // If it's raw window, always nack 
  const isRawWindow = getUrlParam(window, "isRawWindow");
  if(isRawWindow) {
    expected = 'NACK';
  }
  else {
    // check if permisonMap is ready. If it's not, read info from debug.log. It could happen in the app opening with manifest url
    if(!permissionMap) {
      console.log('---read debug log---');
      await getPermissionMap();
    }
    
    //If applicationSettings object is empty, always nack
    const DOSPermissions = permissionMap['DOS'];
    if(typeof DOSPermissions === 'object' && Object.keys(DOSPermissions).length === 0) {
      expected = 'NACK';
    }
    else {
      let permissionKey = await getDOSAndManifestPermission();
      if(permissionKey === '') { // url no match and no default
        expected = 'NACK';        
      }
      else { // handle cases: no desktopOwnerSettings, no applicationSettings, url matched, url no match and has default,
        const isIframe = getUrlParam(window, 'isIframe') || getUrlParam(parent, 'isIframe');
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

function getResponseHtml(responseText, isError) {
  const colorPart = isError? "red'>Error: " : "#0b6623'>Success: ";
  return "<span style='color:" + colorPart + responseText + "</span>";
}

async function executeAPICall(){
  const apiName = getAPIName();
  const apiResponse = document.querySelector("#api-response");
  let expectedHtml = "";
  if(showExpectedResult) {
    let expected = await getExpectedResult();
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
      }).then(payload => apiResponse.innerHTML = getResponseHtml(payload.uuid, false) + expectedHtml)
      .catch(error => apiResponse.innerHTML = getResponseHtml(error, true) + expectedHtml);
  }
  else if(apiName === 'readRegistryValue') {
      // "HKEY_LOCAL_MACHINE", "HARDWARE\DESCRIPTION\System", "BootArchitecture"
      // "HKEY_CURRENT_USER", "Software\OpenFin", "usagestats"
      const rootKey = document.querySelector("#rootKey").value;
      const subKey = document.querySelector("#subKey").value;
      const valueName = document.querySelector("#valueName").value;
      fin.System.readRegistryValue(rootKey, subKey, valueName).then(response=> {
        console.log(response);
        apiResponse.innerHTML = getResponseHtml("data is " + response.data, false) + expectedHtml;    
      }).catch(error => apiResponse.innerHTML = getResponseHtml(error, true) + expectedHtml);
  }
  else {
    apiResponse.innerText = '' + apiName + ' is currently not testable. ';
  }
}

let urlMatchPatten = '^http(s)?://localhost(:([0-9]){2,4})?/matched/.*$';
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
          if(permissionName === url) {
            isFound = true;
            return permissionObj['permissions'];
          }
          else if (Array.isArray(permissionObj.urls)) { // alias
            const urls = permissionObj.urls;
            for(let i=0; i < urls.length; i++) {
              if(urls[i] === url || url.match(urlMatchPatten) !== null) {
                isFound = true;
                console.log('found: ' + url);
                return permissionObj['permissions'];                
              }
            }
          }
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

function getAPIName() {
  const apiOption = document.querySelector("#apiSelect").value;
  return apiOption;
}

function createOptions(url, permissionValue, isChildApp) {
  const apiName = getAPIName();
  let options = {
      defaultWidth: 600,
      defaultHeight: 600,
      url: url +'?apiName=' + apiName,
      frame: true,
      autoShow: true,
      alwaysOnTop: true
  };
  if(isChildApp) {
    options.uuid = 'child' + Math.random();
    options.name = 'child';
  }
  else {
    options.name = 'child' + Math.random();
  }

  options.url += '&permission=' + permissionValue;
  if(permissionValue !== 'none') {
    options.permissions = {};
    options.permissions.System = {};
    options.permissions.System[apiName] = (permissionValue === 'true');
  }

  return options;
}

function createChildApp(selectEleName) {
  const permissonValue = document.querySelector(selectEleName).value;
  const option = createOptions(childUrl, permissonValue, true);
  fin.Application.start(option);
}

function createChildWindow(selectEleNameOrValue) {
  const permissionSel = document.querySelector(selectEleNameOrValue);
  const permissonValue =permissionSel? permissionSel.value : selectEleNameOrValue;
  const winOption = createOptions(childUrl, permissonValue, false);
  fin.Window.create(winOption);  
}

function createRawWindow() {
  const apiName = getAPIName();
  window.open(childUrl + '?isRawWindow=true&apiName=' + apiName);
}

function createIframeWindow(selectEleName) {
  const permissonValue = document.querySelector(selectEleName).value;
  const winOption = createOptions('http://localhost:5566/iframe.html', permissonValue, false);
  fin.Window.create(winOption);  
}

function createAppFromManifest() {
  const useCase = document.querySelector("#manifestSelect").value;
  if(useCase === '0') { // no match url, use default settings,  permission missing in manifest
    fin.Application.startFromManifest('http://localhost:5566/unmatched/appNoMatchPermissionMissing.json').then(app => console.log('App0 is running')).catch(err => console.log(err));
  }  
  else if(useCase === '1') { // no match url, use default settings,  permission true in manifest
    fin.Application.startFromManifest('http://localhost:5566/unmatched/appNoMatchPermissionTrue.json').then(app => console.log('App1 is running')).catch(err => console.log(err));
  }
  else if(useCase === '2') { // no match url, use default settings, permission false in manifest
    fin.Application.startFromManifest('http://localhost:5566/unmatched/appNoMatchPermissionFalse.json').then(app => console.log('App2 is running')).catch(err => console.log(err));
  }
  else if(useCase === '3') { // match url, permissions missing in manifest
    fin.Application.startFromManifest('http://localhost:5566/matched/appMatchPermissionMissing.json').then(app => console.log('App3 is running')).catch(err => console.log(err));
  }
  else if(useCase === '4') { // match url, permissions true in manifest
    fin.Application.startFromManifest('http://localhost:5566/matched/appMatchPermissionTrue.json').then(app => console.log('App4 is running')).catch(err => console.log(err));
  } 
  else if(useCase === '5') { // match url, permissions false in manifest
    fin.Application.startFromManifest('http://localhost:5566/matched/appMatchPermissionFalse.json').then(app => console.log('App5 is running')).catch(err => console.log(err));
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
  aLink.href = childUrl + "?isRawWindow=true&apiName=" + getAPIName();
}

function updateIframeSrc(apiName) {
  const iframeTest = document.querySelector("#iframe_test");
  if(iframeTest && apiName) {
    iframeTest.setAttribute('src', childUrl + "?apiName=" + apiName);
  }

  // iframe inside another iframe
  const iframeIframeTest = document.querySelector("#iframe_iframe_test");
  if(iframeIframeTest && apiName) {
    iframeIframeTest.setAttribute('src', childUrl + "?apiName=" + apiName);
  }  
}
 