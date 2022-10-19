import { words, recordPhrase } from './keyword-extractor.js'

/**
 * This application allow user to enter an url, extract keywords from this url and analyse available audiences of those keywords
 * @param {}  .
 */
const start = () => {

	const urlInput = document.querySelector("input[name=url]");
	const startButton = document.querySelector("input[name=start]");

	/**
	 * Used to parse an array of keywords and built HTML markup
	 *
	 * @param {Array} keywords The keywords to present.
	 */
	const presentKeywords = (keywords) => {
		const wrapper = document.querySelector("#keywords .content");

		if(!keywords.length) {
			keywords = ["Aucun mot-clés trouvé"]; // If we cannot find any keywords, we push an empty wrappe to not break the UI
		}
	
		// built HTML markup to present keywords
		keywords.forEach(keyword => {
			wrapper.innerHTML += 
				`<div class="keyword">
					<input type="checkbox" name="${keyword}" />
					<label for="${keyword}">${keyword}</label>
				</div>`;
		});

		// check all keywords on click
		document.querySelector("#check-keywords").addEventListener("click", () => {
			wrapper.querySelectorAll("input").forEach((input) => {
				input.checked = true;
			});
		});

		// uncheck all keywords on click
		document.querySelector("#uncheck-keywords").addEventListener("click", () => {
			wrapper.querySelectorAll("input").forEach((input) => {				
				input.checked = false;
			});
		});

		// check keyword on click on label
		wrapper.querySelectorAll("label").forEach(label => {
			label.addEventListener("click", () => {
				const forAttribute = label.getAttribute("for");
				const matchingInput = wrapper.querySelector(`input[name="${forAttribute}"]`); // find the matching checkbox (for attribute)
	
				matchingInput.checked = !matchingInput.checked; // invert the value of matching checkbox
			});
		});
	};

	/**
	 * Used to extract keywords from a HTML body
	 *
	 * @param {String} body The HTML content to parse.
	 * @return {Array} the top 30 keywords found, ordered by number of occurence
	 */
	const exctractKeywords = (body) => {
		const emptyDiv = document.createElement("div"); // This empty will be used to clean up HTML markup
		const anchorsContent = body.match(/<a.*?>(.*?)<\/ *a\W/gi); // Extract all anchors content from body

		if(anchorsContent) {
			anchorsContent.forEach(anchor => {
				if(anchor.includes("<meta")) { // we don't want content that include a meta tag
					return;
				}

				if(anchor.includes("<script")) { // we don't want content that include a script tag
					return;
				}

				anchor = anchor.replace(/src(set|)=".*?"/g, ""); // remove src to prevent loading images from the content
				
				if(anchor.match(/[a-zA-Z]/)) {
					/*
					 * Setting the "a" content as innerHTML of an empty div and reading the innerText 
					 * cleans up the HTML markup and let us retrieve the text only 
					 */
					
					emptyDiv.innerHTML = anchor;
					recordPhrase(emptyDiv.innerText); 
				}
			});
		}
		
		/*
		* select all keys of words object 
		* sort the keys with their number of occurencies, 
		* select the 30 first keywords, 
		* returned in an array
		*/
		const wordsArray = Object.keys(words).sort((a, b) => {
			return words[a] < words[b] ? 1: -1;
		}).slice(0, 30);

		return wordsArray;
	};

	/**
	 * Used to fetch the html body of the provided url
	 *
	 * @param {string} url The url to fetch 
	 * @param {function} callback function that will be called with content
	 */
	const fetchURLBody = (url, callback) => {

		// check if it's a valid function 
		const wrappedCallback = (data) => {
			if(callback && typeof callback === "function") {
				callback(data);
			}
		}

		
		// fetch = API JS to make requests 
		// In order to retrieve the HTML content of the targeted URL, we use proprietary proxy to bypass cross-origin issues
		fetch(`https://rxga0voqfh.execute-api.eu-west-3.amazonaws.com/prod?uri=${encodeURIComponent(url)}`) //url encoded with an uri parameter
			.then((response) => { // then => resolve
				response.json() // response = promise
					.then(data => {
						wrappedCallback(data.body);
					})
					.catch(err => { // catch => reject
						wrappedCallback();
						console.log(`error: ${err}`);					
					});
			})
			.catch(err => {  
				wrappedCallback();
				console.log(`error: ${err}`);
			});
	};

	/**
	 * Used to change the query parameter of url
	 * @param {string} value The new query parameter 
	 */
	const setNewUrlParameter = (value) => {
		const newUrl = new URL(window.location); 

		if(value) {
			newUrl.searchParams.set('url', value); //  set in the url field
		} else {
			newUrl.searchParams.delete('url');
		}
		
		window.history.pushState({}, '', newUrl); // use pushState in order to save the url without reloading the page
	}

	/**
	 * Used to verify if url is valid and start to search keywords  
	 */
	const startKeywordFinder = () => {

		let urlValue = urlInput.value;

		if(urlValue && !urlValue.match(/^http/)) { // automatic add of https
			urlValue = `https://${urlValue}`;  // (`https://${urlValue}` = "https://" + urlValue)  if url value haven't http"s" => https:// is automatically added
		}

		// check if the url is valid with a regex pattern
		const isValidUrl = urlValue.match(/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/);

		if(!urlValue || !isValidUrl) {
			return urlInput.classList.add("error"); // return error message if url is not valid or empty
		}

		//classList properties => 3 methods : add, remove, contains
		urlInput.classList.remove("error");
		urlInput.classList.add("loading"); //add a loader to show that searching has began

		setNewUrlParameter(urlInput.value.toLowerCase());

		fetchURLBody(urlValue, (data) => {
			urlInput.classList.remove("loading");  // remove the loader
			startButton.setAttribute("readonly", "readonly"); // set the button on readonly to prevent multiple run
			
			let keywords = [];

			if(data) {
				keywords = exctractKeywords(data);
			}

			presentKeywords(keywords);
		});
	};

	/**
	 * remove error feedback if value is empty
	 */
	const clearErrorStatus = () => {
		if(!urlInput.value) { 
			urlInput.classList.remove("error"); // (classlist (list) 3 properties contain, remove, add) - firebrick border for wrong input text
			setNewUrlParameter('');
		}
	};

	// remove readonly on keydown
	urlInput.addEventListener("keydown", (event) => {
		startButton.removeAttribute("readonly");
	});

	urlInput.addEventListener("blur", clearErrorStatus); // clean error feadback on blur
	
	startButton.addEventListener("click", (event) => {
		event.preventDefault(); 

		if(startButton.hasAttribute("readonly")) { //readonly attribut = boolean - don't start if not url
			return;
		}

		startKeywordFinder();
	});

	const urlParams = new URLSearchParams(window.location.search); 
	const url = urlParams.get("url");

	if(url) { // if we have an url param start immediately
		urlInput.value = url;
		startKeywordFinder();
	}
};

//To be sur that all DOM content is loaded when start function is called (see defer or script src at the end of the body)
document.addEventListener("DOMContentLoaded", start);