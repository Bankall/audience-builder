/**
 * Fetch the real time audience of provided keywords
 *
 * @param {Array} keywords Keywords to use for the analysis
 */
export class AudienceFetcher {
	constructor(keywords) {
		this.keywords = keywords;
		this.pages = 0;
		this.matchingAudience = 0;
		this.analysedAudience = 0;
		this.mediaPlanning = {};
	}

	start() {
		this.handleKeywordsDisplay();
		this.getAnalysisId()
			.then(() => {
				this.timestamp = Date.now();

				this.fetchAudience(true);
				this.fetchGlobalAudience();
				
				this.render();
			})
			.catch(this.errorHandler)
	}

	stop() {
		this.stopping = true;
		this.resetUI();
	}

	// shortcut to fetch API to mutualise error handling
	post(url) {
		return new Promise((resolve) => {
			fetch(url, {
				method: 'POST',
				body: this.keywords.join("\n")
			}).then(response => {
				response.json()
					.then((data) => {
						resolve(data);
					})
					.catch(this.errorHandler);
			}).catch(this.errorHandler);
		});
	}

	renderDailyMatchingAudience() {
		const dailyMatchingAudience = (this.matchingAudience * 1440) * 0.6;
		document.querySelector(".matching-audience-24 .number").innerHTML = dailyMatchingAudience.toLocaleString();
	}
	
	resetUI() {
		document.querySelector(".analysed-audience .number").innerHTML = "-";
		document.querySelector(".matching-audience .number").innerHTML = "-";
		document.querySelector(".matching-audience-24 .number").innerHTML = "-";
		document.querySelector(".mediaplanning .value").innerHTML = "Analyse en cours";
		document.querySelector(".keywords .value .details").innerHTML = "";
	}

	render() {
		if(!this.stopping) {
			this.setTimeout(() => {
				this.render();
			}, 100);
		}

		// sum the total value of matching audience with array reduce
		this.matchingAudience = Object.keys(this.mediaPlanning).reduce((previous, current) => previous + this.mediaPlanning[current], 0);
		document.querySelector(".matching-audience .number").innerHTML = this.matchingAudience ? this.matchingAudience.toLocaleString() : "-"; // toLocalString format numbers in a pretty way

		if(this.analysedAudience) {
			document.querySelector(".analysed-audience .number").innerHTML = this.analysedAudience.toLocaleString();
		}

		if(Object.keys(this.mediaPlanning).length < 6) { // wait until we have enough data to render mediaplanning UI
			return;
		}

		// create an array from the mediapPlanning object sorted by mediaPlanning value
		const mediaPlanningArray = Object.keys(this.mediaPlanning).sort((a, b) => this.mediaPlanning[a] < this.mediaPlanning[b] ? 1: -1);
		// map the array of value to an array of HTML markup
		const mediaPlanningHTML = mediaPlanningArray.map(value => `<div>${value}</div>`);

		document.querySelector(".mediaplanning .value").classList.remove("loading");
		document.querySelector(".mediaplanning .value").innerHTML = mediaPlanningHTML.join("");
	}

	setTimeout(callback, timer) {
		setTimeout(() => {
			if(!this.stopping) {
				callback.call(this);
			}					
		}, timer || 1000);

	}

	fetchAudience(first) {
		this.post(`https://dashboard.platform.pm/wsora/rtkeywords-get.php?id=${this.id}&pages=${Math.round((this.pages / (Date.now() - this.timestamp)) * 86400000)}`)
			.then(data => {
				this.setTimeout(this.fetchAudience);
				
				if(!data) { return; }
				
				if(data.pages) {
					this.pages += data.pages;
				}

				// store received domains into the mediaPlanning object
				Object.keys(data.domains).forEach(value => {
					if(value) {
						this.mediaPlanning[value] = data.domains[value];	
					}					
				});

				if(first) {
					setTimeout(() => {
						this.renderDailyMatchingAudience();
					}, 60000);
				}
			});
	}

	fetchGlobalAudience() {
		this.post(`https://dashboard.platform.pm/wsora/rtkeywords-get.php?id=total&pages=${Math.round((this.pages / (Date.now() - this.timestamp)) * 86400000)}`)
			.then(data => {
				this.setTimeout(this.fetchGlobalAudience, 200);
				data = JSON.parse(data.__debug.pages);

				if(!data) { return; }

				this.analysedAudience += Object.keys(data).reduce((previous, current) => previous + parseInt(data[current], 10), 0);
			});
	}

	getAnalysisId () {
		return new Promise(resolve => {
			this.post(`https://dashboard.platform.pm/wsora/rtkeywords-start.php`)
				.then((data) => {
					this.id = data.id;
					resolve();
				});
		});
	}

	handleKeywordsDisplay () {
		document.querySelector(".keywords .value .details").innerHTML = this.keywords.join(", ");
	}

	handleCSVExport() {
		return `data:text/csv;charset=utf-8,${Object.keys(this.mediaPlanning).join("\n")}`;
	}

	errorHandler(err) {
		console.error(err);
	}

	getResults () {
		return Object.keys(this.mediaPlanning);
	}
}