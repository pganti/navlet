
//javascript:(function () {  var navletPath = "http://navlet.googlecode.com/git/"; var head = document.getElementsByTagName('head')[0];  var bootstrapNode = document.createElement("script"); bootstrapNode.src= navletPath + "navlet.js";  var linkNode = document.createElement('link'); linkNode.id = 'navlet-css'; linkNode.type = 'text/css'; linkNode.rel = 'stylesheet'; linkNode.href = navletPath + 'navlet.css'; linkNode.media = 'screen';  head.appendChild(bootstrapNode); head.appendChild(linkNode);  })()

javascript:(function () {

var navletPath = "http://navlet.googlecode.com/git/";
var head = document.getElementsByTagName('head')[0];

var bootstrapNode = document.createElement("script");
bootstrapNode.src= navletPath + "navlet.js";

var linkNode = document.createElement('link');
linkNode.id = 'navlet-css';
linkNode.type = 'text/css';
linkNode.rel = 'stylesheet';
linkNode.href = navletPath + 'navlet.css';
linkNode.media = 'screen';

head.appendChild(bootstrapNode);
head.appendChild(linkNode);

})()