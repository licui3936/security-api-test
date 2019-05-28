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
  
  fin.desktop.System.showDeveloperTools(uuid, uuid);
  fin.desktop.System.getVersion(version => {
    const ofVersion = document.querySelector("#of-version");
    ofVersion.innerText = version;
  });
}