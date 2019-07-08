if(window.location.href.indexOf('index.html') > -1) { // ignore iframe
  fin.InterApplicationBus.subscribe({uuid: '*'}, 'needPermissionMap', (msg, identity) => {
    console.log('identity: ', identity);
    fin.InterApplicationBus.send(identity, 'permissionData', window.permissionMap);
  });
}