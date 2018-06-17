//https://en.wikipedia.org/w/api.php?action=opensearch&search=Antonio%20Vivaldi // <-- getting search results // (Example for myself)
//https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&titles=Antonio+Vivaldi&format=json // <-- getting content (example for myself)

const WIKI_DOMAIN = "https://en.wikipedia.org"; // Creates a constant variable which contains the url of the wiki page. May the wiki page change their domain, then I only have to change this value to fix all of my code.
const WIKI_API_DOMAIN = WIKI_DOMAIN + "/w/api.php"; // Creates an url directly to the api inside the domain, may they ever change this path, then I only have to change this value to fix my code.

function GetSearchResults(keyWord, success, error)
{
    // With Ajax, we insert a json as parameter with different options.
    $.ajax({
        method: "POST", // I will be doing a post request to the wiki api, You got 3 types of request. POST, GET and REQUEST. Post is to insert inside the api page, Get is to put the parameters inside the url of the api, and Request is any of the 2
        url: WIKI_API_DOMAIN, // The domain to talk to
        crossdomain: true, // Allows me to access their data cross domains. So I don't have to host this page on the wiki domain itself to talk to them
        dataType: "jsonp", // jsonp is needed instead of json to talk across domains. (I don't know why. Some security thingy)
        data: {action: "opensearch", search:keyWord, format: "json"}, // The parameters & values to send to the api.
        success: success, // The callback which will be triggered when the call was a success Callback explained: (we give a method as parameter, and the ajax tool can call that method when it pleases. That is the definiton of a callback)
        error: error // The callback which will be triggered when the call was a failure
    });
}

function GetWikiContent(title, success, error)
{
    $.ajax({
        method: "POST",
        url: WIKI_API_DOMAIN,
        crossdomain: true,
        dataType: "jsonp",
        data: {action: "query", prop:"revisions", rvprop:"content", titles:title, format:"json"},
        success: success,
        error: error
    });
}

// This will gain the names of the images. Because the wiki api wants us to get the actual urls to the images through their names (please don't ask me why. HEHEHE)
function GetWikiContentImageNames(title, success, error)
{
    // Its a bit of a horrible api in my opinion. We have to get the main image with a different call than the images inside the wiki page. This makes it so I have to do 2 calls to get all the images.
    // Though, at the current stage. The app only uses the page image to display the preview. Because the more button is not functional yet
    $.ajax({
        method: "POST",
        url: WIKI_API_DOMAIN,
        crossdomain: true,
        dataType: "jsonp",
        data: {action:"query", prop:"pageimages", titles:title, format:"json", piprop:"original", pilicense:"any"},
        success: function(result) // If successful, we can do our second call.
        {
            // When, for some bloody reason (which the wiki api tends to do) it will not include a query. We must return it as a failed call. (do the error callback for us to use in the app)
            if(result.query == undefined)
            {
                error("Query unavailable");
                return; // early return. We don't want to execute the rest of the code when the result query is not defined. (in JavaScript a way to say it was never set)
            }

            // Getting the data out of the json file (aka, the result variable (the parameter given by the success callback))
            var pageId = Object.keys(result.query.pages)[0]; // The data is hidden inside the id of the page. So I use the key trick I showed you in the meteor problem to get the id and use that to get deeper inside the json file
            var pageData = result.query.pages[pageId]; // After using that id, I have full access to the json data I want. This is now inside pageData and will be used in the rest of the code.
            var imageNames = [];
            var resultsProcessed = 0;
            $.ajax({
                method: "POST",
                url: WIKI_API_DOMAIN,
                crossdomain: true,
                dataType: "jsonp",
                data: {action:"query", prop:"images", titles:title, format:"json"},
                success: function(result2)
                {
                    if(result2.query == undefined)
                    {
                        error("Query unavailable");
                        return;
                    }
                    var pageId2 = Object.keys(result2.query.pages)[0];
                    var contentData = result2.query.pages[pageId2];
                    if(contentData.images != undefined)
                    {
                        for(var i = 0; i < contentData.images.length; i++)
                        {
                            imageNames.push(contentData.images[i].title);
                            if(++resultsProcessed == contentData.images.length)
                            {
                                var tnURL = pageData.original != undefined ? pageData.original.source : ""; // This is a turnary operator. You can see it as a one line if statement. its "condition ? trueCase : falseCase". So in this example we want to use the source only when it is defined, else we will just return an empty string
                                success
                                (
                                    // Now we call our own success method and give it a custom json file with some image info
                                    {
                                        thumbnailName: "File:" + pageData.pageimage, // The thumbnail image we will be using (the name of it)
                                        thumbnailURL: tnURL, // The thumbnail image we will be using (the url to it)
                                        contentImageNames: imageNames // All the other image names which can be used to gain their urls
                                    }
                                );
                            }
                        }
                    }
                    else
                    {
                        error("No Images Found!");
                    }
                },
                error: error
            });
        },
        error: error
    });
}

// This method will return all the image urls instead of just their names
function GetWikiContentImagesURLs(title, success, error)
{
    // First we want to get all the names to use to ask the wiki api kindly to give us the urls to (so we can actually display them)
    GetWikiContentImageNames(title, (data)=>
    {
        // We are currently inside the success callback (look at the lumbda expression (data)=>{}, which is basically a function without a name, so we can write functions inside parameters like the cool kids we are)
        var resultsFinished = 0;
        var names = data.contentImageNames;

        // If there is no thumbnail url, then I am not interested, I want to return an error to the caller of this method saying he should give me only an article with a thumbnail (because we are badass like that)
        if(data.thumbnailURL == "")
        {
            error("No Page Image");
            return;
        }

        // An url array which already contains the thumbnail as first url
        var urls = [data.thumbnailURL];

        // now for every image name we have, we will do a call to the wikipedia api to give us the url of it. (THANKS WIKI API).
        // Ps, maybe you can give them all in one call, which would be better. I did not bother to do the research. I wanted to make my cool product ;)
        for(var i = 0; i < names.length; i++)
        {
            $.ajax({
                method: "POST",
                url: WIKI_API_DOMAIN,
                crossdomain: true,
                dataType: "jsonp",
                data: {action:"query", prop:"imageinfo", iiprop:"url", titles:names[i], format:"json"},
                success: function(result2)
                {
                    if(result2.query == undefined)
                    {
                        error("Query unavailable");
                        return;
                    }
                    var pageId = Object.keys(result2.query.pages)[0];
                    var imgData = result2.query.pages[pageId];
                    urls.push(imgData.imageinfo[0].url);
                    resultsFinished++; // With every success, we count the results up, if the results are the total of the names, we are done getting all the urls, and we can call the success callback to let the caller know he is ready to use the data.
                    if(resultsFinished == names.length)
                        success(urls);
                },
                error: error
            });
        }
    }, error);
}
