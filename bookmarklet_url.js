
//javascript:(function () {  window.navlet = { 	url_root: "http://navlet.googlecode.com/git/" };  var navletPath = "http://navlet.googlecode.com/git/";  var bootstrapNode = document.createElement("script"); bootstrapNode.src= window.navlet.url_root + "navlet.js"; document.getElementsByTagName('head')[0].appendChild(bootstrapNode);  })()

javascript:(function () {

window.navlet = {
	url_root: "http://navlet.googlecode.com/git/"
};

var navletPath = "http://navlet.googlecode.com/git/";

var bootstrapNode = document.createElement("script");
bootstrapNode.src= window.navlet.url_root + "navlet.js";
document.getElementsByTagName('head')[0].appendChild(bootstrapNode);

})()