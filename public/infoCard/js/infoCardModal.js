
// The idea of a modal is that it has no idea how the data is displayed. It simply knows that data must be displayed.
// Because of his unknowingness. We can simply paste this code in a different app and it would work. Because it has no restrictions to this website. (next to the WikipediaCommunications.js of course)
function CardModal(SetContentMethod, SetDeveloperDisplayMethod, KeywordsGetterMethod)
{
    this.currentContentData = new ContentData(); // The currently shown ContentData. This class is way below in the page (if you were wondering)
    this.excludedKeywordsList = []; // Keywords which are ignored because the calls to all their pages failed
    this.excludedTitlesList = []; // Titles which are ignored because the calls to the pages retuned an error (many times because of no thumbnail)
    this.tries = 0; // How many times the modal tried to find an article to display
    this.isLoading = false; // A lock boolean to prevent people from calling to the api while the api is still getting data from the previous call.

    this.shownData = []; // All the shown articles. We track them by their titles, so we can directly ask the wiki api the title to display to us (can be seen as a timeline)
    this.currentIndex = 0; // The article we are currently looking at (we use this and the shownData array to go back to the old articles we visited) (can be seen as a position in the timeline)

    this.SetContentMethod = SetContentMethod; // callback to notify whoever gave this as a parameter to display the content (etc etc)
    this.SetDeveloperDisplayMethod = SetDeveloperDisplayMethod;
    this.KeywordsGetterMethod = KeywordsGetterMethod;
}

// This is the internal functionality when the next button is pressed.
CardModal.prototype.NextClicked = function()
{
    // if we are displaying the laters shown data, find a new article
    if(this.currentIndex == this.shownData.length - 1)
    {
        this.tries = 0;
        this.SearchRandomFromKeywords();
    }
    else // Else, this means we pressed 'prev' a few times, and we can go back to the present by pressing next
    {
        this.currentIndex ++;
        this.SetNewContentWithTitle(this.shownData[this.currentIndex], null, false);
    }
}
// This is the internal functionality when the prev button is pressed
CardModal.prototype.PrevClicked = function()
{
    // If we are not at the first article presented. Show the previous article (going back in time baby)
    if(this.currentIndex != 0)
    {
        this.currentIndex --;
        this.SetNewContentWithTitle(this.shownData[this.currentIndex], null, false);
    }
}

CardModal.prototype.SearchRandomFromKeywords = function()
{
    var keywords = this.KeywordsGetterMethod().split(','); // we will use the keywords from the view (which are in one big string) and devide them by comma, so we get an array of strings instead of 1 big string

    // This for loop removes all the keywords which are known to cause problems (known by experience throughout the use of the app)
    for(var j = keywords.length - 1; j >= 0; j--)
    {
        for(var i = 0; i < this.excludedKeywordsList.length; i++)
        {
            if(keywords[j] == this.excludedKeywordsList[i])
            {
                keywords.splice(j, 1); // Bleh, throw this piece of garbage away
                break;
            }
        }
    }

    // When we have keywords to look for, show a random one.
    if(keywords.length > 0 && keywords[0] != "")
    {
        this.SetContentMethod(new ContentData("Loading.."), this.GetIndexInfoObject()); // While we do the search, we wish to show the user that there is progress, so we fill the content data with dummy data (displaying loading text)
        this.SearchAndSetNewContent(keywords[Math.floor(Math.random() * keywords.length)]);
    }
    else
    {
        this.SetContentMethod(new ContentData("No results for given Keywords"), this.GetIndexInfoObject()); // if there are no keywords left after the filter, it means non are valid, so no results can be looked for
    }
}

// Gives back a json file with the data containing which article we are currently looking at and how many articles have been shown in total.
CardModal.prototype.GetIndexInfoObject = function()
{
    return {
        currentIndex: this.currentIndex + 1,
        totalIndex: this.shownData.length
    };
}

// internal call for showing the titles excluded
CardModal.prototype.ShowExcludedTitles = function()
{
    alert(this.excludedTitlesList);
}

// internal call for showing the keywords excluded
CardModal.prototype.ShowExcludedKeywords = function()
{
    alert(this.excludedKeywordsList);
}

CardModal.prototype.SearchAndSetNewContent = function(keyword)
{
    if(this.isLoading == true) // if locked, do an early return, because we are already busy
        return;

    this.isLoading = true; // lock the call, so this cant be called twice while waiting for a callback

    GetSearchResults(keyword,
    (result)=>{
        if(result.length > 1 && result[1].length > 0)
        {
            var titles = result[1]; // the result is a json file, the second element is an array with all the article titles

            // Filter titles which cause problems (list filled duing use of app)
            for(var j = titles.length - 1; j >= 0; j--)
            {
                for(var i = 0; i < this.excludedTitlesList.length; i++)
                {
                    if(titles[j] == this.excludedTitlesList[i])
                    {
                        titles.splice(j, 1);
                        break;
                    }
                }
            }

            // If no titles are left, try finding content fo another keyword in the list
            if(titles.length == 0)
            {
                this.excludedKeywordsList.push(keyword); // Save that this keyword is not to be used again (to be filtered out)
                this.SearchRandomFromKeywords();
                this.SetDeveloperDisplayMethod(this.tries, this.excludedTitlesList, this.excludedKeywordsList);
                return; // early return
            }

            var articleTitle = titles[Math.floor(Math.random() * titles.length)]; // Grab a random article from the article titles given by the result
            this.isLoading = false; //unlock
            this.SetNewContentWithTitle(articleTitle,
                ()=>{
                    // Error callback
                this.excludedTitlesList.push(articleTitle); // Exclude this article from the articles to choose from (to be filtered out)
                this.SearchAndSetNewContent(keyword); // search again with keyword
            }, true);
        }
        else
        {
            this.SetContentMethod(new ContentData("No Result Found"), this.GetIndexInfoObject());
            this.isLoading = false; //unlock
        }
    });
}

CardModal.prototype.SetNewContentWithTitle = function(articleTitle, failedCallback, isNewData)
{
    if(this.isLoading == true) // Locked, early return. We are already busy
        return;

    this.isLoading = true; // Lock, we are waiting for callbacks!

    GetWikiContent(articleTitle,
        (result)=>{
            this.tries++;
            this.SetDeveloperDisplayMethod(this.tries, this.excludedTitlesList, this.excludedKeywordsList);
            if(result.query != undefined)
            {
                var newContentData = new ContentData();
                var pageId = Object.keys(result.query.pages)[0];
                var pageData = result.query.pages[pageId];
                newContentData.title = pageData.title; // We got a page to display!
                // Now lets get its images also!
                GetWikiContentImagesURLs(articleTitle,
                (urls)=>
                {
                    this.isLoading = false;
                    newContentData.imageUrls = urls;

                    // If we are not traveling through time using the prev and next button, then register this content as new data in the timeline.
                    if(isNewData == true)
                    {
                        this.shownData.push(articleTitle);
                        this.currentIndex = this.shownData.length - 1;
                    }

                    this.SetContentMethod(newContentData, this.GetIndexInfoObject()); // Tell the view to set the content, because we have content to display babyyyy!!!!!
                },
                ()=>
                {
                    // No images... Nevermind. We tell the view we have no article.. :(
                    this.isLoading = false;

                    if(failedCallback != undefined)
                        failedCallback();
                });
            }
            else
            {
                // Ew, undefined query. Call callback to indicate the failure!
                this.isLoading = false;
                if(failedCallback != undefined)
                    failedCallback();
            }
        }
    );
}

// The class which represents the article displayed. An object with all the useful data(used by the view to display content)
function ContentData(title, imageUrls)
{
    this.getImgWikiUrl = function(imageFileName)
    {
        return this.getPageUrl() + "#/media/File:" + imageFileName;
    }

    this.getPageUrl = function()
    {
        return WIKI_DOMAIN + "/wiki/" + this.getFormattedTitle();
    }

    this.isDataSet = function()
    {
        return this.title != null && this.title != "" && this.title != undefined;
    }

    this.getFormattedTitle = function()
    {
        return (this.isDataSet() ? this.title.split(' ').join('_') : "");
    }

    this.title = title;
    this.imageUrls = imageUrls == undefined ? [] : imageUrls;
}
