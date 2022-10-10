import { words, recordPhrase } from './keyword-extractor.js'

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
			keywords = ["Aucun mot-clés trouvé"];
		}

		keywords.forEach(keyword => {
			wrapper.innerHTML += 
				`<div class="keyword">
					<input type="checkbox" name="${keyword}" />
					<label for="${keyword}">${keyword}</label>
				</div>`;
		});

		document.querySelector("#check-keywords").addEventListener("click", () => {
			wrapper.querySelectorAll("input").forEach((input) => {
				input.checked = true;
			});
		});

		document.querySelector("#uncheck-keywords").addEventListener("click", () => {
			wrapper.querySelectorAll("input").forEach((input) => {				
				input.checked = false;
			});
		});

		wrapper.querySelectorAll("label").forEach(label => {
			label.addEventListener("click", () => {
				const forAttribute = label.getAttribute("for");
				const matchingInput = wrapper.querySelector(`input[name="${forAttribute}"]`);
	
				matchingInput.checked = !matchingInput.checked;
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

		let wordsArray = Object.keys(words).sort((a, b) => {
			return words[a] < words[b] ? 1: -1;
		}).slice(0, 30);

		return wordsArray;
	};

	const fetchURLBody = (url, callback) => {

		const wrappedCallback = (data) => {
			if(callback && typeof callback === "function") {
				callback(data);
			}
		}

		fetch(`https://rxga0voqfh.execute-api.eu-west-3.amazonaws.com/prod?uri=${encodeURIComponent(url)}`)
			.then((response) => {
				response.json()
					.then(data => {
						wrappedCallback(data.body);
					})
					.catch(err => {
						wrappedCallback();
						console.log(`error: ${err}`);					
					});
			})
			.catch(err => {
				wrappedCallback();
				console.log(`error: ${err}`);
			});
	};

	const setNewUrlParameter = (value) => {
		const newUrl = new URL(window.location);

		if(value) {
			newUrl.searchParams.set('url', value);
		} else {
			newUrl.searchParams.delete('url');
		}
		
		window.history.pushState({}, '', newUrl);
	}

	const startKeywordFinder = () => {

		let urlValue = urlInput.value;

		if(urlValue && !urlValue.match(/^http/)) {
			urlValue = `https://${urlValue}`;
		}

		const isValidUrl = urlValue.match(/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/);

		if(!urlValue || !isValidUrl) {
			return urlInput.classList.add("error");
		}

		urlInput.classList.remove("error");
		urlInput.classList.add("loading");

		setNewUrlParameter(urlInput.value.toLowerCase());

		fetchURLBody(urlValue, (data) => {
			urlInput.classList.remove("loading");
			startButton.setAttribute("readonly", "readonly");
			
			let keywords = [];

			if(data) {
				keywords = exctractKeywords(data);
			}

			presentKeywords(keywords);
		});
	};

	const clearErrorStatus = () => {
		if(!urlInput.value) {
			urlInput.classList.remove("error");
			setNewUrlParameter('');
		}
	};

	urlInput.addEventListener("keydown", (event) => {
		startButton.removeAttribute("readonly");
	});

	urlInput.addEventListener("blur", clearErrorStatus);
	
	startButton.addEventListener("click", (event) => {
		event.preventDefault();

		if(startButton.hasAttribute("readonly")) {
			return;
		}

		startKeywordFinder();
	});

	const urlParams = new URLSearchParams(window.location.search);
	const url = urlParams.get("url");

	if(url) {
		urlInput.value = url;
		startKeywordFinder();
	}
};

document.addEventListener("DOMContentLoaded", start);