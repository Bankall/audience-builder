const fetchKeywords = (url, callback) => {

	const wrappedCallback = () => {
		if(callback && typeof callback === "function") {
			callback();
		}
	}

	fetch(`https://rxga0voqfh.execute-api.eu-west-3.amazonaws.com/prod?uri=${encodeURIComponent(url)}`)
		.then((response) => {
			response.json()
				.then((data) => {
					wrappedCallback();
					console.log(data);
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

const startKeywordFinder = (event) => {

	if(event) {
		event.preventDefault();
	}

	const urlInput = document.querySelector("input[name=url]");
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

	fetchKeywords(urlValue, () => {
		urlInput.classList.remove("loading");
	});
};

const clearErrorStatus = () => {
	const urlInput = document.querySelector("input[name=url]");

	if(!urlInput.value) {
		urlInput.classList.remove("error");
		setNewUrlParameter('');
	}
};

const start = () => {
	document.querySelector("input[name=start]").addEventListener("click", startKeywordFinder);
	document.querySelector("input[name=url]").addEventListener("blur", clearErrorStatus);
	
	const urlParams = new URLSearchParams(window.location.search);
	const url = urlParams.get("url");

	if(url) {
		document.querySelector("input[name=url]").value = url;
		startKeywordFinder();
	}
};

document.addEventListener("DOMContentLoaded", start);