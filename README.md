# MoodleHelperJS

A tool to facilitate the entry of grades into Moodle. The only requirement is a more-or-less modern web browser.

## Features

* selection of data rows in two intuitive ways
  * a query selecting the first row matching all search terms (case-insensitive, separated by spaces)
  * clicking a row in the table
* optimized for a quick workflow
  * when the correct row has been selected by a query, hit <kbd>Return</kbd> to be taken to the grade input field
    * clicking a table row will also take you the the grade input field
  * entering a grade followed by <kbd>Return</kbd> will write the grade into the table and clear the input mask
* highlighting of modified grades
* will warn before updating non-empty grades or deleting grades
* will warn if you attempt to close the page with unsaved changes
* no data is uploaded to any remote servers: the entire code is run client-side and will work without an Internet connection
* UI language selection (will default to browser language if translations are available)
  * at the moment, only English and German are implemented – feel free to submit translations!

## Usage

* [export](https://docs.moodle.org/39/en/Grade_export#Grade_export_capabilities) the grade table from Moodle as a “text file”, i.e. in CSV format
  ![Screenshot](https://i.imgur.com/2yw51Fb.png)
* edit the grade table using this tool:
  * select the file
    ![Screenshot](https://i.imgur.com/G7RfO0d.png)
  * map the column names to the corresponding labels
    ![Screenshot](https://i.imgur.com/rmH6INT.png)
  * enter grades using the tool
    ![Screenshot](https://i.imgur.com/xVtrS6x.png)
  * save the modified table to a file
* [import](https://docs.moodle.org/39/en/Grade_import#CSV_import) said file into Moodle

## How do I get the tool?

You could:

* clone the GitHub project onto your local computer
* download the tool as a single HTML page from the “Releases“ tab
* use the tool at [dillbox.me](https://www.dillbox.me/MoodleHelperJS/moodlehelper.html)
  * you can also visit this page and save (Ctrl+S) the tool to your hard disk