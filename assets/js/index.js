const fetchKeywords = (url) => {

	var toto = fetch(`https://rxga0voqfh.execute-api.eu-west-3.amazonaws.com/prod?uri=${encodeURIComponent(url)}`)
//	console.log(toto);
	
	fetch(url)
		.then(function() {
			
		})
		.catch(err => {
			console.log(`error: ${err}`);
		})
};

const startKeywordFinder = (event) => {

	event.preventDefault();

	let urlInput = document.querySelector("input[name=url]");
	let urlValue = urlInput.value;

	if(urlValue && !urlValue.match(/^http/)) {
		urlValue = `https://${urlValue}`;
	}

	let isValidUrl = urlValue.match(/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/);

	if(!urlValue || !isValidUrl) {
		return urlInput.classList.add("error");
	}

	urlInput.classList.remove("error");

	fetchKeywords(urlValue);
};

const start = () => {
	document.querySelector("input[name=start]").addEventListener("click", startKeywordFinder);
};

document.addEventListener("DOMContentLoaded", start);



let images = [
	"https://www.peugeot.fr/content/dam/peugeot/france/b2c/odm/2022/octobre-2022/pac-2/mmt-3-colonnes/208_MultimediaTeaser_D_860x1000_SALON-PEUGE.jpg?imwidth=991",
	"https://www.peugeot.fr/content/dam/peugeot/france/b2c/odm/2022/octobre-2022/pac-2/mmt-3-colonnes/2008_MultimediaTeaser_D_860x1000_SALON-PEUGE.jpg?imwidth=991",
	"https://www.peugeot.fr/content/dam/peugeot/france/b2c/odm/2022/juillet-2022/e208/PEUGEOT_e208_2022_042_1214x1020.jpg?imwidth=991"
];

images.forEach(value => {
	let img = document.createElement("img");
	img.src = value;
})


