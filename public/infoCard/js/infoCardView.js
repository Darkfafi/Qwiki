
// The super interesting and much containing CardView class.
function CardView()
{

}

// Simply puts callbacks on the menu buttons, so whoever wants to listen to the buttons being pressed, can do so.
CardView.prototype.SetupNavigationButtons = function(prevClickedCallback, nextClickedCallback, moreClickedCallback)
{
    document.getElementById("card-prev-button").onclick = function()
    {
        if(prevClickedCallback != null)
            prevClickedCallback();
    }

    document.getElementById("card-next-button").onclick = function()
    {
        if(nextClickedCallback != null)
            nextClickedCallback();
    }

    document.getElementById("card-more-button").onclick = function()
    {
        if(moreClickedCallback != null)
            moreClickedCallback();
    }
}

// Simply puts callbacks on the debug buttons, so whoever wants to listen to the buttons being pressed, can do so.
CardView.prototype.SetupConsoleButtons = function(excludedTitlesClickedCallback, excludedKeywordsClickedCallback)
{
    document.getElementById("excludes-titles-display").onclick = function()
    {
        excludedTitlesClickedCallback();
    }

    document.getElementById("excludes-keywords-display").onclick = function()
    {
        excludedKeywordsClickedCallback();
    }
}

// Simply displays the given data in the html page by inserting the values inside where needed.
CardView.prototype.SetContent = function(contentData, indexInfoObject)
{
    currentContentData = contentData;
    document.getElementById("card-display-data-title").innerHTML = currentContentData.title; // sets title text
    document.getElementById("card-image-display").src = currentContentData.imageUrls.length > 0 ? currentContentData.imageUrls[0] : ""; // Uses the first image of the returned images array to display (which will be the thumbnail). This is a turnary operator. You can see it as a one line if statement. its "condition ? trueCase : falseCase".
    document.getElementById("img-index-display").innerHTML = indexInfoObject.currentIndex + "/" + indexInfoObject.totalIndex; // will display at which image we currently are at (this is some json object with data)
}

// Will return the values which are inside the keywords input field as one big string
CardView.prototype.GetKeywordsString = function()
{
    return document.getElementById("card-keywords-input-field").value;
}

// Simply displays the values inside the developer buttons (queries etc)
CardView.prototype.SetDeveloperDisplay = function(tries, excludedTitlesList, excludedKeywordsList)
{
    document.getElementById("tries-display").innerHTML = "Queries: " + tries;
    document.getElementById("excludes-titles-display").innerHTML = "Excl Titles: " + excludedTitlesList.length;
    document.getElementById("excludes-keywords-display").innerHTML = "Excl Keywords: " + excludedKeywordsList.length;
}
