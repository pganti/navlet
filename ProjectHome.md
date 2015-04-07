# Description #

**_navlet_** is a simple JavaScript bookmarklet that allows an easy visualization of  [W3C Navigation Timing API](http://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overview.html) values through the window.performance.timing host object.

  * **Timeline visualization** :

The Navigation timing API provides really interesting metrics about the main document being loaded : Connect, DNS, request/response duration, first byte time, dom ready, dom loaded,... However all those data are raw absolute UNIX values and difficult to analyse in  a snap. **_navlet_** will render all those data in a graphical timeline and allow a quick overview of the page loading profile in the blink of an eye.

  * **Monitoring mode** :
Usually when doing front end performance benchmarks, a lot of parameters (bandwidth, latency, current CPU availability, ...) can make a one-shot measurement quite inaccurate. The monitor mode allows you to get consistent metrics by aggregating and averaging performance data from one page through multiple reloads.

  * **Demo video** -- video with subtitles/voice coming soon --
<a href='http://www.youtube.com/watch?feature=player_embedded&v=rZZYTIkY-SY' target='_blank'><img src='http://img.youtube.com/vi/rZZYTIkY-SY/0.jpg' width='425' height=344 /></a>




# How to use #

Google Code page does not allow insertion of a bookmarklet anchor in a wiki page. So no easy drag'n drop.

You will have to follow these steps to create it manually:

  * create a favorite (IE) or bookmark (all other browser) targeting an arbitrary url
  * change the target url to this:

```
javascript:(function () {  window.navlet = {  url_root: "http://navlet.googlecode.com/git/",  dev_url_root: "http://localhost/navlet/" };  var loader = document.createElement("div"); loader.setAttribute("id", "navlet-loader"); loader.setAttribute("style", "z-index: 10000;position:fixed;top:0;left:0;background-color:black;color:white;font-weight:bold;font-size: 16px;lime-height:1em;padding:15px 40px;"); document.getElementsByTagName('body')[0].appendChild(loader); loader.innerHTML = "Loading Navlet ...";  var navletPath = "http://navlet.googlecode.com/git/";  var bootstrapNode = document.createElement("script"); bootstrapNode.src= window.navlet.url_root + "navlet.js"; document.getElementsByTagName('head')[0].appendChild(bootstrapNode);  })()
```

  * click on the bookmark/favorite in your toolbar, you should  see the whole navlet UI overlaying your current browsing window.

# Feature list #

  * **Raw Unix values** dumping of W3C Navigation API data
  * Calculation of **meaningful values** (FirstByteTime to DomReady, DomReady to LoadEvent,...)
  * **Timeline representation** of all W3C Navigation Timing values
  * **Monitor mode**: Instead of having values based on one page load, you can spawn a child window that will continously reload. Data will be aggregated and become more accurate with iterations.

# Incoming big features in next version #

  * Possibility to add custom timers in your pages to monitor them in addition to the window.performance object. It will allow a test driven development style for performance issues by running the monitoring mode in the background.
  * Drawing of these custom data in the timeline
  * Optional persistence of settings and/or data using a google account (back end will be using Google App Engine). It's currently localStorage based (thus domain specific).

<a href='Hidden comment: 
A more detailed feature list: FullFeatureList
'></a>

# Supported browsers #

  * Google Chrome 13+
  * IE9+ (make sure your document mode is set to 'IE9 Standards' in developer console)
  * Experimental support on Firefox 7 Aurora (API there but numbers look wrong - should be fixed in Aurora 9)

# Important remarks #

  * In monitoring mode, the current page  is reloaded indefinetly in the background. Some websites detect non-natural reload behaviors and ban culprit IPs. In particular, google properties (and gmail in particular) will detect that and block your IP from one to 24 hours. When you trigger the monitor mode, make sure you are not on one of those websites or keep it limited to few reloads.

# Less important remarks #

  * Current implementation is injecting some markup in the page document. It means that the navlet UI could be affected by some general CSS rules coming from the current inspected page. A future implementation (coming really soon) will encapsulate navlet panels into iframes and protect navlet from nasty global styles.

# Credits #

  * [Hyves.nl](http://hyves.nl): I work here as a part of the design team (JS/CSS patterns, usability and Front-End performance)
  * [Hammerhead](http://stevesouders.com/hammerhead/): I got inspired by this web performance tool (a firefox plugin) developed by the awesome web performance evangelist [Steve Souders](http://stevesouders.com/). It was the first easy-to-use tool to get a statistic insight of page perfomances. It's sadly not maintained anymore.

