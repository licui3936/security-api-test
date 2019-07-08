fin.Window.getCurrent().then(win => { 
    win.on('shown', () => {
        console.log('app started: uuid:' + win.identity.uuid + ', name:' + win.identity.name);
        fin.InterApplicationBus.publish('needPermissionMap', 'needPermissionMap');
        fin.InterApplicationBus.subscribe({uuid: 'apiPermissionTest'}, 'permissionData', sub_msg => {
            console.log(sub_msg);
            permissionMap = sub_msg;
        });
    });
});
