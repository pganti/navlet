
//javascript:(function () {  window.navlet = { 	url_root: "http://navlet.googlecode.com/git/" };  var loader = document.createElement("div"); loader.setAttribute("id", "navlet-loader"); loader.setAttribute("style", "position: fixed;top:0;left:0;background-color:black;color:white;font-weight:bold;font-size: 16px;lime-height:1em;padding:15px 40px;"); document.getElementsByTagName('body')[0].appendChild(loader); loader.innerHTML = "Loading Navlet ...";  var navletPath = "http://navlet.googlecode.com/git/";  var bootstrapNode = document.createElement("script"); bootstrapNode.src= window.navlet.url_root + "navlet.js"; document.getElementsByTagName('head')[0].appendChild(bootstrapNode);  })()

javascript:(function () {

window.navlet = {
	url_root: "http://navlet.googlecode.com/git/"
};

var loader = document.createElement("div");
loader.setAttribute("id", "navlet-loader");
loader.setAttribute("style", "position: fixed;top:0;left:0;background-color:black;color:white;font-weight:bold;font-size: 16px;lime-height:1em;padding:15px 40px;");
document.getElementsByTagName('body')[0].appendChild(loader);
loader.innerHTML = "Loading Navlet ...";

var navletPath = "http://navlet.googlecode.com/git/";

var bootstrapNode = document.createElement("script");
bootstrapNode.src= window.navlet.url_root + "navlet.js";
document.getElementsByTagName('head')[0].appendChild(bootstrapNode);

})()